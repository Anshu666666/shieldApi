import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { SearchInput } from '../common/SearchInput';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge, TierBadge } from '../common/Badge';
import {
  Key,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Shield,
  Lock,
  ExternalLink
} from 'lucide-react';

export const ApiKeysTab: React.FC = () => {
  const {
    apiKeys,
    revokeApiKey,
    rotateApiKey,
    setIsCreateKeyModalOpen,
    addToast
  } = useTelemetry();

  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredKeys = apiKeys.filter(
    k =>
      k.name.toLowerCase().includes(search.toLowerCase()) ||
      k.owner.toLowerCase().includes(search.toLowerCase()) ||
      k.maskedKey.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('info', 'Copied to Clipboard', `Key hash copied.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeCount = apiKeys.filter(k => k.status === 'ACTIVE').length;
  const totalVolume = apiKeys.reduce((acc, k) => acc + k.totalRequests, 0);

  return (
    <div className="space-y-6">
      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Active API Keys"
          value={activeCount}
          subValue={`${apiKeys.length - activeCount} revoked in Redis`}
          icon={<Key className="w-4 h-4 text-shieldCyan" />}
          statusIndicator="healthy"
        />
        <MetricCard
          label="Total Key Volume"
          value={`${totalVolume.toLocaleString()} reqs`}
          subValue="Authenticated requests processed"
          icon={<Shield className="w-4 h-4 text-emerald-400" />}
          statusIndicator="healthy"
        />
        <MetricCard
          label="Redis Lookup Latency"
          value="< 0.6 ms"
          subValue="HGET api_keys {key_hash}"
          icon={<Lock className="w-4 h-4 text-sky-400" />}
          statusIndicator="healthy"
        />
      </div>

      {/* Main Keys List */}
      <Card
        title="API Key Credential Vault"
        subtitle="Manage client authentication credentials stored in the Redis Broker (HSET api_keys)"
        action={
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateKeyModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Generate Key
          </Button>
        }
        bodyClassName="p-4 space-y-4"
      >
        <div className="flex items-center justify-between gap-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by key name, owner, or token ID..."
            className="w-full sm:w-80"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-textSecondary font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-3 px-3 font-semibold">Key Name & Owner</th>
                <th className="pb-3 px-3 font-semibold">Token Identifier</th>
                <th className="pb-3 px-3 font-semibold">Access Tier</th>
                <th className="pb-3 px-3 font-semibold">Status</th>
                <th className="pb-3 px-3 font-semibold">Usage Volume</th>
                <th className="pb-3 px-3 font-semibold">Last Used</th>
                <th className="pb-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredKeys.map(k => (
                <tr key={k.id} className="hover:bg-surface/50 transition-colors font-sans">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-textPrimary">{k.name}</div>
                    <div className="text-[11px] text-textSecondary font-mono">{k.owner}</div>
                  </td>

                  <td className="py-3 px-3 font-mono">
                    <div className="flex items-center gap-1.5 bg-surface px-2 py-1 rounded border border-border/80 w-fit">
                      <span className="text-shieldCyan text-[11px]">{k.maskedKey}</span>
                      <button
                        onClick={() => handleCopy(k.id, k.key)}
                        className="text-textSecondary hover:text-textPrimary p-0.5 cursor-pointer"
                        title="Copy key"
                      >
                        {copiedId === k.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <TierBadge tier={k.tier} />
                    <div className="text-[10px] text-textSecondary font-mono mt-0.5">
                      {k.rateLimitRpm.toLocaleString()} RPM quota
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <StatusBadge status={k.status} />
                  </td>

                  <td className="py-3 px-3 font-mono">
                    <span className="font-semibold text-textPrimary">{k.totalRequests.toLocaleString()}</span>
                    <span className="text-textSecondary text-[10px] block">requests</span>
                  </td>

                  <td className="py-3 px-3 font-mono text-textSecondary text-[11px]">
                    {k.lastUsedAt}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {k.status === 'ACTIVE' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => rotateApiKey(k.id)}
                            title="Rotate secret key"
                            icon={<RefreshCw className="w-3 h-3" />}
                          >
                            Rotate
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => revokeApiKey(k.id)}
                            title="Revoke key immediately in Redis"
                            icon={<Trash2 className="w-3 h-3" />}
                          >
                            Revoke
                          </Button>
                        </>
                      )}
                      {k.status === 'REVOKED' && (
                        <span className="text-[11px] font-mono text-rose-400">Revoked</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredKeys.length === 0 && (
            <div className="p-8 text-center bg-surface rounded-lg border border-border text-textSecondary">
              <Key className="w-8 h-8 text-textMuted mx-auto mb-2" />
              <p className="text-xs">No API keys found.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
