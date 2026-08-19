import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(
    title="ShieldAPI Protected Target Backend",
    description="Sample downstream microservice fronted by ShieldAPI Gateway",
    version="1.0.0"
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "target-backend-service", "timestamp": time.time()}

@app.get("/api/v1/target")
async def get_target_data(request: Request):
    return {
        "status": "success",
        "service": "Protected Target Microservice",
        "message": "Hello from downstream microservice! Request successfully routed through ShieldAPI Gateway.",
        "client_ip": request.client.host if request.client else "unknown",
        "timestamp": time.time()
    }

@app.post("/api/v1/payments")
async def process_payment(request: Request):
    body = await request.json() if request.headers.get("content-type") == "application/json" else {}
    return {
        "status": "processed",
        "service": "Payments Ingestion API",
        "transaction_id": f"tx_{int(time.time() * 1000)}",
        "amount": body.get("amount", 100.0),
        "currency": body.get("currency", "USD"),
        "timestamp": time.time()
    }

@app.get("/api/v1/users/profile")
async def get_user_profile():
    return {
        "status": "success",
        "service": "Users & Accounts API",
        "user_id": "usr_9942",
        "name": "Enterprise Client",
        "tier": "ENTERPRISE",
        "scopes": ["read", "write", "admin"]
    }

@app.get("/api/v1/auth/verify")
async def verify_auth():
    return {
        "status": "valid",
        "service": "Identity & Auth Service",
        "authenticated": True,
        "token_type": "Bearer"
    }

@app.get("/api/v1/events")
async def get_events():
    return {
        "status": "success",
        "service": "Telemetry & Events Stream",
        "events_count": 1420
    }

# Fallback route for all other paths
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def catch_all(request: Request, path: str):
    return {
        "status": "routed",
        "path": f"/{path}",
        "method": request.method,
        "headers_received": dict(request.headers),
        "timestamp": time.time()
    }
