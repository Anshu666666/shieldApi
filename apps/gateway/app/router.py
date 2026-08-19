import time
import httpx
from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse, Response

from app.config import settings
from app.plugins.ip_blacklist import IPBlacklistPlugin
from app.plugins.api_key import ApiKeyValidatorPlugin
from app.plugins.rate_limiter import RateLimiterPlugin
from app.logging_emitter import log_emitter

router = APIRouter()

# Reusable HTTPX async client for high performance connection pooling
http_client = httpx.AsyncClient(timeout=10.0)

# Blacklisted response headers to strip before returning to client (SRS Requirement 5.3)
SENSITIVE_HEADERS = {"x-powered-by", "server", "x-aspnet-version"}

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy_forward(request: Request, path: str):
    start_time = time.time()
    method = request.method
    request_path = f"/{path}"

    # -------------------------------------------------------------
    # 1. Micro-Kernel Plugin: IP Blacklist Check
    # -------------------------------------------------------------
    is_ip_allowed, client_ip, ip_err_res = IPBlacklistPlugin.validate(request)
    if not is_ip_allowed and ip_err_res:
        latency_ms = (time.time() - start_time) * 1000
        await log_emitter.emit_log(
            client_ip=client_ip,
            method=method,
            path=request_path,
            status_code=403,
            latency_ms=latency_ms,
            response_size=len(ip_err_res.body),
            user_agent=request.headers.get("user-agent", "ShieldAPI-Agent")
        )
        return ip_err_res

    # -------------------------------------------------------------
    # 2. Micro-Kernel Plugin: API Key Authentication
    # -------------------------------------------------------------
    is_key_valid, api_key, key_meta, key_err_res = ApiKeyValidatorPlugin.validate(request)
    if not is_key_valid and key_err_res:
        latency_ms = (time.time() - start_time) * 1000
        await log_emitter.emit_log(
            client_ip=client_ip,
            method=method,
            path=request_path,
            status_code=401,
            latency_ms=latency_ms,
            response_size=len(key_err_res.body),
            user_agent=request.headers.get("user-agent", "ShieldAPI-Agent")
        )
        return key_err_res

    # -------------------------------------------------------------
    # 3. Micro-Kernel Plugin: Token Bucket Rate Limiter
    # -------------------------------------------------------------
    key_capacity = None
    key_refill = None
    if key_meta and isinstance(key_meta, dict):
        if "rateLimitCapacity" in key_meta:
            key_capacity = int(key_meta["rateLimitCapacity"])
        elif "rateLimitRpm" in key_meta:
            key_capacity = max(10, int(key_meta["rateLimitRpm"]) // 60)
            
        if "rateLimitRefill" in key_meta:
            key_refill = float(key_meta["rateLimitRefill"])
        elif key_capacity:
            key_refill = float(key_capacity) / 5.0

    is_rate_allowed, rate_err_res = RateLimiterPlugin.check_limit(
        client_ip=client_ip,
        api_key=api_key,
        capacity=key_capacity,
        refill_rate=key_refill
    )
    if not is_rate_allowed and rate_err_res:
        latency_ms = (time.time() - start_time) * 1000
        await log_emitter.emit_log(
            client_ip=client_ip,
            method=method,
            path=request_path,
            status_code=429,
            latency_ms=latency_ms,
            response_size=len(rate_err_res.body),
            user_agent=request.headers.get("user-agent", "ShieldAPI-Agent")
        )
        return rate_err_res

    # -------------------------------------------------------------
    # 4. Proxy Forwarding to Downstream Microservice
    # -------------------------------------------------------------
    target_base = settings.BACKEND_SERVICE_URL.rstrip("/")
    target_url = f"{target_base}/{path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    # Forward headers excluding host
    headers = {k: v for k, v in request.headers.items() if k.lower() not in {"host", "content-length"}}
    headers["x-forwarded-for"] = client_ip
    headers["x-shieldapi-proxy"] = "true"

    body = await request.body()

    try:
        downstream_res = await http_client.request(
            method=method,
            url=target_url,
            headers=headers,
            content=body
        )

        latency_ms = (time.time() - start_time) * 1000
        status_code = downstream_res.status_code
        content = downstream_res.content

        # Filter out sensitive server headers per SRS Req 5.3
        cleaned_headers = {
            k: v for k, v in downstream_res.headers.items()
            if k.lower() not in SENSITIVE_HEADERS and k.lower() not in {"content-encoding", "transfer-encoding"}
        }

        # Emit log line for Anomaly Guardian
        await log_emitter.emit_log(
            client_ip=client_ip,
            method=method,
            path=request_path,
            status_code=status_code,
            latency_ms=latency_ms,
            response_size=len(content),
            user_agent=request.headers.get("user-agent", "ShieldAPI-Agent")
        )

        return Response(
            content=content,
            status_code=status_code,
            headers=cleaned_headers,
            media_type=downstream_res.headers.get("content-type")
        )

    except httpx.RequestError as exc:
        latency_ms = (time.time() - start_time) * 1000
        print(f"[ShieldAPI Proxy Router] Downstream connection failed: {exc}")

        # Emit 502 log for Anomaly Guardian
        await log_emitter.emit_log(
            client_ip=client_ip,
            method=method,
            path=request_path,
            status_code=502,
            latency_ms=latency_ms,
            response_size=0,
            user_agent=request.headers.get("user-agent", "ShieldAPI-Agent")
        )

        return JSONResponse(
            status_code=502,
            content={
                "error": "Bad Gateway: Downstream microservice is unreachable",
                "target_url": target_url,
                "status": 502
            }
        )
