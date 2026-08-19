import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../common/Card';

interface LatencyBarChartProps {
  className?: string;
}

export const LatencyBarChart: React.FC<LatencyBarChartProps> = ({ className = '' }) => {
  const latencyData = [
    { bucket: '< 10ms', count: 820, percent: 58 },
    { bucket: '10-25ms', count: 410, percent: 29 },
    { bucket: '25-50ms', count: 120, percent: 8.5 },
    { bucket: '50-100ms', count: 42, percent: 3 },
    { bucket: '100-250ms', count: 16, percent: 1.1 },
    { bucket: '> 250ms', count: 6, percent: 0.4 }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/95 border border-border p-2.5 rounded shadow-xl text-xs font-mono backdrop-blur-md">
          <div className="text-textPrimary font-semibold mb-1">{label}</div>
          <div className="text-shieldCyan flex items-center justify-between gap-3">
            <span>Requests:</span>
            <span className="font-bold">{payload[0]?.value} req</span>
          </div>
          <div className="text-textSecondary flex items-center justify-between gap-3 text-[11px]">
            <span>Share:</span>
            <span>{payload[0]?.payload?.percent}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="Latency Distribution"
      subtitle="Response latency histogram (Gateway + Redis lookup + Proxy)"
      className={className}
      bodyClassName="p-4"
    >
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={latencyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2936" vertical={false} />
            <XAxis
              dataKey="bucket"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#1E2936' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#1E2936' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#06B6D4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-center font-mono">
        <div>
          <div className="text-[10px] text-textSecondary uppercase">P50 (Median)</div>
          <div className="text-sm font-bold text-emerald-400">14.2 ms</div>
        </div>
        <div>
          <div className="text-[10px] text-textSecondary uppercase">P95</div>
          <div className="text-sm font-bold text-sky-400">44.1 ms</div>
        </div>
        <div>
          <div className="text-[10px] text-textSecondary uppercase">P99</div>
          <div className="text-sm font-bold text-amber-400">88.6 ms</div>
        </div>
      </div>
    </Card>
  );
};
