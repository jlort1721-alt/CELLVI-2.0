/**
 * KPI Card Component
 * Memoized for performance in dashboard grids
 */

import React, { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'up' | 'down' | 'neutral';
  color: string;
  sparkData?: number[];
}

const Sparkline = memo(({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) => {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          fill={`url(#spark-${color.replace('#', '')})`}
          strokeWidth={1.5}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

Sparkline.displayName = 'Sparkline';

const KpiCardComponent: React.FC<KpiCardProps> = ({
  icon: Icon,
  label,
  value,
  delta,
  deltaType,
  color,
  sparkData,
}) => {
  return (
    <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border group hover:border-sidebar-foreground/20 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {delta && (
          <span
            className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
              deltaType === 'up'
                ? 'bg-green-500/10 text-green-500'
                : deltaType === 'down'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-sidebar-foreground/5 text-sidebar-foreground/40'
            }`}
          >
            {deltaType === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : deltaType === 'down' ? (
              <TrendingDown className="w-3 h-3" />
            ) : null}
            {delta}
          </span>
        )}
      </div>
      <div className="font-bold text-xl text-sidebar-foreground font-heading leading-none mb-0.5">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-medium">
        {label}
      </div>
      {sparkData && (
        <div className="mt-2 -mx-1">
          <Sparkline data={sparkData} color={color} />
        </div>
      )}
    </div>
  );
};

/**
 * Comparison function for memo
 */
const areEqual = (prevProps: KpiCardProps, nextProps: KpiCardProps): boolean => {
  return (
    prevProps.label === nextProps.label &&
    prevProps.value === nextProps.value &&
    prevProps.delta === nextProps.delta &&
    prevProps.deltaType === nextProps.deltaType &&
    prevProps.color === nextProps.color &&
    JSON.stringify(prevProps.sparkData) === JSON.stringify(nextProps.sparkData)
  );
};

export const KpiCard = memo(KpiCardComponent, areEqual);
