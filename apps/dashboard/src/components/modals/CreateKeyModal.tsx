import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTelemetry } from '../../context/TelemetryContext';
import { KeyTier, ApiKeyRecord } from '../../api/types';
import { Key, Copy, Check, ShieldAlert } from 'lucide-react';

export const CreateKeyModal: React.FC = () => {
  const { isCreateKeyModalOpen, setIsCreateKeyModalOpen, createApiKey, services } = useTelemetry();

  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [tier, setTier] = useState<KeyTier>('STANDARD');
  const [selectedServices, setSelectedServices] = useState<string[]>(['*']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKeyRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !owner) return;
    setIsSubmitting(true);
    try {
      const result = await createApiKey(name, owner, tier, selectedServices);
      setCreatedKey(result);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setIsCreateKeyModalOpen(false);
    setName('');
    setOwner('');
    setTier('STANDARD');
    setSelectedServices(['*']);
    setCreatedKey(null);
  };

  return (
    <Modal
      isOpen={isCreateKeyModalOpen}
      onClose={handleClose}
      title={createdKey ? "API Key Generated Successfully" : "Generate Secure API Key"}
      subtitle={createdKey ? "Copy this key now. It will never be displayed in full again." : "Assign cryptographic client credentials to route through ShieldAPI"}
      maxWidth="md"
    >
      {createdKey ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
              <ShieldAlert className="w-4 h-4" />
              API Key Provisioned in Redis Key Store
            </div>
            <p className="text-textSecondary">
              Your key is active and ready for authentication via the <code className="font-mono text-textPrimary">X-API-Key</code> request header.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono text-textSecondary uppercase mb-1">Full Secret API Key</label>
            <div className="flex items-center gap-2 p-2.5 rounded bg-surface border border-border">
              <input
                type="text"
                readOnly
                value={createdKey.key}
                className="w-full bg-transparent text-xs font-mono text-shieldCyan focus:outline-none select-all"
              />
              <Button
                size="sm"
                variant="primary"
                onClick={handleCopy}
                icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2">
            <div className="p-2.5 rounded bg-surface border border-border">
              <span className="text-textSecondary block text-[10px]">CLIENT / APP</span>
              <span className="font-bold text-textPrimary">{createdKey.name}</span>
            </div>
            <div className="p-2.5 rounded bg-surface border border-border">
              <span className="text-textSecondary block text-[10px]">TIER / RATE LIMIT</span>
              <span className="font-bold text-shieldCyan">{createdKey.tier} ({createdKey.rateLimitRpm} RPM)</span>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-border">
            <Button variant="secondary" onClick={handleClose}>
              Done & Return to Key Vault
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-textPrimary mb-1.5">
              Key Name / Application <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile iOS Client v2, Partner Ingestion Hook"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-surface text-xs text-textPrimary placeholder:text-textSecondary/50 px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-textPrimary mb-1.5">
              Owner / Organization <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Platform Team, Acme Corp, internal-sec"
              value={owner}
              onChange={e => setOwner(e.target.value)}
              className="w-full bg-surface text-xs text-textPrimary placeholder:text-textSecondary/50 px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-textPrimary mb-1.5">Access Tier</label>
              <select
                value={tier}
                onChange={e => setTier(e.target.value as KeyTier)}
                className="w-full bg-surface text-xs text-textPrimary px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
              >
                <option value="STANDARD">Standard (1,200 RPM)</option>
                <option value="ENTERPRISE">Enterprise (5,000 RPM)</option>
                <option value="DEVELOPER">Developer (300 RPM)</option>
                <option value="INTERNAL">Internal (Unlimited)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-textPrimary mb-1.5">Routing Scope</label>
              <select
                value={selectedServices[0]}
                onChange={e => setSelectedServices([e.target.value])}
                className="w-full bg-surface text-xs text-textPrimary px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
              >
                <option value="*">All Microservices (*)</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 rounded bg-surface border border-border text-xs text-textSecondary flex items-start gap-2">
            <Key className="w-4 h-4 text-shieldCyan shrink-0 mt-0.5" />
            <span>
              Generates a 256-bit entropy hexadecimal key stored in Redis Hash <code className="text-textPrimary font-mono">api_keys</code> for sub-millisecond authentication.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Generate Key
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
