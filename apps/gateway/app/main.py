import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.admin import admin_router
from app.router import router as proxy_router
from packages.shared.redis_manager import r

app = FastAPI(
    title="ShieldAPI Gateway",
    description="Micro-Kernel HTTP Reverse Proxy with Token Bucket Rate Limiting and Anomaly Defense",
    version="1.0.0"
)

# Configure CORS for Dashboard UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    print("=" * 60)
    print("🛡️  ShieldAPI Gateway Core Online")
    print(f"📡  Reverse Proxy Target: {settings.BACKEND_SERVICE_URL}")
    print(f"💾  Redis Broker: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
    print(f"📝  Access Logs Volume: {settings.LOG_FILE_PATH}")
    print("=" * 60)

    # Pre-populate sample test key in Redis if empty
    try:
        if not r.hexists("api_keys", "test_key_123"):
            r.hset("api_keys", "test_key_123", '{"id":"key-1","name":"Production Core Client","owner":"Platform Engineering","tier":"ENTERPRISE","status":"ACTIVE","rateLimitRpm":5000}')
            print("🔑 Seeded initial API key: test_key_123")
    except Exception as e:
        print(f"[ShieldAPI Startup] Redis connection notice: {e}")

@app.get("/health", tags=["Health"])
async def root_health():
    try:
        r.ping()
        redis_ok = True
    except Exception:
        redis_ok = False

    return {
        "status": "healthy",
        "service": "shieldapi-gateway",
        "redis_connected": redis_ok,
        "timestamp": time.time()
    }

# 1. Mount Admin / Telemetry Endpoints First
app.include_router(admin_router)

# 2. Mount Catch-All Reverse Proxy Router
app.include_router(proxy_router)
