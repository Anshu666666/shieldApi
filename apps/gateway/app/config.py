import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Gateway settings
    GATEWAY_HOST: str = os.getenv("GATEWAY_HOST", "0.0.0.0")
    GATEWAY_PORT: int = int(os.getenv("GATEWAY_PORT", "8000"))

    # Redis settings
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))

    # Target Backend Microservice URL
    BACKEND_SERVICE_URL: str = os.getenv("BACKEND_SERVICE_URL", "http://localhost:8001")

    # Logging Path for Anomaly Guardian Watchdog
    LOG_FILE_PATH: str = os.getenv("LOG_FILE_PATH", "/var/log/shieldapi/access.log")

    # Default Token Bucket Parameters
    DEFAULT_RATE_LIMIT_CAPACITY: int = int(os.getenv("DEFAULT_RATE_LIMIT_CAPACITY", "10"))
    DEFAULT_RATE_LIMIT_REFILL: float = float(os.getenv("DEFAULT_RATE_LIMIT_REFILL", "2.0"))

    # Security & Safeguards
    FAIL_OPEN_ON_REDIS_ERROR: bool = True
    STRIP_SERVER_HEADERS: bool = True

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
