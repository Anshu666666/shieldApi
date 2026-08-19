import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { SearchInput } from '../common/SearchInput';
import { MethodBadge, ActionBadge } from '../common/Badge';
import {
  FileText,
  Play,
  Pause,
  Trash2,
  Filter,
  ArrowDownUp,
  Download,
  Info
} from 'lucide-react';
import { HttpMethod } from '../../api/types';

export const LogsTab: React.FC = () => {
  const {
    logs,
    isStreamingLogs,
    setIsStreamingLogs,
    clearLogs,
    setSelectedLog,
    services
  } = useTelemetry();

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.clientIp.includes(search) ||
      log.path.toLowerCase().includes(search.toLowerCase()) ||
      (log.apiKeyName && log.apiKeyName.toLowerCase().includes(search.toLowerCase()));

    const matchesMethod = methodFilter === 'ALL' || log.method === methodFilter;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === '2xx' && log.statusCode >= 200 && log.statusCode < 300) ||
      (statusFilter === '4xx' && log.statusCode >= 400 && log.statusCode < 500) ||
      (statusFilter === '5xx' && log.statusCode >= 500) ||
      (statusFilter === '429' && log.statusCode === 429) ||
      (statusFilter === '403' && log.statusCode === 403);

    const matchesService = serviceFilter === 'ALL' || log.serviceName === serviceFilter;

    return matchesSearch && matchesMethod && matchesStatus && matchesService;
  });

  return (
    <div className="space-y-6">
      <Card
        title="Live Traffic Access Log Stream"
        subtitle="Real-time access logs piped directly to Anomaly Guardian (/var/log/shieldapi/access.log)"
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isStreamingLogs ? 'primary' : 'outline'}
              onClick={() => setIsStreamingLogs(!isStreamingLogs)}
              icon={isStreamingLogs ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            >
              {isStreamingLogs ? 'Pause Stream' : 'Resume Stream'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearLogs}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear Buffer
            </Button>
          </div>
        }
        bodyClassName="p-4 space-y-4"
      >
        {/* Multi-Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search IP, endpoint path, or token..."
            className="w-full"
          />

          <div>
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              className="w-full bg-surface text-xs font-mono text-textPrimary px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
            >
              <option value="ALL">All HTTP Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-surface text-xs font-mono text-textPrimary px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
            >
              <option value="ALL">All Status Codes</option>
              <option value="2xx">2xx Success (200 OK)</option>
              <option value="429">429 Rate Limited (Too Many Requests)</option>
              <option value="403">403 Forbidden (Blacklisted IP)</option>
              <option value="4xx">4xx Client Errors (401, 404)</option>
              <option value="5xx">5xx Server Errors (500, 502)</option>
            </select>
          </div>

          <div>
            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              className="w-full bg-surface text-xs font-mono text-textPrimary px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
            >
              <option value="ALL">All Microservices</option>
              {services.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Stream Table */}
        <div className="overflow-x-auto border border-border rounded-lg bg-surface/30">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-card text-textSecondary font-mono text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 font-semibold">Time</th>
                <th className="py-2.5 px-3 font-semibold">Method</th>
                <th className="py-2.5 px-3 font-semibold">Endpoint Path</th>
                <th className="py-2.5 px-3 font-semibold">Status / Action</th>
                <th className="py-2.5 px-3 font-semibold">Latency</th>
                <th className="py-2.5 px-3 font-semibold">Client IP</th>
                <th className="py-2.5 px-3 font-semibold">Service</th>
                <th className="py-2.5 px-3 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map(log => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-surface/90 transition-colors cursor-pointer font-mono"
                >
                  <td className="py-2.5 px-3 text-textSecondary text-[11px] whitespace-nowrap">
                    {log.timestamp}
                  </td>

                  <td className="py-2.5 px-3">
                    <MethodBadge method={log.method} />
                  </td>

                  <td className="py-2.5 px-3 font-medium text-textPrimary text-[11px]">
                    {log.path}
                  </td>

                  <td className="py-2.5 px-3">
                    <ActionBadge action={log.action} statusCode={log.statusCode} />
                  </td>

                  <td className="py-2.5 px-3 text-emerald-400 font-bold text-[11px]">
                    {log.latencyMs} ms
                  </td>

                  <td className="py-2.5 px-3 text-textPrimary text-[11px]">
                    <span className={log.action === 'BLOCKED_IP' ? 'text-rose-400 font-bold' : ''}>
                      {log.clientIp}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 font-sans text-textSecondary text-xs truncate max-w-[150px]">
                    {log.serviceName}
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="p-1 rounded text-textSecondary hover:text-shieldCyan hover:bg-card border border-border"
                      title="Inspect forensic trace"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center bg-card text-textSecondary">
              <FileText className="w-8 h-8 text-textMuted mx-auto mb-2" />
              <p className="text-xs">No access logs match the specified filter criteria.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-textSecondary pt-1">
          <span>Showing {filteredLogs.length} buffered log records</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Watchdog Tail Active
          </span>
        </div>
      </Card>
    </div>
  );
};
