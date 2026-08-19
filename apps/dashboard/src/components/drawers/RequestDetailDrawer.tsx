import React from 'react';
import { Drawer } from '../common/Drawer';
import { Button } from '../common/Button';
import { MethodBadge, ActionBadge } from '../common/Badge';
import { useTelemetry } from '../../context/TelemetryContext';
import { ShieldCheck, ShieldAlert, Clock, Network, Cpu, Key, FileText, CheckCircle2 } from 'lucide-react';

export const RequestDetailDrawer: React.FC = () => {
  const { selectedLog, setSelectedLog, manuallyBlockIp } = useTelemetry();

  if (!selectedLog) return null;

  return (
    <Drawer
      isOpen={!!selectedLog}
      onClose={() => setSelectedLog(null)}
      title="Traffic Request Forensics"
      subtitle={`Trace ID: ${selectedLog.id} • ${selectedLog.timestamp}`}
      width="lg"
    >
      <div className="space-y-5 text-xs">
        {/* Top Summary Banner */}
        <div className="p-4 rounded-lg bg-surface border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MethodBadge method={selectedLog.method} size="md" />
            <span className="font-mono text-sm font-bold text-textPrimary">{selectedLog.path}</span>
          </div>
          <ActionBadge action={selectedLog.action} statusCode={selectedLog.statusCode} />
        </div>

        {/* Forensic Core Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded bg-surface border border-border">
            <div className="flex items-center gap-1.5 text-textSecondary text-[11px] mb-1 font-mono">
              <Network className="w-3.5 h-3.5 text-shieldCyan" /> CLIENT IP
            </div>
            <div className="font-mono text-sm font-semibold text-textPrimary">{selectedLog.clientIp}</div>
          </div>

          <div className="p-3 rounded bg-surface border border-border">
            <div className="flex items-center gap-1.5 text-textSecondary text-[11px] mb-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> TOTAL LATENCY
            </div>
            <div className="font-mono text-sm font-semibold text-textPrimary">{selectedLog.latencyMs} ms</div>
          </div>

          <div className="p-3 rounded bg-surface border border-border">
            <div className="flex items-center gap-1.5 text-textSecondary text-[11px] mb-1 font-mono">
              <Cpu className="w-3.5 h-3.5 text-sky-400" /> TARGET SERVICE
            </div>
            <div className="text-xs font-semibold text-textPrimary">{selectedLog.serviceName}</div>
          </div>

          <div className="p-3 rounded bg-surface border border-border">
            <div className="flex items-center gap-1.5 text-textSecondary text-[11px] mb-1 font-mono">
              <Key className="w-3.5 h-3.5 text-purple-400" /> API KEY STATUS
            </div>
            <div className="font-mono text-xs text-textPrimary">
              {selectedLog.apiKeyName || 'Anonymous / None'}
            </div>
          </div>
        </div>

        {/* Gateway Pipeline Inspection */}
        <div>
          <h4 className="font-semibold text-textPrimary uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-shieldCyan" /> Micro-Kernel Plugin Execution Trace
          </h4>
          <div className="space-y-2 font-mono text-[11px]">
            <div className="p-2.5 rounded bg-surface/60 border border-border flex items-center justify-between">
              <span className="flex items-center gap-2 text-textPrimary">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 1. IP Blacklist Check (SISMEMBER blocked_ips)
              </span>
              <span className={selectedLog.action === 'BLOCKED_IP' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {selectedLog.action === 'BLOCKED_IP' ? 'BLOCKED (Found in Redis)' : 'PASSED (0.4ms)'}
              </span>
            </div>

            <div className="p-2.5 rounded bg-surface/60 border border-border flex items-center justify-between">
              <span className="flex items-center gap-2 text-textPrimary">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 2. API Key Validator (HGET api_keys)
              </span>
              <span className={selectedLog.action === 'INVALID_KEY' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {selectedLog.action === 'INVALID_KEY' ? 'REJECTED 401' : 'VALIDATED (0.6ms)'}
              </span>
            </div>

            <div className="p-2.5 rounded bg-surface/60 border border-border flex items-center justify-between">
              <span className="flex items-center gap-2 text-textPrimary">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 3. Token Bucket Limiter (EVAL token_bucket.lua)
              </span>
              <span className={selectedLog.action === 'RATE_LIMITED' ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                {selectedLog.action === 'RATE_LIMITED' ? '429 THROTTLED (0 tokens)' : `PASSED (${selectedLog.tokensRemaining ?? 8} tokens left)`}
              </span>
            </div>

            <div className="p-2.5 rounded bg-surface/60 border border-border flex items-center justify-between">
              <span className="flex items-center gap-2 text-textPrimary">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 4. Forwarding to Downstream Microservice
              </span>
              <span className="text-sky-400">
                {selectedLog.statusCode === 200 ? 'HTTP 200 OK' : `HTTP ${selectedLog.statusCode}`}
              </span>
            </div>
          </div>
        </div>

        {/* Raw Log Line Representation */}
        <div>
          <h4 className="font-semibold text-textSecondary uppercase tracking-wider text-[10px] mb-1">
            Raw Log Entry (/var/log/shieldapi/access.log)
          </h4>
          <div className="p-3 rounded bg-background border border-border font-mono text-[11px] text-textSecondary overflow-x-auto selection:bg-shieldCyan/30">
            <code>
              {selectedLog.clientIp} - - [{selectedLog.timestamp}] "{selectedLog.method} {selectedLog.path} HTTP/1.1" {selectedLog.statusCode} {selectedLog.responseSizeBytes || 450} {selectedLog.latencyMs}ms "{selectedLog.userAgent || 'ShieldAPI-Agent'}"
            </code>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              manuallyBlockIp(selectedLog.clientIp, `Blacklisted after inspecting request ${selectedLog.id}`, 86400);
              setSelectedLog(null);
            }}
            icon={<ShieldAlert className="w-3.5 h-3.5" />}
          >
            Blacklist IP ({selectedLog.clientIp})
          </Button>

          <Button size="sm" variant="secondary" onClick={() => setSelectedLog(null)}>
            Close Inspector
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
