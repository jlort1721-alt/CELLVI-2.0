
import { useState, useEffect, useCallback } from "react";
import { Car, AlertTriangle, Fuel, MapPin, Gauge, Route, TrendingUp, TrendingDown, Activity, Clock, Search, Zap, Shield, Battery, Signal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDashboardStats, useFleetStatus, useRecentAlerts } from "@/features/dashboard/hooks/useRealtimeDashboard";
import { LineChart, Line, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { vehicles, alerts, platformStats, generateTelemetryData, formatNumber, formatKm } from "@/lib/demoData";
import { useDeferredSearch } from "@/hooks/useDeferredSearch";

/* ── Sparkline mini chart ─────────────────────────────── */
const Sparkline = ({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) => {
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
};

/* ── KPI Card ─────────────────────────────────────────── */
const KpiCard = ({ icon: Icon, label, value, delta, deltaType, color, sparkData }: {
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
);

/* ── Shortcuts ────────────────────────────────────────── */
const shortcuts = [
  { key: "G", label: "Vista General" },
  { key: "M", label: "Mapa" },
  { key: "A", label: "Alertas" },
  { key: "R", label: "Reportes" },
  { key: "?", label: "Ayuda" },
];

/* ── Main Dashboard ───────────────────────────────────── */
const DashboardOverview = () => {
  const { t } = useTranslation();

  // Realtime Data Hooks
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: vehicles, isLoading: loadingVehicles } = useFleetStatus();
  const { data: alerts, isLoading: loadingAlerts } = useRecentAlerts();

  const [showShortcuts, setShowShortcuts] = useState(false);
  const { query: searchQuery, deferredQuery, isPending: searchPending, setQuery: setSearchQuery } = useDeferredSearch({ debounceMs: 300 });

  const handleKeyboard = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === "?") setShowShortcuts((v) => !v);
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyboard);
    return () => document.removeEventListener("keydown", handleKeyboard);
  }, [handleKeyboard]);

  const severityColor: Record<string, string> = {
    critical: "bg-red-500", high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-blue-400", info: "bg-sidebar-foreground/20",
  };

  // Filter logic - use demo vehicles as fallback, use deferredQuery for non-blocking filtering
  const allVehicles = vehicles?.length > 0 ? vehicles : demoVehicles;
  const filteredVehicles = deferredQuery
    ? allVehicles?.filter((v: any) =>
      v.plate.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      (v.driver && v.driver.toLowerCase().includes(deferredQuery.toLowerCase()))
    )
    : allVehicles;

  // Use demo data as fallback
  const demoVehicles = vehicles || [];
  const demoAlerts = alerts.map((alert, i) => ({
    id: alert.id,
    msg: alert.message,
    time: new Date(alert.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    severity: alert.severity === 'high' ? 'critical' : alert.severity
  }));

  // Realistic telemetry data
  const telemetryData = generateTelemetryData(30);
  const last7Days = telemetryData.slice(-7);

  // Safe defaults with demo data fallback
  const vehicleCount = stats?.vehicles || platformStats.totalVehicles;
  const activeVehicles = vehicles?.filter(v => v.status === 'activo') || demoVehicles.filter(v => v.status === 'activo');
  const activeCount = activeVehicles.length || platformStats.activeVehicles;
  const alertCount = stats?.criticalAlerts || alerts.filter(a => a.severity === 'high').length;
  const efficiency = stats?.efficiency ? (stats.efficiency * 100) : platformStats.fuelSavings;
  const kmToday = telemetryData[telemetryData.length - 1]?.distanceKm || 8247;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Header ────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-sidebar-foreground text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold" /> Command Center
          </h2>
          <p className="text-[10px] text-sidebar-foreground/40">
            Operación en tiempo real • {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-sidebar-foreground/30" />
            <input
              type="text"
              placeholder="Buscar vehículo… (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-sidebar-accent border border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30 w-48 focus:w-64 transition-all focus:border-gold/40 outline-none"
            />
          </div>
          <button
            onClick={() => setShowShortcuts((v) => !v)}
            className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-sidebar-foreground/40 bg-sidebar-accent border border-sidebar-border hover:border-sidebar-foreground/20"
          >
            <span className="font-mono">?</span> Atajos
          </button>
        </div>
      </div>

      {/* ── Shortcuts Modal ───────────────────────────── */}
      {showShortcuts && (
        <div className="rounded-xl p-4 border bg-sidebar-accent border-gold/20 animate-in fade-in mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-sidebar-foreground text-sm">⌨️ Atajos de Teclado</h3>
            <button onClick={() => setShowShortcuts(false)} className="text-sidebar-foreground/40 text-xs">Cerrar</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {shortcuts.map((s) => (
              <div key={s.key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar border border-sidebar-border">
                <kbd className="px-1.5 py-0.5 rounded bg-sidebar-foreground/10 text-sidebar-foreground text-[10px] font-mono font-bold">{s.key}</kbd>
                <span className="text-[10px] text-sidebar-foreground/60">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KPI Row ───────────────────────────────────── */}
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
          value={loadingStats ? "..." : stats?.inspectionsToday || 0}
          delta={`${stats?.failedInspections || 0} fallidas`}
          deltaType="neutral"
          color="#a855f7"
        />
        <KpiCard
          icon={Route}
          label="Km Hoy"
          value={formatNumber(kmToday)}
          delta={`${formatKm(platformStats.kmTraveledThisMonth)} este mes`}
          deltaType="up"
          color="hsl(45,95%,55%)"
          sparkData={last7Days.map(d => d.distanceKm / 100)}
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

      {/* ── Main Content Grid ─────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* 1. Realtime Alerts Timeline */}
        <div className="lg:col-span-2 rounded-xl p-4 border bg-sidebar border-sidebar-border h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h3 className="font-heading font-bold text-sidebar-foreground text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold" /> Actividad en Tiempo Real
            </h3>
            <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
            </span>
          </div>

          <div className="space-y-1 overflow-y-auto flex-1 pr-2">
            {loadingAlerts ? (
              <div className="text-xs text-sidebar-foreground/40 text-center py-10">Cargando eventos...</div>
            ) : (alerts?.length === 0 && demoAlerts.length === 0) ? (
              <div className="text-xs text-sidebar-foreground/40 text-center py-10">Sin alertas recientes</div>
            ) : (
              (alerts?.length > 0 ? alerts : demoAlerts)?.map((item, i) => (
                <div key={item.id || i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-sidebar-foreground/[0.03] transition-colors group cursor-pointer border border-transparent hover:border-sidebar-border/50">
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${severityColor[item.severity] || "bg-gray-400"}`} />
                    {i < (alerts?.length || 0) - 1 && <div className="w-px h-full bg-sidebar-border/50 min-h-[20px]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-sidebar-foreground font-medium">{item.msg}</div>
                    <div className="text-[10px] text-sidebar-foreground/30 mt-0.5 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {item.time}
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${item.severity === "critical" || item.severity === "high"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-sidebar-foreground/5 text-sidebar-foreground/40"
                    }`}>
                    Gestionar
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Fleet Status List */}
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h3 className="font-heading font-bold text-sidebar-foreground text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold" /> Estado de Flota
            </h3>
            <span className="text-[10px] text-sidebar-foreground/40">{activeCount} activos</span>
          </div>

          <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
            {loadingVehicles ? (
              <div className="text-xs text-center py-10 text-muted-foreground">Cargando flota...</div>
            ) : (
              filteredVehicles?.map((v: any) => {
                const statusColor = v.status === 'activo' ? 'bg-green-500' : v.status === 'detenido' ? 'bg-yellow-500' : v.status === 'alerta' ? 'bg-red-500' : 'bg-gray-500';

                return (
                  <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-sidebar-foreground/[0.03] transition-colors cursor-pointer group border border-transparent hover:border-sidebar-border/30">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 relative">
                        {v.status === 'activo' && <div className="absolute inset-0 rounded-full animate-ping opacity-75 bg-green-500" />}
                        <div className={`relative w-full h-full rounded-full ${statusColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-sidebar-foreground font-bold">{v.plate}</span>
                          {v.speed && v.speed > 0 && (
                            <span className="text-[9px] text-blue-400 font-mono">{v.speed} km/h</span>
                          )}
                        </div>
                        <span className="text-[10px] text-sidebar-foreground/30 block truncate">{v.driver}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.fuel !== undefined && (
                        <div className="flex flex-col items-end">
                          <Fuel className={`w-3 h-3 ${v.fuel > 50 ? 'text-green-500' : v.fuel > 30 ? 'text-yellow-500' : 'text-red-500'}`} />
                          <span className="text-[9px] text-sidebar-foreground/40">{v.fuel}%</span>
                        </div>
                      )}
                      {v.signal !== undefined && (
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((bar) => (
                            <div
                              key={bar}
                              className={`w-0.5 rounded-full ${
                                bar <= v.signal ? 'bg-blue-500' : 'bg-sidebar-border'
                              }`}
                              style={{ height: `${bar * 2 + 4}px` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-sidebar-border mt-2 flex justify-between text-[10px] text-sidebar-foreground/40">
            <span>Total: {allVehicles?.length || 0}</span>
            <span>Activos: {activeCount}</span>
          </div>
        </div>

      </div>

      {/* ── Operations Charts Grid ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Distance Chart */}
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <h3 className="font-heading font-bold text-sidebar-foreground text-sm mb-4 flex items-center gap-2">
            <Route className="w-4 h-4 text-gold" />
            Distancia Recorrida (Últimos 7 Días)
          </h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(45,95%,55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(45,95%,55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(val) => new Date(val).getDate().toString()} />
                <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(222,55%,12%)", border: "1px solid hsl(45,95%,55%,0.2)", borderRadius: 8, fontSize: 11, color: "white" }}
                  labelFormatter={(val) => new Date(val).toLocaleDateString('es-CO')}
                  formatter={(value: any) => [`${formatNumber(value)} km`, 'Distancia']}
                />
                <Area type="monotone" dataKey="distanceKm" stroke="hsl(45,95%,55%)" fill="url(#distGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts & Active Vehicles Chart */}
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <h3 className="font-heading font-bold text-sidebar-foreground text-sm mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gold" />
            Actividad de Flota (Últimos 7 Días)
          </h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(val) => new Date(val).getDate().toString()} />
                <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(222,55%,12%)", border: "1px solid hsl(45,95%,55%,0.2)", borderRadius: 8, fontSize: 11, color: "white" }}
                  labelFormatter={(val) => new Date(val).toLocaleDateString('es-CO')}
                />
                <Area type="monotone" dataKey="activeVehicles" stroke="#22c55e" fill="url(#activeGrad)" strokeWidth={2} name="Vehículos Activos" />
                <Area type="monotone" dataKey="alerts" stroke="#ef4444" fill="url(#alertGrad)" strokeWidth={2} name="Alertas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
