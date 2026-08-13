local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call("HMGET", key, "tokens", "last_update")
local tokens = tonumber(bucket[1])
local last_update = tonumber(bucket[2])

if tokens == nil then
    tokens = capacity
    last_update = now
else
    local time_passed = now - last_update
    local new_tokens = time_passed * refill_rate
    tokens = math.min(capacity, tokens + new_tokens)
    last_update = now
end

if tokens >= 1 then
    tokens = tokens - 1
    redis.call("HMSET", key, "tokens", tokens, "last_update", last_update)
    -- Expire the bucket key after 1 hour of inactivity to prevent memory leaks
    redis.call("EXPIRE", key, 3600)
    return 1
else
    redis.call("HMSET", key, "tokens", tokens, "last_update", last_update)
    redis.call("EXPIRE", key, 3600)
    return 0
end
