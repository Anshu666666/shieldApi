import json
from fastapi import Request
from fastapi.responses import JSONResponse
from packages.shared.redis_manager import RedisManager

class ApiKeyValidatorPlugin:
    """
    Micro-kernel plugin that authenticates incoming HTTP headers against
    cryptographically stored API key hashes in the Redis Broker (HGET api_keys).
    """

    EXEMPT_PATHS = [
        "/health",
        "/docs",
        "/openapi.json",
        "/redoc",
        "/admin/metrics",
        "/admin/keys",
        "/admin/blocked-ips",
        "/admin/services",
        "/admin/logs"
    ]

    @classmethod
    def validate(cls, request: Request) -> tuple[bool, str | None, dict | None, JSONResponse | None]:
        """
        Validates the X-API-Key header.
        Returns (is_valid: bool, key_str: str | None, metadata: dict | None, error_response: JSONResponse | None).
        """
        path = request.url.path

        # Allow exempt administrative, health, and docs endpoints without API key
        if any(path.startswith(exempt) for exempt in cls.EXEMPT_PATHS):
            return True, None, None, None

        api_key = request.headers.get("x-api-key")
        if not api_key:
            return False, None, None, JSONResponse(
                status_code=401,
                content={
                    "error": "Unauthorized: Missing X-API-Key header",
                    "path": path,
                    "status": 401
                }
            )

        try:
            metadata_str = RedisManager.validate_api_key(api_key)
            if not metadata_str:
                return False, api_key, None, JSONResponse(
                    status_code=401,
                    content={
                        "error": "Unauthorized: Invalid API key",
                        "status": 401
                    }
                )

            # Parse JSON metadata if available
            try:
                metadata = json.loads(metadata_str)
            except Exception:
                metadata = {"raw": metadata_str}

            return True, api_key, metadata, None

        except Exception as e:
            print(f"[ShieldAPI ApiKeyValidatorPlugin] Redis check error: {e}")
            # Fail-open safeguard per SRS Requirement 5.2
            return True, api_key, None, None
