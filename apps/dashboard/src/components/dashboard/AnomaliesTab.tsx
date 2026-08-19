import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { SearchInput } from '../common/SearchInput';
import { MetricCard } from '../common/MetricCard';
import { SeverityBadge, Badge } from '../common/Badge';
import {
  ShieldAlert,
  ShieldBan,
  ShieldCheck,
  Zap,
  Activity,
  Trash2,
  Terminal,
  Clock,
  ExternalLink,
  Plus
} from 'lucide-react';

export const AnomaliesTab: React.FC = () => {
  const {
    anomalies,
    blockedIps,
    unblockIp,
    setSelectedAnomaly,
    triggerAttackBurst,
    setIsBlockIpModalOpen
  } = useTelemetry();

  const [search, setSearch] = useState('');

  const filteredBlockedIps = blockedIps.filter(
    b => b.ip.includes(search) || b.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active IP Blacklist (Redis)"
          value={blockedIps.length}
          subValue="Auto-dropped with 403 Forbidden"
          icon={<ShieldBan className="w-4 h-4 text-rose-400" />}
          statusIndicator={blockedIps.length > 0 ? 'danger' : 'healthy'}
        />
        <MetricCard
          label="Heuristic Threshold"
          value="> 50 err / 10s"
          subValue="Sliding window matrix trigger"
          icon={<Activity className="w-4 h-4 text-amber-400" />}
          statusIndicator="healthy"
        />
        <MetricCard
          label="Default Ban TTL"
          value="86,400s (24h)"
          subValue="Redis key auto-expiration"
          icon={<Clock className="w-4 h-4 text-sky-400" />}
          statusIndicator="healthy"
        />
        <MetricCard
          label="Pipes & Filters Pipeline"
          value="4 Filters Active"
          subValue="Watchdog -> Regex -> Window -> Redis"
          icon={<Terminal className="w-4 h-4 text-emerald-400" />}
          statusIndicator="healthy"
        />
      </div>

      {/* Live Attack Simulator Banner for Demo Flow */}
      <div className="p-4 rounded-lg bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-md bg-rose-950/60 text-rose-400 border border-rose-800/60">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-textPrimary flex items-center gap-2">
              <span>Interactive Threat Simulation Engine</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-shieldCyan">
                ACADEMIC DEMO MODE
              </span>
            </div>
            <p className="text-xs text-textSecondary mt-0.5">
              Simulate an attacker firing &gt; 50 rapid 404/500 errors to watch the Anomaly Guardian auto-blacklist the IP in Redis in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="danger"
            onClick={triggerAttackBurst}
            icon={<Zap className="w-3.5 h-3.5" />}
          >
            Simulate 404 Attack Burst
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsBlockIpModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Manual IP Ban
          </Button>
        </div>
      </div>

      {/* Active Blacklisted IPs in Redis */}
      <Card
        title="Active Redis IP Blacklist (SISMEMBER blocked_ips)"
        subtitle="IP addresses currently blocked with 24-hour TTL in shared memory"
        action={
          <span className="text-xs font-mono text-rose-400 font-bold">
            {blockedIps.length} Active Bans
          </span>
        }
        bodyClassName="p-4 space-y-4"
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter by IP address or trigger reason..."
          className="w-full sm:w-80"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-textSecondary font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-3 px-3 font-semibold">Malicious Client IP</th>
                <th className="pb-3 px-3 font-semibold">Trigger Reason & Violation</th>
                <th className="pb-3 px-3 font-semibold">Attack Type</th>
                <th className="pb-3 px-3 font-semibold">TTL Expiry</th>
                <th className="pb-3 px-3 font-semibold">Blocked At</th>
                <th className="pb-3 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBlockedIps.map(item => (
                <tr key={item.ip} className="hover:bg-surface/50 transition-colors font-mono">
                  <td className="py-3 px-3">
                    <span className="font-bold text-rose-400 text-xs">{item.ip}</span>
                  </td>

                  <td className="py-3 px-3 font-sans max-w-md">
                    <div className="text-textPrimary text-xs font-medium">{item.reason}</div>
                    <div className="text-[10px] text-textSecondary font-mono mt-0.5">
                      Violated: &gt;50 errors within 10s sliding window
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <Badge variant="danger">{item.attackType}</Badge>
                  </td>

                  <td className="py-3 px-3 text-sky-400 font-bold text-[11px]">
                    23h 48m left
                  </td>

                  <td className="py-3 px-3 text-textSecondary text-[11px]">
                    {new Date(item.blockedAt).toLocaleTimeString()}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => unblockIp(item.ip)}
                      icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                    >
                      Unblock in Redis
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBlockedIps.length === 0 && (
            <div className="p-8 text-center bg-surface rounded-lg border border-border text-textSecondary">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-textPrimary">No IP Addresses Currently Blocked</p>
              <p className="text-[11px] text-textSecondary mt-0.5">
                All incoming network clients are operating within normal traffic boundaries.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Heuristic Incident Feed */}
      <Card
        title="Anomaly Guardian Threat Stream"
        subtitle="Chronological feed of security alerts generated by the Pipes & Filters engine"
        bodyClassName="p-0"
      >
        <div className="divide-y divide-border">
          {anomalies.map(anomaly => (
            <div
              key={anomaly.id}
              className="p-4 hover:bg-surface/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={anomaly.severity} />
                  <h4 className="font-bold text-xs text-textPrimary">{anomaly.title}</h4>
                  <span className="text-[11px] text-textSecondary font-mono">• {anomaly.detectedAt}</span>
                </div>
                <p className="text-xs text-textSecondary leading-relaxed">{anomaly.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-textMuted pt-1">
                  <span>Client IP: <strong className="text-rose-400">{anomaly.clientIp}</strong></span>
                  <span>Burst Rate: <strong className="text-rose-400">{anomaly.errorRate} err/10s</strong></span>
                  <span>Rule: <strong className="text-textSecondary">{anomaly.ruleViolated}</strong></span>
                  <span>Action: <strong className="text-emerald-400">{anomaly.actionTaken}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedAnomaly(anomaly)}
                  icon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  Investigate
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
