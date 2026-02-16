import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, Minus, Sparkles, ArrowUpRight,
  ArrowDownRight, Activity, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Status Pulse ───────────────────────────────────────────
interface StatusPulseProps {
  status: 'operational' | 'warning' | 'critical' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const StatusPulse = memo(({ status, size = 'md', label }: StatusPulseProps) => {
  const colors = {
    operational: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
    offline: 'bg-slate-400',
  };
  const sizes = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' };
  const pulseSizes = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' };

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex">
        <span className={cn(
          'animate-ping absolute inline-flex rounded-full opacity-75',
          colors[status], pulseSizes[size]
        )} />
        <span className={cn(
          'relative inline-flex rounded-full',
          colors[status], sizes[size]
        )} />
      </span>
      {label && (
        <span className="text-xs font-medium text-muted-foreground capitalize">
          {label}
        </span>
      )}
    </div>
  );
});
StatusPulse.displayName = 'StatusPulse';

// ─── Executive KPI Card ─────────────────────────────────────
interface ExecutiveKPIProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ElementType;
  accentColor?: string;
  sparklineData?: number[];
  status?: 'good' | 'warning' | 'critical';
  delay?: number;
}

export const ExecutiveKPI = memo(({
  title, value, subtitle, trend, trendLabel, icon: Icon,
  accentColor = '#d4af37', sparklineData, status = 'good', delay = 0
}: ExecutiveKPIProps) => {
  const trendColor = trend && trend > 0
    ? 'text-emerald-500'
    : trend && trend < 0
      ? 'text-red-500'
      : 'text-slate-400';

  const TrendIcon = trend && trend > 0 ? ArrowUpRight : trend && trend < 0 ? ArrowDownRight : Minus;

  const sparklinePath = useMemo(() => {
    if (!sparklineData || sparklineData.length < 2) return '';
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const width = 80;
    const height = 24;
    const step = width / (sparklineData.length - 1);
    return sparklineData
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${i * step},${height - ((v - min) / range) * height}`)
      .join(' ');
  }, [sparklineData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
        <div
          className="absolute top-0 left-0 w-1 h-full rounded-l"
          style={{ backgroundColor: accentColor }}
        />
        <CardContent className="p-4 pl-5">
          <div className="flex items-start justify-between mb-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <Icon className="w-4 h-4" style={{ color: accentColor }} />
            </div>
            {trend !== undefined && (
              <div className={cn('flex items-center gap-0.5 text-xs font-semibold', trendColor)}>
                <TrendIcon className="w-3 h-3" />
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {sparklineData && sparklineData.length > 1 && (
            <div className="mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
              <svg width="80" height="24" viewBox="0 0 80 24" className="overflow-visible">
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});
ExecutiveKPI.displayName = 'ExecutiveKPI';

// ─── Progress Ring ──────────────────────────────────────────
interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
}

export const ProgressRing = memo(({
  value, max = 100, size = 64, strokeWidth = 6,
  color = '#d4af37', label, showValue = true
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(value / max * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {showValue && (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      {label && (
        <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight max-w-16">
          {label}
        </span>
      )}
    </div>
  );
});
ProgressRing.displayName = 'ProgressRing';

// ─── AI Insight Card ────────────────────────────────────────
interface AIInsightProps {
  type: 'prediction' | 'recommendation' | 'achievement' | 'warning';
  title: string;
  description: string;
  confidence?: number;
  timestamp?: string;
}

export const AIInsight = memo(({ type, title, description, confidence, timestamp }: AIInsightProps) => {
  const config = {
    prediction: { border: 'border-l-amber-500', bg: 'bg-amber-500/5', icon: Activity, iconColor: 'text-amber-500' },
    recommendation: { border: 'border-l-blue-500', bg: 'bg-blue-500/5', icon: Sparkles, iconColor: 'text-blue-500' },
    achievement: { border: 'border-l-emerald-500', bg: 'bg-emerald-500/5', icon: CheckCircle2, iconColor: 'text-emerald-500' },
    warning: { border: 'border-l-red-500', bg: 'bg-red-500/5', icon: AlertTriangle, iconColor: 'text-red-500' },
  };

  const { border, bg, icon: InsightIcon, iconColor } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('p-4 border-l-4 rounded-r-lg', border, bg)}
    >
      <div className="flex items-start gap-3">
        <InsightIcon className={cn('w-4 h-4 mt-0.5 shrink-0', iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm">{title}</p>
            {confidence && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {confidence}% conf.
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
          {timestamp && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {timestamp}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
AIInsight.displayName = 'AIInsight';

// ─── Area Header ────────────────────────────────────────────
interface AreaHeaderProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  subtitle: string;
  status?: 'operational' | 'warning' | 'critical';
  actions?: React.ReactNode;
}

export const AreaHeader = memo(({
  icon: Icon, iconColor, title, subtitle, status = 'operational', actions
}: AreaHeaderProps) => (
  <div className="flex items-start justify-between">
    <div className="flex items-start gap-3">
      <div
        className="p-2.5 rounded-xl shadow-sm"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <Icon className="w-6 h-6" style={{ color: iconColor }} />
      </div>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <StatusPulse status={status} size="sm" label={
            status === 'operational' ? 'Operativo' :
            status === 'warning' ? 'Atención' : 'Crítico'
          } />
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
));
AreaHeader.displayName = 'AreaHeader';

// ─── Metric Row ─────────────────────────────────────────────
interface MetricRowProps {
  label: string;
  value: string | number;
  change?: number;
  target?: string;
  color?: string;
}

export const MetricRow = memo(({ label, value, change, target, color }: MetricRowProps) => (
  <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
    <div className="flex items-center gap-2">
      {color && (
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <div className="flex items-center gap-3">
      {target && (
        <span className="text-xs text-muted-foreground/60">meta: {target}</span>
      )}
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      {change !== undefined && (
        <span className={cn(
          'text-xs font-medium flex items-center gap-0.5',
          change > 0 ? 'text-emerald-500' : change < 0 ? 'text-red-500' : 'text-slate-400'
        )}>
          {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : null}
          {change > 0 ? '+' : ''}{change}%
        </span>
      )}
    </div>
  </div>
));
MetricRow.displayName = 'MetricRow';

// ─── Section Divider ────────────────────────────────────────
interface SectionDividerProps {
  title: string;
  action?: React.ReactNode;
}

export const SectionDivider = memo(({ title, action }: SectionDividerProps) => (
  <div className="flex items-center justify-between py-1">
    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
      {title}
    </h3>
    {action}
  </div>
));
SectionDivider.displayName = 'SectionDivider';

// ─── Priority Badge ─────────────────────────────────────────
export const PriorityBadge = memo(({ priority }: { priority: 'critical' | 'high' | 'medium' | 'low' }) => {
  const config = {
    critical: 'bg-red-500/10 text-red-600 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    low: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  };
  const labels = { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja' };

  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold', config[priority])}>
      {labels[priority]}
    </Badge>
  );
});
PriorityBadge.displayName = 'PriorityBadge';
