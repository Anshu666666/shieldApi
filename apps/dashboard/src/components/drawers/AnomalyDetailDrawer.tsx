import React from 'react';
import { Drawer } from '../common/Drawer';
import { Button } from '../common/Button';
import { SeverityBadge, Badge } from '../common/Badge';
import { useTelemetry } from '../../context/TelemetryContext';
import { ShieldAlert, ShieldCheck, Activity, Terminal, Clock, CheckCircle } from 'lucide-react';

export const AnomalyDetailDrawer: React.FC = () => {
  const { selectedAnomaly, setSelectedAnomaly, unblockIp, resolveAnomaly } = useTelemetry();

  if (!selectedAnomaly) return null;

  return (
    <Drawer
      isOpen={!!selectedAnomaly}
      onClose={() => setSelectedAnomaly(null)}
      title="Security Incident & Anomaly Forensics"
      subtitle={`Incident ID: ${selectedAnomaly.id} • ${selectedAnomaly.detectedAt}`}
      width="lg"
    >
      <div className="space-y-5 text-xs">
        {/* Top Severity Status */}
        <div className="p-4 rounded-lg bg-surface border border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SeverityBadge severity={selectedAnomaly.severity} />
            <span className="font-semibold text-sm text-textPrimary">{selectedAnomaly.title}</span>
          </div>
          <Badge variant={selectedAnomaly.status === 'ACTIVE_BLOCK' ? 'danger' : 'success'}>
            {selectedAnomaly.status}
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded bg-surface border border-border">
            <div className="text-textSecondary text-[10px] font-mono uppercase mb-1">Offending Client IP</div>
            <div className="font-mono text-sm font-bold text-rose-400">{selectedAnomaly.clientIp}</div>
          </div>
          <div className="p-3 rounded bg-surface border border-border">
            <div className="text-textSecondary text-[10px] font-mono uppercase mb-1">Sliding Window Error Rate</div>
            <div className="font-mono text-sm font-bold text-rose-400">
              {selectedAnomaly.errorRate} err / 10s <span className="text-[10px] text-textSecondary font-normal">(Threshold: 50)</span>
            </div>
          </div>
        </div>

        {/* Threat Description */}
        <div className="p-3.5 rounded-lg bg-surface border border-border">
          <div className="text-textSecondary text-[10px] font-mono uppercase mb-1 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-shieldCyan" /> Incident Analysis & Context
          </div>
          <p className="text-textPrimary leading-relaxed">{selectedAnomaly.description}</p>
        </div>

        {/* Anomaly Guardian Pipeline Trace */}
        <div>
          <h4 className="font-semibold text-textPrimary uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-shieldCyan" /> Pipes & Filters Execution Trace
          </h4>
          <div className="space-y-2 font-mono text-[11px]">
            <div className="p-2.5 rounded bg-surface/60 border border-border flex items-center justify-between">
              <span className="text-textPrimary">Filter 1: Watchdog Log Listener</span>
              <span className="text-emerald-400">Captured new bytes in /var/log/shieldapi/access.log</span>
            </div>
            <div className="p-2.5 rounded bg-surface/60 border border-border flex items-center justify-between">
              <span className="text-textPrimary">Filter 2: Regex Parser</span>
              <span className="text-emerald-400">Extracted IP {selectedAnomaly.clientIp} with 404/500 code</span>
            </div>
            <div className="p-2.5 rounded bg-surface/60 border border-border flex items-center justify-between">
              <span className="text-textPrimary">Filter 3: Sliding Window Heuristic</span>
              <span className="text-rose-400 font-bold">Breached threshold ({selectedAnomaly.errorRate} &gt; 50 in 10s)</span>
            </div>
            <div className="p-2.5 rounded bg-surface/60 border border-border flex items-center justify-between">
              <span className="text-textPrimary">Filter 4: Redis Blacklist Auto-Blocker</span>
              <span className="text-emerald-400 font-bold">RedisManager.block_ip(ttl_seconds=86400)</span>
            </div>
          </div>
        </div>

        {/* Sample Log Lines */}
        {selectedAnomaly.logsSample && selectedAnomaly.logsSample.length > 0 && (
          <div>
            <h4 className="font-semibold text-textSecondary uppercase tracking-wider text-[10px] mb-1">
              Sample Triggering Access Logs
            </h4>
            <div className="p-3 rounded bg-background border border-border font-mono text-[11px] text-textSecondary space-y-1 overflow-x-auto">
              {selectedAnomaly.logsSample.map((line, idx) => (
                <div key={idx} className="text-rose-300/90 whitespace-pre">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              await unblockIp(selectedAnomaly.clientIp);
              setSelectedAnomaly(null);
            }}
            icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
          >
            Unblock IP in Redis
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              resolveAnomaly(selectedAnomaly.id);
              setSelectedAnomaly(null);
            }}
            icon={<CheckCircle className="w-3.5 h-3.5 text-sky-400" />}
          >
            Mark Resolved
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
