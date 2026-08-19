"""
ShieldAPI - End-to-End Automated Integration Test Suite
Tests the complete Dockerized stack:
  1. FastAPI Gateway (:8000)
  2. Redis Broker (:6379)
  3. Anomaly Guardian (Pipes & Filters Log Tail + Auto-Blocker)
  4. Downstream Target Microservice (:8001)
  5. Admin Telemetry & Key Management API

Usage:
  1. Run `docker-compose up --build`
  2. In a new terminal, run: `python test_e2e_integration.py`
"""

import time
import requests
import sys

GATEWAY_URL = "http://localhost:8000"
BACKEND_URL = "http://localhost:8001"
TEST_API_KEY = "test_key_123"

def print_banner(text):
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)

def test_gateway_health():
    print("\n[TEST 1] Checking Gateway & Redis Connectivity...")
    try:
        res = requests.get(f"{GATEWAY_URL}/health", timeout=5)
        print(f"  Response: {res.status_code} -> {res.json()}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert res.json().get("redis_connected") is True, "Redis should be connected"
        print("  ✅ Gateway and Redis are operational!")
    except Exception as e:
        print(f"  ❌ FAILED: Could not reach Gateway at {GATEWAY_URL}. Is Docker running? Error: {e}")
        sys.exit(1)

def test_api_key_validation():
    print("\n[TEST 2] Testing API Key Authentication Plugin...")
    
    # 2a: Request with NO key should return 401
    print("  -> Sending request without X-API-Key header...")
    res = requests.get(f"{GATEWAY_URL}/api/v1/target")
    print(f"     Status: {res.status_code} (Expected 401)")
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"

    # 2b: Request with INVALID key should return 401
    print("  -> Sending request with invalid X-API-Key: 'fake_key_999'...")
    res = requests.get(f"{GATEWAY_URL}/api/v1/target", headers={"X-API-Key": "fake_key_999"})
    print(f"     Status: {res.status_code} (Expected 401)")
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"

    # 2c: Request with VALID key should return 200
    print(f"  -> Sending request with valid X-API-Key: '{TEST_API_KEY}'...")
    res = requests.get(f"{GATEWAY_URL}/api/v1/target", headers={"X-API-Key": TEST_API_KEY})
    print(f"     Status: {res.status_code} (Expected 200)")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print(f"     Payload: {res.json()}")
    print("  ✅ API Key Authentication Plugin verified!")

def test_rate_limiting_token_bucket():
    print("\n[TEST 3] Testing Token Bucket Rate Limiting (token_bucket.lua)...")
    
    # Provision a dedicated test key with capacity=4, refill=1.0/s
    custom_key = f"test_rate_key_{int(time.time())}"
    meta = '{"name":"Rate Test Key","owner":"Automated Tester","rateLimitCapacity":4,"rateLimitRefill":1.0}'
    requests.post(f"{GATEWAY_URL}/admin/keys", json={"key": custom_key, "metadata": meta})

    print(f"  -> Firing 6 rapid requests (Capacity: 4 tokens)...")
    allowed = 0
    throttled = 0

    for i in range(6):
        res = requests.get(f"{GATEWAY_URL}/api/v1/target", headers={"X-API-Key": custom_key})
        if res.status_code == 200:
            allowed += 1
            print(f"     Req #{i+1}: 200 OK (Allowed)")
        elif res.status_code == 429:
            throttled += 1
            print(f"     Req #{i+1}: 429 Too Many Requests (Throttled)")

    assert allowed == 4, f"Expected exactly 4 allowed requests, got {allowed}"
    assert throttled == 2, f"Expected 2 throttled requests, got {throttled}"
    print("  ✅ Token Bucket Rate Limiting enforced successfully!")

def test_anomaly_guardian_autoblocking():
    print("\n[TEST 4] Testing Anomaly Guardian Engine (>50 errors in 10s -> Auto-Ban)...")
    
    attacker_headers = {"X-API-Key": "invalid_probing_key"}
    print("  -> Simulating attack burst: Firing 55 rapid 401/404 error requests...")
    
    for i in range(55):
        requests.get(f"{GATEWAY_URL}/api/v1/non_existent_endpoint_{i}", headers=attacker_headers)

    print("  -> Waiting 2.5 seconds for Anomaly Guardian Watchdog & Sliding Window Filter...")
    time.sleep(2.5)

    # Now verify if IP was blocked in Redis
    print("  -> Querying /admin/blocked-ips...")
    res = requests.get(f"{GATEWAY_URL}/admin/blocked-ips")
    blocked_list = res.json()
    print(f"     Active Redis Blocklist: {blocked_list}")
    assert len(blocked_list) > 0, "Anomaly Guardian should have added IP to blocked_ips"

    # Now try making any request -> should be 403 Forbidden
    print("  -> Verifying Gateway drops all subsequent requests with HTTP 403 Forbidden...")
    res = requests.get(f"{GATEWAY_URL}/api/v1/target", headers={"X-API-Key": TEST_API_KEY})
    print(f"     Status: {res.status_code} -> {res.json()}")
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}"

    # Cleanup: Unblock IP via Admin API
    if blocked_list:
        ip_to_unblock = blocked_list[0].get("ip")
        print(f"  -> Cleaning up: Unblocking IP {ip_to_unblock} via Admin API...")
        requests.delete(f"{GATEWAY_URL}/admin/blocked-ips/{ip_to_unblock}")
        print("  ✅ Anomaly Guardian Auto-Block and Admin Unblock verified!")

def test_admin_telemetry():
    print("\n[TEST 5] Testing Admin Telemetry & Metrics API for React Dashboard...")
    res = requests.get(f"{GATEWAY_URL}/admin/metrics")
    data = res.json()
    print(f"  Metrics payload: {data}")
    assert "totalRequests" in data
    assert "redisOpsPerSec" in data
    assert data.get("redisConnected") is True
    print("  ✅ Admin Telemetry API verified!")

if __name__ == "__main__":
    print_banner("SHIELDAPI AUTOMATED END-TO-END TEST SUITE")
    print("Testing Gateway, Redis Broker, Anomaly Guardian, and Microservices...")
    
    test_gateway_health()
    test_api_key_validation()
    test_rate_limiting_token_bucket()
    test_anomaly_guardian_autoblocking()
    test_admin_telemetry()
    
    print_banner("🎉 ALL 5 INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
