import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTelemetry } from '../../context/TelemetryContext';
import { HttpMethod } from '../../api/types';
import { Globe, Server } from 'lucide-react';

export const AddServiceModal: React.FC = () => {
  const { isAddServiceModalOpen, setIsAddServiceModalOpen, addService } = useTelemetry();

  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedMethods, setSelectedMethods] = useState<HttpMethod[]>(['GET', 'POST']);
  const [rateLimitCapacity, setRateLimitCapacity] = useState(50);
  const [rateLimitRefill, setRateLimitRefill] = useState(10.0);
  const [description, setDescription] = useState('');

  const allMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  const toggleMethod = (m: HttpMethod) => {
    if (selectedMethods.includes(m)) {
      if (selectedMethods.length > 1) {
        setSelectedMethods(selectedMethods.filter(item => item !== m));
      }
    } else {
      setSelectedMethods([...selectedMethods, m]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !endpoint || !targetUrl) return;

    addService({
      name,
      endpoint: endpoint.startsWith('/') ? endpoint : `/${endpoint}`,
      targetUrl,
      methods: selectedMethods,
      status: 'HEALTHY',
      requestsPerMin: 0,
      avgLatencyMs: 15,
      p95LatencyMs: 30,
      rateLimitCapacity,
      rateLimitRefill,
      uptime: '100.0%',
      description
    });

    handleClose();
  };

  const handleClose = () => {
    setIsAddServiceModalOpen(false);
    setName('');
    setEndpoint('');
    setTargetUrl('');
    setSelectedMethods(['GET', 'POST']);
    setRateLimitCapacity(50);
    setRateLimitRefill(10.0);
    setDescription('');
  };

  return (
    <Modal
      isOpen={isAddServiceModalOpen}
      onClose={handleClose}
      title="Register Downstream Microservice"
      subtitle="Expose and protect an internal microservice endpoint behind ShieldAPI"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-textPrimary mb-1.5">
              Service Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Orders Management API"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-surface text-xs text-textPrimary placeholder:text-textSecondary/50 px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-textPrimary mb-1.5">
              Gateway Exposure Path <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="/api/v1/orders"
                value={endpoint}
                onChange={e => setEndpoint(e.target.value)}
                className="w-full bg-surface text-xs font-mono text-textPrimary placeholder:text-textSecondary/50 px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-textPrimary mb-1.5">
            Internal Target Forwarding URL <span className="text-rose-400">*</span>
          </label>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-textSecondary shrink-0" />
            <input
              type="text"
              required
              placeholder="http://orders-service:8085 or http://10.0.0.45:8000"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              className="w-full bg-surface text-xs font-mono text-textPrimary placeholder:text-textSecondary/50 px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-textPrimary mb-1.5">Allowed HTTP Methods</label>
          <div className="flex flex-wrap gap-2">
            {allMethods.map(m => (
              <button
                type="button"
                key={m}
                onClick={() => toggleMethod(m)}
                className={`px-3 py-1.5 rounded text-xs font-mono font-medium border transition-colors cursor-pointer ${
                  selectedMethods.includes(m)
                    ? 'bg-shieldCyan/20 text-shieldCyan border-shieldCyan/60'
                    : 'bg-surface text-textSecondary border-border hover:border-borderLight'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-surface border border-border">
          <div>
            <label className="block text-xs font-mono text-textSecondary uppercase mb-1">
              Token Bucket Capacity (Max Burst)
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={rateLimitCapacity}
              onChange={e => setRateLimitCapacity(Number(e.target.value))}
              className="w-full bg-card text-xs font-mono text-textPrimary px-3 py-1.5 rounded border border-border focus:border-shieldCyan focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-textSecondary uppercase mb-1">
              Token Refill Rate (Tokens / Sec)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="200"
              value={rateLimitRefill}
              onChange={e => setRateLimitRefill(Number(e.target.value))}
              className="w-full bg-card text-xs font-mono text-textPrimary px-3 py-1.5 rounded border border-border focus:border-shieldCyan focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-textPrimary mb-1.5">Description (Optional)</label>
          <textarea
            rows={2}
            placeholder="Brief summary of microservice responsibility..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-surface text-xs text-textPrimary placeholder:text-textSecondary/50 px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={<Globe className="w-3.5 h-3.5" />}>
            Register Service
          </Button>
        </div>
      </form>
    </Modal>
  );
};
