import React from 'react';
import { Card } from './Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendGood?: boolean;
  icon?: React.ReactNode;
  statusIndicator?: 'healthy' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  change,
  trend = 'neutral',
  trendGood = true,
  icon,
  statusIndicator,
  className = ''
}) => {
  const statusColorMap = {
    healthy: 'border-l-2 border-l-emerald-500',
    warning: 'border-l-2 border-l-amber-500',
    danger: 'border-l-2 border-l-rose-500',
    info: 'border-l-2 border-l-sky-500'
  };

  const borderClass = statusIndicator ? statusColorMap[statusIndicator] : '';

  return (
    <Card className={`${borderClass} ${className}`} bodyClassName="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-textSecondary uppercase tracking-wider">{label}</span>
        {icon && <div className="text-textSecondary p-1.5 rounded bg-surface border border-border/60">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-bold font-mono text-textPrimary tracking-tight">{value}</div>
        {change && (
          <div
            className={`flex items-center gap-0.5 text-xs font-mono font-medium ${
              trend === 'up'
                ? trendGood
                  ? 'text-emerald-400'
                  : 'text-rose-400'
                : trend === 'down'
                ? trendGood
                  ? 'text-emerald-400'
                  : 'text-amber-400'
                : 'text-textSecondary'
            }`}
          >
            {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
            {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
            {change}
          </div>
        )}
      </div>

      {subValue && (
        <div className="mt-1 text-xs text-textSecondary flex items-center gap-1.5 font-mono">
          {subValue}
        </div>
      )}
    </Card>
  );
};
