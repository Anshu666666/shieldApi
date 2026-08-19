import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TimeSeriesPoint, TimeRangeFilter } from '../../api/types';
import { Card } from '../common/Card';

interface TrafficAreaChartProps {
  data: TimeSeriesPoint[];
  range: TimeRangeFilter;
  onRangeChange: (range: TimeRangeFilter) => void;
  className?: string;
}

export const TrafficAreaChart: React.FC<TrafficAreaChartProps> = ({
  data,
  range,
  onRangeChange,
  className = ''
}) => {
  const ranges: TimeRangeFilter[] = ['15m', '1h', '24h', '7d'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/95 border border-border p-3 rounded shadow-xl text-xs font-mono backdrop-blur-md">
          <div className="text-textSecondary mb-2 font-sans font-medium">{label}</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                2xx Success:
              </span>
              <span className="font-bold">{payload[0]?.value || 0} req</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-amber-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                4xx Client Err:
              </span>
              <span className="font-bold">{payload[1]?.value || 0} req</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-rose-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                5xx Server Err:
              </span>
              <span className="font-bold">{payload[2]?.value || 0} req</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-purple-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Shield Blocked (429/403):
              </span>
              <span className="font-bold">{payload[3]?.value || 0} req</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="Traffic Telemetry & Request Distribution"
      subtitle="Live breakdown of incoming HTTP requests across response classifications"
      action={
        <div className="flex items-center gap-1 bg-surface p-0.5 rounded border border-border">
          {ranges.map(r => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer ${
                range === r
                  ? 'bg-card text-shieldCyan font-semibold border border-border'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      }
      className={className}
      bodyClassName="p-4"
    >
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="grad2xx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="grad4xx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="grad5xx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gradBlocked" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1E2936" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1E2936' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1E2936' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              height={30}
              iconType="circle"
              iconSize={8}
              formatter={value => <span className="text-[11px] text-textSecondary">{value}</span>}
            />

            <Area
              type="monotone"
              dataKey="status2xx"
              name="2xx Success"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#grad2xx)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="status4xx"
              name="4xx Client Error"
              stroke="#F59E0B"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#grad4xx)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="status5xx"
              name="5xx Server Error"
              stroke="#EF4444"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#grad5xx)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="blockedRequests"
              name="Shield Blocked (429/403)"
              stroke="#A855F7"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#gradBlocked)"
              stackId="1"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
