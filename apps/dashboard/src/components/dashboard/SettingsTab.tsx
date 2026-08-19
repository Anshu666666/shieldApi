import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import {
  Settings,
  Sliders,
  Shield,
  Zap,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const {
    simulator,
    toggleSimulator,
    setSimulatorRps,
    triggerAttackBurst,
    triggerRateLimitStorm,
    triggerNormalSpike,
    addToast
  } = useTelemetry();

  const [errorThreshold, setErrorThreshold] = useState(50);
  const [slidingWindowSec, setSlidingWindowSec] = useState(10);
  const [defaultTtlSec, setDefaultTtlSec] = useState(86400);
  const [stripHeaders, setStripHeaders] = useState(true);
  const [failOpen, setFailOpen] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('success', 'Settings Saved', 'Gateway parameters updated in runtime configuration.');
  };

  return (
    <div className="space-y-6">
      {/* Interactive Demo Simulator Workbench */}
      <Card
        title="Interactive Traffic & Attack Simulator"
        subtitle="Control live mock traffic generator for demonstration, viva evaluation, and threat defense testing"
        action={
          <Button
            size="sm"
            variant={simulator.isRunning ? 'primary' : 'outline'}
            onClick={toggleSimulator}
            icon={simulator.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          >
            {simulator.isRunning ? 'Live Simulator Active' : 'Simulator Paused'}
          </Button>
        }
        bodyClassName="p-5 space-y-5"
      >
        <div className="p-4 rounded-lg bg-surface border border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-textSecondary">Simulated Throughput:</span>
              <span className="font-bold text-shieldCyan">{simulator.rps} Requests / Sec</span>
            </div>
            <input
              type="range"
              min="5"
              max="150"
              value={simulator.rps}
              onChange={e => setSimulatorRps(Number(e.target.value))}
              className="w-full accent-shieldCyan cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-textSecondary font-mono mt-1">
              <span>5 req/s (Low)</span>
              <span>35 req/s (Nominal)</span>
              <span>150 req/s (High Volume)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg bg-surface border border-border flex flex-col justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-textPrimary flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> 404 Attack Burst
              </div>
              <p className="text-[11px] text-textSecondary">
                Simulates an attacker exceeding &gt; 50 errors in 10s. Triggers Pipes & Filters Filter 4 auto-ban in Redis.
              </p>
            </div>
            <Button size="sm" variant="danger" onClick={triggerAttackBurst}>
              Trigger 404 Attack Spike
            </Button>
          </div>

          <div className="p-3.5 rounded-lg bg-surface border border-border flex flex-col justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-textPrimary flex items-center gap-1.5 mb-1">
                <Zap className="w-4 h-4 text-amber-400" /> Token Bucket Drain
              </div>
              <p className="text-[11px] text-textSecondary">
                Fires rapid requests that exhaust token bucket capacity, generating 429 Too Many Requests responses.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={triggerRateLimitStorm}>
              Trigger 429 Rate Burst
            </Button>
          </div>

          <div className="p-3.5 rounded-lg bg-surface border border-border flex flex-col justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-textPrimary flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Legitimate Traffic Peak
              </div>
              <p className="text-[11px] text-textSecondary">
                Generates a clean spike of successful 200 OK traffic across all registered microservice endpoints.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={triggerNormalSpike}>
              Trigger 200 OK Spike
            </Button>
          </div>
        </div>
      </Card>

      {/* Gateway & Anomaly Heuristics Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Anomaly Guardian Heuristic Thresholds"
          subtitle="Define sliding window bounds and auto-blacklist parameters"
          bodyClassName="p-5"
        >
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-mono text-textPrimary mb-1.5 font-medium">
                Error Burst Threshold (Errors in Window)
              </label>
              <input
                type="number"
                min="5"
                max="500"
                value={errorThreshold}
                onChange={e => setErrorThreshold(Number(e.target.value))}
                className="w-full bg-surface text-xs font-mono text-textPrimary px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
              />
              <span className="text-[11px] text-textSecondary mt-1 block">
                Default: 50 errors (triggers Filter 4 automatic blacklisting).
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-textPrimary mb-1.5 font-medium">
                Sliding Window Duration (Seconds)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={slidingWindowSec}
                onChange={e => setSlidingWindowSec(Number(e.target.value))}
                className="w-full bg-surface text-xs font-mono text-textPrimary px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
              />
              <span className="text-[11px] text-textSecondary mt-1 block">
                Default: 10 seconds sliding window state in Anomaly Guardian.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-textPrimary mb-1.5 font-medium">
                Redis Blacklist TTL Duration (Seconds)
              </label>
              <input
                type="number"
                min="60"
                max="604800"
                value={defaultTtlSec}
                onChange={e => setDefaultTtlSec(Number(e.target.value))}
                className="w-full bg-surface text-xs font-mono text-textPrimary px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
              />
              <span className="text-[11px] text-textSecondary mt-1 block">
                Default: 86,400 seconds (24 hours).
              </span>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <Button type="submit" variant="primary">
                Save Heuristic Configuration
              </Button>
            </div>
          </form>
        </Card>

        {/* Security & Reliability Safeguards */}
        <Card
          title="Security & Resilience Policies"
          subtitle="Nonfunctional safety and security requirements enforcement"
          bodyClassName="p-5 space-y-4"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-lg bg-surface border border-border flex items-center justify-between">
              <div>
                <div className="font-semibold text-textPrimary">Strip Identifying Backend Headers</div>
                <div className="text-[11px] text-textSecondary mt-0.5">
                  Removes <code className="text-shieldCyan">X-Powered-By</code>, <code className="text-shieldCyan">Server</code> headers to prevent reconnaissance probing (Req 5.3).
                </div>
              </div>
              <input
                type="checkbox"
                checked={stripHeaders}
                onChange={e => setStripHeaders(e.target.checked)}
                className="w-4 h-4 accent-shieldCyan cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-surface border border-border flex items-center justify-between">
              <div>
                <div className="font-semibold text-textPrimary">Fail-Open Architecture Safeguard</div>
                <div className="text-[11px] text-textSecondary mt-0.5">
                  If Redis broker encounters fatal failure, router defaults to pass legitimate traffic (Req 5.2).
                </div>
              </div>
              <input
                type="checkbox"
                checked={failOpen}
                onChange={e => setFailOpen(e.target.checked)}
                className="w-4 h-4 accent-shieldCyan cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-surface border border-border flex items-center justify-between">
              <div>
                <div className="font-semibold text-textPrimary">Strict Stateless ASGI Routing</div>
                <div className="text-[11px] text-textSecondary mt-0.5">
                  No local gateway RAM used for rate-limiting tokens, ensuring infinite horizontal scalability (Req 5.4).
                </div>
              </div>
              <span className="text-emerald-400 font-mono text-[11px] font-bold">ENFORCED</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
