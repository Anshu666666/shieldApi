# ShieldAPI - Gateway Service (`apps/gateway`)

FastAPI reverse proxy micro-kernel.

## Responsibilities
- **HTTP Routing**: Forwards requests to downstream target microservices.
- **Plugins**:
  - `IP Blacklist Validator`: Rejects requests from blocked IPs stored in Redis.
  - `API Key Validator`: Authenticates headers against hashed keys in Redis.
  - `Token Bucket Rate Limiter`: Manages request quotas per key/IP using Redis atomic token bucket scripts.
- **Traffic Log Emitter**: Streams access log entries for consumption by the Anomaly Guardian engine.

## Structure
```
apps/gateway/
├── app/
│   ├── main.py         # FastAPI application entrypoint
│   ├── config.py       # Gateway configuration
│   ├── plugins/        # Micro-kernel plugins (auth, limiter, blacklist)
│   └── router.py       # Proxy forwarding logic
├── Dockerfile
├── requirements.txt
└── README.md
```
