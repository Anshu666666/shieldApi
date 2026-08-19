import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useTelemetry } from '../../context/TelemetryContext';
import { Zap, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface TokenBucketGaugeProps {
  className?: string;
}

export const TokenBucketGauge: React.FC<TokenBucketGaugeProps> = ({ className = '' }) => {
  const { tokenBucket, consumeToken, addToast } = useTelemetry();

  const fillPercentage = Math.max(0, Math.min(100, (tokenBucket.tokens / tokenBucket.capacity) * 100));

  // Determine status color based on fill percentage
  const getStatusColor = () => {
    if (fillPercentage > 50) return { bar: 'bg-emerald-500', glow: 'glow-green', text: 'text-emerald-400', label: 'NORMAL' };
    if (fillPercentage > 15) return { bar: 'bg-amber-500', glow: 'glow-amber', text: 'text-amber-400', label: 'WARNING' };
    return { bar: 'bg-rose-500', glow: 'glow-red', text: 'text-rose-400', label: 'CRITICAL / EXHAUSTED' };
  };

  const status = getStatusColor();

  const handleTestRequest = (amount: number = 1) => {
    const result = consumeToken(amount);
    if (result.allowed) {
      addToast('success', 'Request Allowed (200 OK)', `Consumed ${amount} token(s). Remaining: ${result.remaining.toFixed(1)}`);
    } else {
      addToast('error', 'Rate Limited (429 Too Many Requests)', `Bucket empty! Tokens: ${result.remaining.toFixed(1)} / ${tokenBucket.capacity}`);
    }
  };

  return (
    <Card
      title="Token Bucket In-Memory Engine"
      subtitle="Redis atomic evaluation (token_bucket.lua) with automatic mathematical refill"
      className={className}
      bodyClassName="p-5"
    >
      <div className="flex flex-col gap-5">
        {/* Fill Gauge */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-textSecondary">Available Tokens:</span>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${status.text} text-sm`}>
                {tokenBucket.tokens.toFixed(1)} / {tokenBucket.capacity}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border border-border bg-surface ${status.text}`}>
                {status.label}
              </span>
            </div>
          </div>

          <div className="w-full h-4 bg-surface rounded-full overflow-hidden border border-border p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-150 ${status.bar} ${status.glow}`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-textSecondary font-mono mt-1">
            <span>0 (Empty)</span>
            <span>Refill: +{tokenBucket.refillRate}/sec</span>
            <span>{tokenBucket.capacity} (Max Capacity)</span>
          </div>
        </div>

        {/* Live Simulation Controls */}
        <div className="p-3.5 rounded-lg bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <div className="p-1.5 rounded bg-card border border-border text-shieldCyan">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-textPrimary">Test Rate Limiter Token Drain</div>
              <div className="text-[11px] text-textSecondary">Execute atomic EVAL script against in-memory bucket</div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleTestRequest(1)}
              icon={<Zap className="w-3.5 h-3.5 text-shieldCyan" />}
            >
              1 Req
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleTestRequest(5)}
              icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
            >
              Burst 5
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleTestRequest(12)}
              icon={<AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
            >
              Flood 12 (Trigger 429)
            </Button>
          </div>
        </div>

        {/* Mathematical Parameters info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2 rounded bg-card border border-border">
            <span className="text-[10px] text-textSecondary block">CAPACITY ($ARGV[1])</span>
            <span className="font-bold text-textPrimary">{tokenBucket.capacity} tokens</span>
          </div>
          <div className="p-2 rounded bg-card border border-border">
            <span className="text-[10px] text-textSecondary block">REFILL RATE ($ARGV[2])</span>
            <span className="font-bold text-emerald-400">+{tokenBucket.refillRate} tokens/s</span>
          </div>
          <div className="p-2 rounded bg-card border border-border">
            <span className="text-[10px] text-textSecondary block">EVAL RUNTIME</span>
            <span className="font-bold text-sky-400">&lt; 1.2 ms (Redis)</span>
          </div>
          <div className="p-2 rounded bg-card border border-border">
            <span className="text-[10px] text-textSecondary block">FAIL-OPEN SAFEGUARD</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" /> ACTIVE
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
