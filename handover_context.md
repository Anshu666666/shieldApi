# ShieldAPI Project Context & Handover Document

This document captures the current development progress of ShieldAPI. It serves as a context guide for the next developer taking over the **FastAPI Gateway** implementation, providing details on what has been built so far and how the existing modules interact.

---

## 1. Development Progress Summary (What's Done)

✅ **Anomaly Guardian Engine (Pipes & Filters Architecture)**: Fully coded and integrated. Runs as a background service monitoring logs and detecting threats.
✅ **Redis Shared Memory Manager**: Fully implemented in `packages/shared/redis_manager.py`. It handles Token Bucket rate limiting, IP blacklisting with a 24-hour TTL, and API Key management.
✅ **Docker Orchestration**: The `docker-compose.yml` has been updated so that all services build from the root context (`.`), allowing them to share the `packages/shared/` codebase effortlessly. Redis is up and running.
✅ **Verification**: A test script (`test_redis_manager.py`) has been run against the live Redis container, confirming all operations work as expected.

---

## 2. The Anomaly Guardian Engine (How it Works)

The Python background script (`apps/anomaly-engine/engine/main.py`) acts as a sequential data pipeline without slowing down the main Gateway.

*   **The Foundation (`watchdog`)**: It skips old logs and waits for new traffic using `f.seek(0, os.SEEK_END)`, saving RAM and CPU.
*   **Filter 1: The Listener (`process_new_logs`)**: Wakes up on log file changes, reads appended lines, and pipes them.
*   **Filter 2: The Parser (`filter2_parse`)**: Uses Regex to extract the **Client IP** and **HTTP Status Code** (ignoring 200 OKs, capturing 401, 403, 404, 500).
*   **Filter 3: The Detector (`filter3_detect`)**: Maintains a sliding window state. If it sees > 50 errors in a 10-second window, it triggers a breach.
*   **Filter 4: The Blocker (`filter4_block`)**: Connects to the shared Redis manager and executes `RedisManager.block_ip(ip, ttl_seconds=86400)`, instantly adding the IP to the Redis blacklist for 24 hours.

---

## 3. Integration Bridges for the FastAPI Gateway Developer

As the developer building the FastAPI Gateway, you are entirely decoupled from the Anomaly Engine code, but you must bridge to it using **Shared Storage** and **Shared Memory**.

### Bridge 1: Shared Storage (The Traffic Logs)
*   **How it connects**: In `docker-compose.yml`, both the gateway and the anomaly-engine are mounted to `- shared_logs:/var/log/shieldapi`.
*   **Your Task**: When you build the FastAPI Gateway, you must configure your application to write access logs to `/var/log/shieldapi/access.log`. The Anomaly Engine will automatically detect and parse this file.

### Bridge 2: Shared Memory (Redis via `RedisManager`)
*   **How it connects**: Both your Gateway and the Anomaly Engine connect to the same Redis container (port 6379).
*   **Your Task**: You do **not** need to write raw Redis code or Lua scripts. Simply import the shared manager:
    ```python
    from packages.shared.redis_manager import RedisManager
    ```
*   **Gateway Implementation Checklist**:
    1.  **IP Blacklisting**: For every incoming request, check `RedisManager.is_ip_blocked(client_ip)`. If `True`, drop the request immediately with a `403 Forbidden` error.
    2.  **API Key Validation**: Extract the `X-API-Key` header and check `RedisManager.validate_api_key(key)`. If invalid, return `401 Unauthorized`.
    3.  **Rate Limiting**: Check `RedisManager.check_rate_limit(ip=client_ip, api_key=key, capacity=10, refill_rate=2.0)`. If `False`, return `429 Too Many Requests`.

---

## 4. Admin Dashboard Integration (For the Frontend Developer)

*   The React Dashboard will also read from the exact same Redis broker.
*   Whenever the Gateway or Anomaly Engine updates Redis (e.g., adding an IP to `blocked_ips`), the Dashboard's API will fetch and display it on the UI's Anomaly Feed in real-time.
