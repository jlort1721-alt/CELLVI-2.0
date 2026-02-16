import { memo, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Search, Timer, TrendingUp, TrendingDown } from 'lucide-react';
import type { AgentMetrics } from '../types/agentTypes';

// Animated counter that counts up from 0
const AnimatedCounter = memo(({ value, duration = 1200, suffix = '' }: { value: number; duration?: number; suffix?: string }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{display.toLocaleString('es-CO')}{suffix}</>;
});
AnimatedCounter.displayName = 'AnimatedCounter';

const AgentMetricsPanel = memo(({ metrics }: { metrics: AgentMetrics }) => {
  const cards = [
    {
      icon: AlertTriangle,
      label: 'Alertas Procesadas Hoy',
      value: metrics.alertsGeneratedToday,
      sub: `${metrics.alertsAutoResolvedToday} auto-resueltas`,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      trend: 'up' as const,
    },
    {
      icon: CheckCircle,
      label: 'Tasa Auto-Resolución',
      value: metrics.autoResolutionRate,
      suffix: '%',
      sub: `${metrics.falsePositiveRate}% falsos positivos`,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      trend: 'up' as const,
    },
    {
      icon: Search,
      label: 'Anomalías Detectadas',
      value: metrics.anomaliesDetectedToday,
      sub: `Precisión: ${metrics.anomalyDetectionAccuracy}%`,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      trend: 'neutral' as const,
    },
    {
      icon: Timer,
      label: 'Tiempo Resp. Promedio',
      value: metrics.avgResponseTimeMs,
      suffix: 'ms',
      sub: `${metrics.escalationsToday} escalaciones hoy`,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      trend: metrics.avgResponseTimeMs < 30 ? ('up' as const) : ('down' as const),
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl p-4 border bg-sidebar/40 backdrop-blur-xl border-white/5 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-xl ${card.bg}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            {card.trend === 'up' ? (
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            ) : card.trend === 'down' ? (
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            ) : null}
          </div>
          <div className={`text-2xl font-bold font-heading tracking-tighter ${card.color}`}>
            <AnimatedCounter value={card.value} suffix={card.suffix} />
          </div>
          <div className="text-[9px] uppercase tracking-widest text-sidebar-foreground/30 font-bold mt-1">{card.label}</div>
          <div className="text-[8px] text-sidebar-foreground/20 mt-1">{card.sub}</div>
        </div>
      ))}
    </div>
  );
});
AgentMetricsPanel.displayName = 'AgentMetricsPanel';

export default AgentMetricsPanel;
