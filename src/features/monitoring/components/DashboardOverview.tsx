import { useState, useEffect, useCallback } from "react";
import { Activity, Search, Route } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDashboardStats, useFleetStatus, useRecentAlerts } from "@/features/dashboard/hooks/useRealtimeDashboard";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { vehicles, alerts, platformStats, generateTelemetryData, formatNumber } from "@/lib/demoData";
import { useDeferredSearch } from "@/hooks/useDeferredSearch";
import { KPISection } from "./KPISection";
import { AlertsTimeline } from "./AlertsTimeline";
import { FleetStatusTable } from "./FleetStatusTable";

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

  // Use demo data as fallback
  const demoVehicles = vehicles || [];
  const demoAlerts = alerts?.map((alert, i) => ({
    id: alert.id,
    msg: alert.message,
    time: new Date(alert.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    severity: alert.severity === 'high' ? 'critical' : alert.severity
  })) || [];

  // Realistic telemetry data
  const telemetryData = generateTelemetryData(30);
  const last7Days = telemetryData.slice(-7);

  // Safe defaults with demo data fallback
  const vehicleCount = stats?.vehicles || platformStats.totalVehicles;
  const activeVehicles = vehicles?.filter(v => v.status === 'activo') || demoVehicles.filter(v => v.status === 'activo');
  const activeCount = activeVehicles.length || platformStats.activeVehicles;
  const alertCount = stats?.criticalAlerts || alerts?.filter(a => a.severity === 'high').length || 0;
  const efficiency = stats?.efficiency ? (stats.efficiency * 100) : platformStats.fuelSavings;
  const kmToday = telemetryData[telemetryData.length - 1]?.distanceKm || 8247;

  // Filter logic - use demo vehicles as fallback, use deferredQuery for non-blocking filtering
  const allVehicles = vehicles?.length > 0 ? vehicles : demoVehicles;
  const filteredVehicles = deferredQuery
    ? allVehicles?.filter((v: any) =>
      v.plate.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      (v.driver && v.driver.toLowerCase().includes(deferredQuery.toLowerCase()))
    )
    : allVehicles;

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
      <KPISection
        vehicleCount={vehicleCount}
        activeCount={activeCount}
        alertCount={alertCount}
        inspectionsToday={stats?.inspectionsToday || 0}
        failedInspections={stats?.failedInspections || 0}
        kmToday={kmToday}
        kmThisMonth={platformStats.kmTraveledThisMonth}
        efficiency={efficiency}
        last7DaysKm={last7Days.map(d => d.distanceKm / 100)}
        loadingStats={loadingStats}
        loadingVehicles={loadingVehicles}
      />

      {/* ── Main Content Grid ─────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Realtime Alerts Timeline */}
        <AlertsTimeline 
          alerts={alerts?.length > 0 ? alerts : demoAlerts}
          loadingAlerts={loadingAlerts}
        />

        {/* Fleet Status List */}
        <FleetStatusTable
          vehicles={filteredVehicles}
          activeCount={activeCount}
          loadingVehicles={loadingVehicles}
        />
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
