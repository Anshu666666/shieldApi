import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { MetricCard } from '../common/MetricCard';
import { TokenBucketGauge } from '../charts/TokenBucketGauge';
import {
  Hourglass,
  Zap,
  ShieldCheck,
  Code,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const RateLimitsTab: React.FC = () => {
  const {
    services,
    tokenBucket,
    updateTokenBucketConfig,
    triggerRateLimitStorm
  } = useTelemetry();

  const [capacityInput, setCapacityInput] = useState(tokenBucket.capacity);
  const [refillInput, setRefillInput] = useState(tokenBucket.refillRate);

  const handleApplyConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateTokenBucketConfig(Number(capacityInput), Number(refillInput));
  };

  const luaScriptSnippet = `-- Distributed Atomic Token Bucket Rate Limiting (Redis Lua)
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
    redis.call("EXPIRE", key, 3600)
    return 1 -- HTTP 200 (Allowed)
else
    redis.call("HMSET", key, "tokens", tokens, "last_update", last_update)
    redis.call("EXPIRE", key, 3600)
    return 0 -- HTTP 429 (Rate Limited)
end`;

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Default Token Capacity"
          value={`${tokenBucket.capacity} Tokens`}
          subValue="Burst limit before 429 throttling"
          icon={<Hourglass className="w-4 h-4 text-shieldCyan" />}
          statusIndicator="healthy"
        />
        <MetricCard
          label="Default Refill Rate"
          value={`+${tokenBucket.refillRate}/s`}
          subValue="Continuous mathematical regeneration"
          icon={<Zap className="w-4 h-4 text-emerald-400" />}
          statusIndicator="healthy"
        />
        <MetricCard
          label="Atomic Script Engine"
          value="Redis Lua EVAL"
          subValue="Zero race conditions across instances"
          icon={<ShieldCheck className="w-4 h-4 text-purple-400" />}
          statusIndicator="healthy"
        />
      </div>

      {/* Main Token Bucket Visualizer */}
      <TokenBucketGauge />

      {/* Configuration & Tuning Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Tuning & Bucket Parameters"
          subtitle="Configure default token bucket capacity and refill rate in real-time"
          bodyClassName="p-4"
        >
          <form onSubmit={handleApplyConfig} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-mono text-textPrimary mb-1.5 font-medium">
                Maximum Token Capacity ($ARGV[1])
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={capacityInput}
                onChange={e => setCapacityInput(Number(e.target.value))}
                className="w-full bg-surface text-xs font-mono text-textPrimary px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
              />
              <span className="text-[11px] text-textSecondary mt-1 block">
                Number of allowable burst requests before triggering HTTP 429 Too Many Requests.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-textPrimary mb-1.5 font-medium">
                Token Refill Rate ($ARGV[2] - Tokens / Sec)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="100"
                value={refillInput}
                onChange={e => setRefillInput(Number(e.target.value))}
                className="w-full bg-surface text-xs font-mono text-textPrimary px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
              />
              <span className="text-[11px] text-textSecondary mt-1 block">
                Replenishment speed per second based on elapsed timestamp delta.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={triggerRateLimitStorm}
                icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
              >
                Simulate 429 Storm
              </Button>
              <Button type="submit" variant="primary" icon={<Sliders className="w-3.5 h-3.5" />}>
                Apply Parameters
              </Button>
            </div>
          </form>
        </Card>

        {/* Lua Script Source Inspector */}
        <Card
          title="Redis Lua Script Inspector"
          subtitle="Atomic in-memory script loaded by packages/shared/redis_manager.py"
          bodyClassName="p-3"
        >
          <div className="p-3 rounded bg-background border border-border font-mono text-[10px] text-textSecondary max-h-64 overflow-y-auto selection:bg-shieldCyan/30">
            <pre className="text-sky-300/90 whitespace-pre leading-relaxed">{luaScriptSnippet}</pre>
          </div>
        </Card>
      </div>

      {/* Service-Level Rate Limit Matrix */}
      <Card
        title="Microservice Rate Limit Policies"
        subtitle="Individual token bucket quotas assigned per protected microservice"
        bodyClassName="p-4"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-textSecondary font-mono text-[11px] uppercase">
                <th className="pb-3 px-3 font-semibold">Service</th>
                <th className="pb-3 px-3 font-semibold">Endpoint</th>
                <th className="pb-3 px-3 font-semibold">Token Capacity</th>
                <th className="pb-3 px-3 font-semibold">Refill Rate</th>
                <th className="pb-3 px-3 font-semibold">Current State</th>
                <th className="pb-3 px-3 font-semibold">Quota / Hour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map(s => (
                <tr key={s.id} className="hover:bg-surface/50 transition-colors font-mono">
                  <td className="py-3 px-3 font-sans font-semibold text-textPrimary">{s.name}</td>
                  <td className="py-3 px-3 text-shieldCyan text-[11px]">{s.endpoint}</td>
                  <td className="py-3 px-3 font-bold text-textPrimary">{s.rateLimitCapacity} tokens</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">+{s.rateLimitRefill}/s</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> OK
                    </span>
                  </td>
                  <td className="py-3 px-3 text-textSecondary">
                    {(s.rateLimitRefill * 3600).toLocaleString()} req/hr
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
