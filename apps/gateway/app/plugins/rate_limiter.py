from fastapi import Request
from fastapi.responses import JSONResponse
from packages.shared.redis_manager import RedisManager
from app.config import settings

class RateLimiterPlugin:
    """
    Micro-kernel plugin enforcing atomic Token Bucket rate limiting
    via the Redis Lua script (token_bucket.lua).
    """

    @classmethod
    def check_limit(
        cls,
        client_ip: str,
        api_key: str = None,
        capacity: int = None,
        refill_rate: float = None
    ) -> tuple[bool, JSONResponse | None]:
        """
        Executes atomic Redis Token Bucket script.
        Returns (is_allowed: bool, error_response: JSONResponse | None).
        """
        cap = capacity or settings.DEFAULT_RATE_LIMIT_CAPACITY
        refill = refill_rate or settings.DEFAULT_RATE_LIMIT_REFILL

        try:
            allowed = RedisManager.check_rate_limit(
                ip=client_ip,
                api_key=api_key,
                capacity=cap,
                refill_rate=refill
            )

            if not allowed:
                return False, JSONResponse(
                    status_code=429,
                    content={
                        "error": "Too Many Requests: Rate limit exceeded",
                        "capacity": cap,
                        "refill_rate": refill,
                        "retry_after_seconds": 1,
                        "status": 429
                    },
                    headers={
                        "Retry-After": "1",
                        "X-RateLimit-Limit": str(cap),
                        "X-RateLimit-Remaining": "0"
                    }
                )

            return True, None

        except Exception as e:
            print(f"[ShieldAPI RateLimiterPlugin] Redis check error: {e}")
            # Fail-open safeguard per SRS Requirement 5.2
            return True, None
