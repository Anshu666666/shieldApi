import os
import time
import redis

# Use environment variables with fallbacks for local dev
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

# Initialize Redis client
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)

# Load Lua script for Token Bucket Rate Limiting
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LUA_SCRIPT_PATH = os.path.join(SCRIPT_DIR, "token_bucket.lua")

with open(LUA_SCRIPT_PATH, "r") as f:
    lua_script_content = f.read()

# Register the script with Redis (this prepares it on the server for faster execution)
token_bucket_script = r.register_script(lua_script_content)

class RedisManager:
    """
    Centralized Redis management class handling API Keys, Rate Limiting, and IP Blocking.
    """

    # ---------------------------------------------------------
    # IP Blacklisting (with TTL)
    # ---------------------------------------------------------
    @staticmethod
    def block_ip(ip: str, ttl_seconds: int = 86400):
        """
        Blocks an IP for a specific duration using a regular key with TTL,
        and adds it to a set for easier retrieval by the dashboard.
        """
        r.setex(f"blocked_ip:{ip}", ttl_seconds, "1")
        # Also add to the set for the dashboard UI to list easily
        r.sadd("blocked_ips", ip)

    @staticmethod
    def is_ip_blocked(ip: str) -> bool:
        """
        Checks if an IP is currently blocked (respects TTL).
        """
        # If the key expired, it will return False.
        # We also lazily clean up the set if the key is gone.
        is_blocked = r.exists(f"blocked_ip:{ip}")
        if not is_blocked:
            r.srem("blocked_ips", ip)
            return False
        return True

    @staticmethod
    def get_all_blocked_ips() -> list:
        """
        Retrieves all currently blocked IPs (used by Admin Dashboard).
        """
        ips = r.smembers("blocked_ips")
        active_ips = []
        for ip in ips:
            # Verify it hasn't expired
            if r.exists(f"blocked_ip:{ip}"):
                active_ips.append(ip)
            else:
                # Cleanup expired IPs from the set
                r.srem("blocked_ips", ip)
        return active_ips

    @staticmethod
    def unblock_ip(ip: str):
        """
        Manually unblocks an IP.
        """
        r.delete(f"blocked_ip:{ip}")
        r.srem("blocked_ips", ip)

    # ---------------------------------------------------------
    # API Key Management
    # ---------------------------------------------------------
    @staticmethod
    def generate_api_key(key: str, metadata: str):
        """
        Stores an API key and its associated metadata (e.g., user info) in a Hash.
        """
        r.hset("api_keys", key, metadata)

    @staticmethod
    def validate_api_key(key: str) -> str:
        """
        Checks if an API key exists and returns its metadata, else None.
        """
        return r.hget("api_keys", key)

    @staticmethod
    def revoke_api_key(key: str):
        """
        Deletes an API key.
        """
        r.hdel("api_keys", key)

    # ---------------------------------------------------------
    # Rate Limiting
    # ---------------------------------------------------------
    @staticmethod
    def check_rate_limit(ip: str, api_key: str = None, capacity: int = 10, refill_rate: float = 2.0) -> bool:
        """
        Checks the rate limit using the atomic Lua Token Bucket script.
        Combines API Key (if present) and IP for the identifier.
        """
        # Default to API Key + IP, fallback to just IP
        if api_key:
            identifier = f"rate_limit:{ip}:{api_key}"
        else:
            identifier = f"rate_limit:{ip}"
        
        now = time.time()
        
        # Execute the Lua script
        # keys=[identifier], args=[capacity, refill_rate, now]
        result = token_bucket_script(keys=[identifier], args=[capacity, refill_rate, now])
        
        # Script returns 1 if allowed, 0 if rate limited
        return result == 1
