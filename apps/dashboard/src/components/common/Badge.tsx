import React from 'react';
import { HttpMethod, ServiceStatus, KeyTier, AnomalySeverity, TrafficAction } from '../../api/types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = ''
}) => {
  const variantStyles = {
    default: 'bg-border text-textSecondary border-border',
    success: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    warning: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
    danger: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
    info: 'bg-sky-950/60 text-sky-400 border-sky-800/60',
    purple: 'bg-purple-950/60 text-purple-400 border-purple-800/60',
    neutral: 'bg-surface text-textSecondary border-border'
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-mono font-medium',
    md: 'text-xs px-2.5 py-1 font-mono font-medium'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const MethodBadge: React.FC<{ method: HttpMethod; size?: 'sm' | 'md' }> = ({ method, size = 'sm' }) => {
  const methodMap: Record<HttpMethod, 'info' | 'success' | 'warning' | 'danger' | 'purple' | 'neutral'> = {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    PATCH: 'purple',
    DELETE: 'danger',
    OPTIONS: 'neutral',
    HEAD: 'neutral'
  };

  return (
    <Badge variant={methodMap[method] || 'neutral'} size={size}>
      {method}
    </Badge>
  );
};

export const StatusBadge: React.FC<{ status: ServiceStatus | 'ACTIVE' | 'REVOKED' | 'EXPIRED' }> = ({ status }) => {
  const map: Record<string, { variant: 'success' | 'warning' | 'danger'; label: string; dot: string }> = {
    HEALTHY: { variant: 'success', label: 'HEALTHY', dot: 'bg-emerald-400' },
    ACTIVE: { variant: 'success', label: 'ACTIVE', dot: 'bg-emerald-400' },
    DEGRADED: { variant: 'warning', label: 'DEGRADED', dot: 'bg-amber-400' },
    DOWN: { variant: 'danger', label: 'DOWN', dot: 'bg-rose-400' },
    REVOKED: { variant: 'danger', label: 'REVOKED', dot: 'bg-rose-400' },
    EXPIRED: { variant: 'warning', label: 'EXPIRED', dot: 'bg-amber-400' }
  };

  const conf = map[status] || { variant: 'warning', label: status, dot: 'bg-amber-400' };

  return (
    <Badge variant={conf.variant}>
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot} animate-pulse`} />
      {conf.label}
    </Badge>
  );
};

export const TierBadge: React.FC<{ tier: KeyTier }> = ({ tier }) => {
  const map: Record<KeyTier, { variant: 'purple' | 'info' | 'success' | 'neutral'; label: string }> = {
    ENTERPRISE: { variant: 'purple', label: 'ENTERPRISE' },
    STANDARD: { variant: 'info', label: 'STANDARD' },
    DEVELOPER: { variant: 'success', label: 'DEVELOPER' },
    INTERNAL: { variant: 'neutral', label: 'INTERNAL' }
  };
  const conf = map[tier] || { variant: 'neutral', label: tier };
  return <Badge variant={conf.variant}>{conf.label}</Badge>;
};

export const SeverityBadge: React.FC<{ severity: AnomalySeverity }> = ({ severity }) => {
  const map: Record<AnomalySeverity, { variant: 'danger' | 'warning' | 'info' | 'success'; label: string }> = {
    CRITICAL: { variant: 'danger', label: 'CRITICAL' },
    WARNING: { variant: 'warning', label: 'WARNING' },
    INFO: { variant: 'info', label: 'INFO' },
    RESOLVED: { variant: 'success', label: 'RESOLVED' }
  };
  const conf = map[severity] || { variant: 'info', label: severity };
  return <Badge variant={conf.variant}>{conf.label}</Badge>;
};

export const ActionBadge: React.FC<{ action: TrafficAction; statusCode: number }> = ({ action, statusCode }) => {
  if (action === 'ALLOWED') {
    return <Badge variant="success">ALLOWED ({statusCode})</Badge>;
  }
  if (action === 'RATE_LIMITED') {
    return <Badge variant="warning">429 THROTTLED</Badge>;
  }
  if (action === 'BLOCKED_IP') {
    return <Badge variant="danger">403 BLOCKED IP</Badge>;
  }
  if (action === 'INVALID_KEY') {
    return <Badge variant="danger">401 INVALID KEY</Badge>;
  }
  return <Badge variant="danger">{statusCode} ERROR</Badge>;
};
