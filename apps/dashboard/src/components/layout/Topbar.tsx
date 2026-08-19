import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Button } from '../common/Button';
import {
  Menu,
  ShieldAlert,
  Zap,
  Plus,
  RefreshCw,
  Activity,
  Key,
  Globe
} from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const {
    activeTab,
    triggerAttackBurst,
    triggerRateLimitStorm,
    triggerNormalSpike,
    setIsCreateKeyModalOpen,
    setIsAddServiceModalOpen,
    setIsBlockIpModalOpen,
    addToast
  } = useTelemetry();

  const titleMap: Record<string, { title: string; desc: string }> = {
    overview: { title: 'Command Center', desc: 'Real-time gateway telemetry, traffic distribution & threat detection' },
    services: { title: 'API Services', desc: 'Registered downstream microservice catalog & routing table' },
    keys: { title: 'API Keys Vault', desc: 'Cryptographic client tokens, scopes & rate limit quotas' },
    limits: { title: 'Rate Limits & Token Bucket', desc: 'Distributed atomic Token Bucket rate limiting engine (Redis Lua)' },
    anomalies: { title: 'Anomaly Center & Guardian', desc: 'Heuristic error analysis & automated 24h IP blacklists' },
    logs: { title: 'Traffic Access Logs', desc: 'Live access log stream matching /var/log/shieldapi/access.log' },
    health: { title: 'System Health & Topology', desc: 'Cluster topology, broker latencies & pipeline diagnostics' },
    settings: { title: 'Gateway Settings & Simulator', desc: 'Heuristic thresholds, token parameters & interactive attack testing' }
  };

  const current = titleMap[activeTab] || titleMap.overview;

  return (
    <header className="h-16 bg-card border-b border-border px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded text-textSecondary hover:text-textPrimary hover:bg-surface"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-textPrimary tracking-tight">{current.title}</h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE STREAM
            </span>
          </div>
          <p className="text-[11px] text-textSecondary hidden md:block">{current.desc}</p>
        </div>
      </div>

      {/* Action Controls & Simulator Shortcuts */}
      <div className="flex items-center gap-2">
        {/* Quick Demo Simulator Buttons */}
        <div className="hidden xl:flex items-center gap-1.5 bg-surface p-1 rounded-lg border border-border">
          <span className="text-[10px] font-mono text-textMuted uppercase px-2 font-semibold">
            Demo Triggers:
          </span>
          <button
            onClick={triggerAttackBurst}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-medium rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 hover:bg-rose-900/60 transition-colors cursor-pointer"
            title="Simulate >50 404/500 errors in 10s to trigger Anomaly Guardian auto-block in Redis"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Attack Burst (Auto-Ban)
          </button>
          <button
            onClick={triggerRateLimitStorm}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-medium rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 hover:bg-amber-900/60 transition-colors cursor-pointer"
            title="Simulate rapid requests to exhaust Token Bucket capacity with 429 errors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            429 Rate Burst
          </button>
          <button
            onClick={triggerNormalSpike}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-medium rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60 transition-colors cursor-pointer"
            title="Simulate legitimate traffic spike"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            200 OK Spike
          </button>
        </div>

        {/* Global CTA Buttons */}
        {activeTab === 'keys' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateKeyModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Generate Key
          </Button>
        )}

        {activeTab === 'services' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddServiceModalOpen(true)}
            icon={<Globe className="w-3.5 h-3.5" />}
          >
            Add Service
          </Button>
        )}

        {activeTab === 'anomalies' && (
          <Button
            size="sm"
            variant="danger"
            onClick={() => setIsBlockIpModalOpen(true)}
            icon={<ShieldAlert className="w-3.5 h-3.5" />}
          >
            Blacklist IP
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => addToast('info', 'Refreshed', 'Refreshed telemetry states from broker.')}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </header>
  );
};
