import time
import os
import sys

# Ensure packages can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from packages.shared.redis_manager import RedisManager

def test_redis():
    print("Starting Redis Manager Tests...")

    # Test 1: API Keys
    print("\n--- Test 1: API Key Management ---")
    RedisManager.generate_api_key("test_key_123", '{"user": "Alice"}')
    val = RedisManager.validate_api_key("test_key_123")
    print(f"Validated key: {val}")
    assert val == '{"user": "Alice"}'
    
    RedisManager.revoke_api_key("test_key_123")
    val_after = RedisManager.validate_api_key("test_key_123")
    print(f"Key after revocation: {val_after}")
    assert val_after is None

    # Test 2: Rate Limiting
    print("\n--- Test 2: Token Bucket Rate Limiting ---")
    ip = "192.168.1.100"
    # capacity=3, refill_rate=1.0 per sec
    allowed_count = 0
    for i in range(5):
        allowed = RedisManager.check_rate_limit(ip=ip, capacity=3, refill_rate=1.0)
        print(f"Request {i+1} allowed: {allowed}")
        if allowed:
            allowed_count += 1
    
    assert allowed_count == 3, "Only 3 requests should be allowed initially"
    
    print("Waiting 2 seconds for tokens to refill...")
    time.sleep(2)
    allowed = RedisManager.check_rate_limit(ip=ip, capacity=3, refill_rate=1.0)
    print(f"Request after refill allowed: {allowed}")
    assert allowed == True, "Request should be allowed after waiting"

    # Test 3: IP Blocking
    print("\n--- Test 3: IP Blocking (with TTL) ---")
    bad_ip = "10.0.0.55"
    RedisManager.block_ip(bad_ip, ttl_seconds=2)
    
    is_blocked = RedisManager.is_ip_blocked(bad_ip)
    print(f"Is {bad_ip} blocked? {is_blocked}")
    assert is_blocked == True
    
    active_blocks = RedisManager.get_all_blocked_ips()
    print(f"Active blocked IPs: {active_blocks}")
    assert bad_ip in active_blocks
    
    print("Waiting 3 seconds for TTL to expire...")
    time.sleep(3)
    
    is_blocked_after = RedisManager.is_ip_blocked(bad_ip)
    print(f"Is {bad_ip} blocked after TTL? {is_blocked_after}")
    assert is_blocked_after == False
    
    active_blocks_after = RedisManager.get_all_blocked_ips()
    print(f"Active blocked IPs after TTL: {active_blocks_after}")
    assert bad_ip not in active_blocks_after
    
    print("\n✅ All tests passed successfully!")

if __name__ == "__main__":
    test_redis()
