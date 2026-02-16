import { memo } from "react";
import { Car, AlertTriangle, Fuel, Route, Gauge, Shield, TrendingUp, TrendingDown } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { formatNumber, formatKm } from "@/lib/demoData";

/* ── Sparkline mini chart ─────────────────────────────── */
const Sparkline = memo(({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) => {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} fill={`url(#spark-${color.replace("#", "")})`} strokeWidth={1.5} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
});
Sparkline.displayName = "Sparkline";

/* ── KPI Card ─────────────────────────────────────────── */
export const KpiCard = memo(({ icon: Icon, label, value, delta, deltaType, color, sparkData }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "up" | "down" | "neutral";
  color: string;
  sparkData?: number[];
}) => (
  <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border group hover:border-sidebar-foreground/20 transition-colors">
    <div className="flex items-start justify-between mb-2">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      {delta && (
        <span className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${deltaType === "up" ? "bg-green-500/10 text-green-500" : deltaType === "down" ? "bg-red-500/10 text-red-400" : "bg-sidebar-foreground/5 text-sidebar-foreground/40"
          }`}>
          {deltaType === "up" ? <TrendingUp className="w-3 h-3" /> : deltaType === "down" ? <TrendingDown className="w-3 h-3" /> : null}
          {delta}
        </span>
      )}
    </div>
    <div className="font-bold text-xl text-sidebar-foreground font-heading leading-none mb-0.5">{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-medium">{label}</div>
    {sparkData && <div className="mt-2 -mx-1"><Sparkline data={sparkData} color={color} /></div>}
  </div>
));
KpiCard.displayName = "KpiCard";

/* ── KPI Section ─────────────────────────────────────── */
interface KPISectionProps {
  vehicleCount: number;
  activeCount: number;
  alertCount: number;
  inspectionsToday: number;
  failedInspections: number;
  kmToday: number;
  kmThisMonth: number;
  efficiency: number;
  last7DaysKm: number[];
  loadingStats: boolean;
  loadingVehicles: boolean;
}

export const KPISection = memo(({
  vehicleCount, activeCount, alertCount, inspectionsToday, failedInspections,
  kmToday, kmThisMonth, efficiency, last7DaysKm, loadingStats, loadingVehicles
}: KPISectionProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <KpiCard
        icon={Car}
        label="Vehículos"
        value={loadingStats ? "..." : vehicleCount}
        delta="+2 sem"
        deltaType="up"
        color="#22c55e"
        sparkData={[5, 5, 6, 5, 6, 7, 6, 7, 8, 8]}
      />
      <KpiCard
        icon={Gauge}
        label="En Movimiento"
        value={loadingVehicles ? "..." : activeCount}
        delta={`${Math.round((activeCount / (vehicleCount || 1)) * 100)}%`}
        deltaType="neutral"
        color="#3b82f6"
      />
      <KpiCard
        icon={AlertTriangle}
        label="Alertas (Crit)"
        value={loadingStats ? "..." : alertCount}
        delta="Pendientes"
        deltaType="down"
        color="#ef4444"
        sparkData={[2, 3, 2, 4, 5, 2, 1, 2, 3, alertCount]}
      />
      <KpiCard
        icon={Shield}
        label="Inspecciones Hoy"
        value={loadingStats ? "..." : inspectionsToday}
        delta={`${failedInspections} fallidas`}
        deltaType="neutral"
        color="#a855f7"
      />
      <KpiCard
        icon={Route}
        label="Km Hoy"
        value={formatNumber(kmToday)}
        delta={`${formatKm(kmThisMonth)} este mes`}
        deltaType="up"
        color="hsl(45,95%,55%)"
        sparkData={last7DaysKm}
      />
      <KpiCard
        icon={Fuel}
        label="Eficiencia"
        value={`${efficiency.toFixed(0)}%`}
        delta="Global"
        deltaType="up"
        color="#f97316"
        sparkData={[90, 92, 91, 93, 94]}
      />
    </div>
  );
});
KPISection.displayName = "KPISection";
