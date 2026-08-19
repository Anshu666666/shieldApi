import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { MetricCard } from '../common/MetricCard';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { SeverityBadge } from '../common/Badge';
import { TrafficAreaChart } from '../charts/TrafficAreaChart';
import { LatencyBarChart } from '../charts/LatencyBarChart';
import { TokenBucketGauge } from '../charts/TokenBucketGauge';
import {
  Activity,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Key,
  Globe,
  Radio,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export const OverviewTab: React.FC = () => {
  const {
    metrics,
    timeSeries,
    timeRange,
    setTimeRange,
    anomalies,
    blockedIps,
    services,
    apiKeys,
    setActiveTab,
    setSelectedAnomaly,
    triggerAttackBurst,
    triggerRateLimitStorm
  } = useTelemetry();

  return (
    <div className="space-y-6">
      {/* Top Threat Alert Banner if threats detected */}
      {blockedIps.length > 0 && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/80 flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-rose-900/60 text-rose-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-200 flex items-center gap-2">
                <span>ACTIVE THREAT MITIGATION IN PROGRESS</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/80 text-rose-300 border border-rose-700">
                  {blockedIps.length} IPs BLACKLISTED IN REDIS
                </span>
              </div>
              <p className="text-[11px] text-rose-300/80 mt-0.5">
                Anomaly Guardian is actively dropping hostile traffic from {blockedIps.map(b => b.ip).join(', ')}.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setActiveTab('anomalies')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Open Anomaly Center
          </Button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Throughput / Volume"
          value={`${metrics.requestsPerMinute.toLocaleString()} RPM`}
          subValue="~41.3 req/sec distributed"
          change="+12.4%"
          trend="up"
          trendGood={true}
          icon={<Activity className="w-4 h-4 text-shieldCyan" />}
          statusIndicator="healthy"
        />

        <MetricCard
          label="Success Rate (2xx)"
          value={`${metrics.successRatePercent}%`}
          subValue="Normal operations nominal"
          change="+0.2%"
          trend="up"
          trendGood={true}
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
          statusIndicator="healthy"
        />

        <MetricCard
          label="Gateway Avg Latency"
          value={`${metrics.avgLatencyMs} ms`}
          subValue={`P95: ${metrics.p95LatencyMs} ms (Redis: 0.8ms)`}
          change="-3.1 ms"
          trend="down"
          trendGood={true}
          icon={<Clock className="w-4 h-4 text-sky-400" />}
          statusIndicator="healthy"
        />

        <MetricCard
          label="Shield Blocked (429/403)"
          value={`${metrics.blockedRateLimitCount.toLocaleString()}`}
          subValue={`${blockedIps.length} active IP bans (24h TTL)`}
          change="+68"
          trend="up"
          trendGood={false}
          icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}
          statusIndicator={blockedIps.length > 0 ? 'danger' : 'healthy'}
        />
      </div>

      {/* Main Real-Time Traffic Visualization */}
      <TrafficAreaChart
        data={timeSeries}
        range={timeRange}
        onRangeChange={setTimeRange}
      />

      {/* Middle Row: Token Bucket & Latency Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TokenBucketGauge />
        <LatencyBarChart />
      </div>

      {/* Bottom Row: Recent Anomaly Incidents & Quick Route Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Anomaly Incidents */}
        <div className="lg:col-span-2">
          <Card
            title="Recent Heuristic Anomaly Incidents"
            subtitle="Pipes & Filters log analysis pipeline detections & auto-blocks"
            action={
              <Button size="sm" variant="ghost" onClick={() => setActiveTab('anomalies')}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            }
            bodyClassName="p-0"
          >
            <div className="divide-y divide-border">
              {anomalies.slice(0, 3).map(anomaly => (
                <div
                  key={anomaly.id}
                  className="p-4 hover:bg-surface/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={anomaly.severity} />
                      <span className="font-semibold text-xs text-textPrimary">{anomaly.title}</span>
                      <span className="text-[11px] text-textSecondary font-mono">• {anomaly.detectedAt}</span>
                    </div>
                    <p className="text-xs text-textSecondary">{anomaly.description}</p>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-textMuted pt-1">
                      <span>IP: <strong className="text-rose-400">{anomaly.clientIp}</strong></span>
                      <span>Action: <strong className="text-textSecondary">{anomaly.actionTaken}</strong></span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedAnomaly(anomaly)}
                    className="shrink-0"
                  >
                    Investigate
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Quick Gateway Topology & Services status */}
        <div className="space-y-6">
          <Card
            title="Protected Microservices"
            subtitle={`${services.length} active proxy routes`}
            action={
              <Button size="sm" variant="ghost" onClick={() => setActiveTab('services')}>
                Manage <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            }
            bodyClassName="p-0"
          >
            <div className="divide-y divide-border">
              {services.slice(0, 4).map(srv => (
                <div key={srv.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-textPrimary">{srv.name}</div>
                    <div className="text-[11px] font-mono text-textSecondary">{srv.endpoint}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-emerald-400 font-semibold">{srv.avgLatencyMs} ms</div>
                    <div className="text-[10px] text-textSecondary">{srv.requestsPerMin} rpm</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
