from fastapi import Request
from fastapi.responses import JSONResponse
from packages.shared.redis_manager import RedisManager

class IPBlacklistPlugin:
    """
    Micro-kernel plugin that checks if the incoming client IP address
    is currently present in the Redis blacklist (with TTL).
    """

    @staticmethod
    def extract_client_ip(request: Request) -> str:
        # Check X-Forwarded-For header first (useful behind reverse proxies / Docker)
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()

        # Fallback to direct client host
        if request.client and request.client.host:
            return request.client.host
        
        return "127.0.0.1"

    @classmethod
    def validate(cls, request: Request) -> tuple[bool, str, JSONResponse | None]:
        """
        Validates client IP against RedisManager.
        Returns (is_allowed: bool, client_ip: str, response: JSONResponse | None).
        """
        client_ip = cls.extract_client_ip(request)

        try:
            is_blocked = RedisManager.is_ip_blocked(client_ip)
            if is_blocked:
                return False, client_ip, JSONResponse(
                    status_code=403,
                    content={
                        "error": "Forbidden: IP address is blacklisted",
                        "client_ip": client_ip,
                        "reason": "Hostile activity detected by Anomaly Guardian",
                        "status": 403
                    }
                )
        except Exception as e:
            print(f"[ShieldAPI IPBlacklistPlugin] Redis check failed: {e}")
            # Fail-open safeguard per SRS Requirement 5.2
            return True, client_ip, None

        return True, client_ip, None
