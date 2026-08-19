import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { SearchInput } from '../common/SearchInput';
import { MethodBadge, StatusBadge } from '../common/Badge';
import { MetricCard } from '../common/MetricCard';
import {
  Globe,
  Plus,
  Server,
  Activity,
  Clock,
  Trash2,
  Power,
  Shield,
  ExternalLink
} from 'lucide-react';
import { ApiService } from '../../api/types';

export const ServicesTab: React.FC = () => {
  const {
    services,
    deleteService,
    toggleServiceStatus,
    setIsAddServiceModalOpen
  } = useTelemetry();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = services.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.endpoint.toLowerCase().includes(search.toLowerCase()) ||
      s.targetUrl.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const avgLatencyAll = Math.round(
    services.reduce((acc, s) => acc + s.avgLatencyMs, 0) / (services.length || 1)
  );

  return (
    <div className="space-y-6">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Registered Microservices"
          value={services.length}
          subValue="All routes mapped to proxy router"
          icon={<Globe className="w-4 h-4 text-shieldCyan" />}
          statusIndicator="healthy"
        />
        <MetricCard
          label="Downstream Avg Latency"
          value={`${avgLatencyAll} ms`}
          subValue="Internal mesh response speed"
          icon={<Clock className="w-4 h-4 text-emerald-400" />}
          statusIndicator="healthy"
        />
        <MetricCard
          label="Protected Endpoints"
          value={`${services.length} Endpoints`}
          subValue="Token bucket rate limiter active"
          icon={<Shield className="w-4 h-4 text-sky-400" />}
          statusIndicator="healthy"
        />
      </div>

      {/* Services Table and Management */}
      <Card
        title="Microservice Endpoint Routing Table"
        subtitle="Downstream services fronted by ShieldAPI reverse proxy and rate limiter"
        action={
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddServiceModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Register Service
          </Button>
        }
        bodyClassName="p-4 space-y-4"
      >
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by service name, gateway path, or target URL..."
            className="w-full sm:w-80"
          />

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-surface p-1 rounded border border-border text-xs font-mono">
            <span className="text-textSecondary px-2 text-[11px]">Filter:</span>
            {['ALL', 'HEALTHY', 'DEGRADED', 'DOWN'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-card text-shieldCyan font-semibold border border-border'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Services Cards / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {filtered.map(service => (
            <div
              key={service.id}
              className="p-4 rounded-lg bg-surface border border-border hover:border-borderLight transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-textPrimary tracking-tight">{service.name}</h4>
                    <div className="font-mono text-xs text-shieldCyan font-medium mt-0.5">
                      {service.endpoint}
                    </div>
                  </div>
                  <StatusBadge status={service.status} />
                </div>

                {service.description && (
                  <p className="text-xs text-textSecondary mb-3 line-clamp-2">{service.description}</p>
                )}

                <div className="p-2.5 rounded bg-card border border-border/80 text-[11px] font-mono space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-textSecondary">
                    <span className="flex items-center gap-1.5">
                      <Server className="w-3 h-3 text-sky-400" /> Target Proxy:
                    </span>
                    <span className="text-textPrimary font-medium truncate max-w-[200px]">{service.targetUrl}</span>
                  </div>
                  <div className="flex items-center justify-between text-textSecondary">
                    <span>Rate Limit Rule:</span>
                    <span className="text-amber-400 font-bold">
                      {service.rateLimitCapacity} cap / +{service.rateLimitRefill}s
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {service.methods.map(m => (
                    <MethodBadge key={m} method={m} />
                  ))}
                </div>
              </div>

              {/* Bottom stats and action bar */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-textSecondary block">LATENCY</span>
                    <span className="font-bold text-emerald-400">{service.avgLatencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-textSecondary block">THROUGHPUT</span>
                    <span className="font-bold text-textPrimary">{service.requestsPerMin} rpm</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleServiceStatus(service.id)}
                    title="Toggle service state (Healthy / Degraded / Down)"
                    className="p-1.5 rounded text-textSecondary hover:text-textPrimary hover:bg-card border border-border transition-colors cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteService(service.id)}
                    title="Remove service from routing table"
                    className="p-1.5 rounded text-rose-400 hover:bg-rose-950/60 border border-border hover:border-rose-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-2 p-8 text-center bg-surface rounded-lg border border-border text-textSecondary">
              <Globe className="w-8 h-8 text-textMuted mx-auto mb-2" />
              <p className="text-xs">No microservices found matching search criteria.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
