import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTelemetry } from '../../context/TelemetryContext';
import { ShieldBan, AlertTriangle } from 'lucide-react';

export const BlockIpModal: React.FC = () => {
  const { isBlockIpModalOpen, setIsBlockIpModalOpen, manuallyBlockIp } = useTelemetry();

  const [ip, setIp] = useState('');
  const [reason, setReason] = useState('');
  const [ttlHours, setTtlHours] = useState(24);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip) return;
    setIsSubmitting(true);
    try {
      await manuallyBlockIp(ip, reason || 'Manual Administrative Ban', ttlHours * 3600);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsBlockIpModalOpen(false);
    setIp('');
    setReason('');
    setTtlHours(24);
  };

  return (
    <Modal
      isOpen={isBlockIpModalOpen}
      onClose={handleClose}
      title="Manually Blacklist IP Address"
      subtitle="Immediately block incoming traffic at the Gateway level via Redis"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>
            This IP will immediately receive <strong className="font-mono text-rose-200">403 Forbidden</strong> responses from the Gateway IP Blacklist Plugin before hitting any downstream microservice.
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-textPrimary mb-1.5">
            Client IP Address <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 198.51.100.42 or 10.0.0.55"
            value={ip}
            onChange={e => setIp(e.target.value)}
            className="w-full bg-surface text-xs font-mono text-textPrimary placeholder:text-textSecondary/50 px-3 py-2 rounded border border-border focus:border-rose-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-textPrimary mb-1.5">Blacklist Duration (TTL)</label>
          <select
            value={ttlHours}
            onChange={e => setTtlHours(Number(e.target.value))}
            className="w-full bg-surface text-xs font-mono text-textPrimary px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
          >
            <option value={1}>1 Hour (3,600s)</option>
            <option value={6}>6 Hours (21,600s)</option>
            <option value={24}>24 Hours (86,400s - Standard Default)</option>
            <option value={72}>3 Days (259,200s)</option>
            <option value={168}>7 Days (604,800s)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-textPrimary mb-1.5">Reason for Ban</label>
          <textarea
            rows={2}
            placeholder="e.g. Malicious SQL injection probe, abnormal rate limit drain..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full bg-surface text-xs text-textPrimary placeholder:text-textSecondary/50 px-3 py-2 rounded border border-border focus:border-shieldCyan focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isSubmitting}
            icon={<ShieldBan className="w-3.5 h-3.5" />}
          >
            Blacklist IP in Redis
          </Button>
        </div>
      </form>
    </Modal>
  );
};
