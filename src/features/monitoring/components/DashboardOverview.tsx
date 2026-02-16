import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Activity, Search, Route, Brain, Cpu, Bell, Zap, CheckCircle, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDashboardStats, useFleetStatus, useRecentAlerts } from "@/features/dashboard/hooks/useRealtimeDashboard";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { vehicles, alerts, platformStats, generateTelemetryData, formatNumber } from "@/lib/demoData";
import { useDeferredSearch } from "@/hooks/useDeferredSearch";
import { useNotificationStore } from "@/stores/notificationStore";
import { useUIStore } from "@/stores/uiStore";
import { KPISection } from "./KPISection";
import { AlertsTimeline } from "./AlertsTimeline";
import { FleetStatusTable } from "./FleetStatusTable";
import NotificationBadge from "./NotificationBadge";

/* ── Shortcuts ────────────────────────────────────────── */
const shortcuts = [
  { key: "G", labelKey: "dashboardUI.shortcutOverview" },
  { key: "M", labelKey: "dashboardUI.shortcutMap" },
  { key: "A", labelKey: "dashboardUI.shortcutAlerts" },
  { key: "R", labelKey: "dashboardUI.shortcutReports" },
  { key: "?", labelKey: "dashboardUI.shortcutHelp" },
];

/* ── AI Agent Mini Status ─────────────────────────────── */
const AIAgentMiniPanel = memo(() => {
  const { t } = useTranslation();
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  return (
    <button
      type="button"
      onClick={() => setActiveModule("ai-command-center")}
      className="rounded-xl p-4 border bg-sidebar border-sidebar-border hover:border-purple-500/30 transition-all group cursor-pointer text-left w-full"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-purple-500/10">
          <Brain className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-sidebar-foreground flex items-center gap-2">
            {t("dashboardUI.aiAgentTitle")}
            <span className="flex items-center gap-1 text-[8px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> {t("dashboardUI.aiActive")}
            </span>
          </div>
          <div className="text-[9px] text-sidebar-foreground/30 mt-0.5">{t("dashboardUI.aiDevicesMonitored", { count: "10,247" })}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center p-2 rounded-lg bg-sidebar-foreground/[0.02]">
          <Cpu className="w-3 h-3 text-blue-400 mb-1" />
          <span className="text-[10px] font-bold text-sidebar-foreground">~450</span>
          <span className="text-[7px] text-sidebar-foreground/25 uppercase">{t("dashboardUI.aiEventsPerSec")}</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-lg bg-sidebar-foreground/[0.02]">
          <CheckCircle className="w-3 h-3 text-green-500 mb-1" />
          <span className="text-[10px] font-bold text-sidebar-foreground">92%</span>
          <span className="text-[7px] text-sidebar-foreground/25 uppercase">{t("dashboardUI.aiAutoResolution")}</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-lg bg-sidebar-foreground/[0.02]">
          <Zap className="w-3 h-3 text-gold mb-1" />
          <span className="text-[10px] font-bold text-sidebar-foreground">25ms</span>
          <span className="text-[7px] text-sidebar-foreground/25 uppercase">{t("dashboardUI.aiResponse")}</span>
        </div>
      </div>
      <div className="mt-2 text-[8px] text-purple-400 font-bold uppercase tracking-widest group-hover:text-purple-300 transition-colors text-center">
        {t("dashboardUI.aiOpenCommandCenter")}
      </div>
    </button>
  );
});
AIAgentMiniPanel.displayName = "AIAgentMiniPanel";

/* ── Notification Summary Widget ─────────────────────── */
const NotificationSummaryWidget = memo(() => {
  const { t } = useTranslation();
  const { notifications, unreadCount } = useNotificationStore();
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  const counts = useMemo(() => ({
    critical: notifications.filter((n) => n.status === "new" && n.severity === "critical").length,
    high: notifications.filter((n) => n.status === "new" && n.severity === "high").length,
    total: unreadCount,
  }), [notifications, unreadCount]);

  return (
    <button
      type="button"
      onClick={() => setActiveModule("alerts")}
      className="rounded-xl p-4 border bg-sidebar border-sidebar-border hover:border-gold/30 transition-all text-left w-full"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-gold/10">
          <Bell className="w-4 h-4 text-gold" />
        </div>
        <div>
          <div className="text-xs font-bold text-sidebar-foreground">{t("dashboardUI.notifications")}</div>
          <div className="text-[9px] text-sidebar-foreground/30">{t("dashboardUI.unreadCount", { count: counts.total })}</div>
        </div>
      </div>
      {counts.critical > 0 && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10 mb-2">
          <AlertTriangle className="w-3 h-3 text-red-500" />
          <span className="text-[10px] font-bold text-red-500">{t("dashboardUI.criticalAlerts", { count: counts.critical })}</span>
        </div>
      )}
      {counts.high > 0 && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-orange-500/5 border border-orange-500/10">
          <AlertTriangle className="w-3 h-3 text-orange-500" />
          <span className="text-[10px] font-bold text-orange-500">{t("dashboardUI.highAlerts", { count: counts.high })}</span>
        </div>
      )}
      {counts.total === 0 && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-green-500/5 border border-green-500/10">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span className="text-[10px] font-bold text-green-500">{t("dashboardUI.allClear")}</span>
        </div>
      )}
    </button>
  );
});
NotificationSummaryWidget.displayName = "NotificationSummaryWidget";

/* ── Main Dashboard ───────────────────────────────────── */
const DashboardOverview = memo(() => {
  const { t } = useTranslation();

  // Realtime Data Hooks
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: dbVehicles, isLoading: loadingVehicles } = useFleetStatus();
  const { data: dbAlerts, isLoading: loadingAlerts } = useRecentAlerts();

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

  // Use imported demo data as fallback when Supabase returns no data
  const displayVehicles = dbVehicles && dbVehicles.length > 0 ? dbVehicles : vehicles;
  const displayAlerts = dbAlerts?.length > 0
    ? dbAlerts
    : alerts.map((alert) => ({
        id: alert.id,
        msg: alert.message,
        time: new Date(alert.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        severity: alert.severity === 'high' ? 'critical' : alert.severity
      }));

  // Memoize telemetry data
  const telemetryData = useMemo(() => generateTelemetryData(30), []);
  const last7Days = useMemo(() => telemetryData.slice(-7), [telemetryData]);

  // Safe defaults with demo data fallback
  const vehicleCount = stats?.vehicles || platformStats.totalVehicles;
  const activeVehicles = displayVehicles.filter((v: any) => v.status === 'activo');
  const activeCount = activeVehicles.length > 0 ? activeVehicles.length : platformStats.activeVehicles;
  const alertCount = stats?.criticalAlerts ?? displayAlerts.filter((a: any) => a.severity === 'high' || a.severity === 'critical').length;
  const efficiency = stats?.efficiency ? (stats.efficiency * 100) : platformStats.fuelSavings;
  const kmToday = telemetryData[telemetryData.length - 1]?.distanceKm || 8247;

  // Filter logic
  const filteredVehicles = deferredQuery
    ? displayVehicles.filter((v: any) =>
      v.plate.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      (v.driver && v.driver.toLowerCase().includes(deferredQuery.toLowerCase()))
    )
    : displayVehicles;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Header ────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-sidebar-foreground text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold" /> {t("dashboardUI.commandCenter")}
          </h2>
          <p className="text-[10px] text-sidebar-foreground/40">
            {t("dashboardUI.realtimeOps")} • {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <NotificationBadge />
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-sidebar-foreground/30" />
            <input
              type="text"
              placeholder={t("dashboardUI.searchVehicle")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-sidebar-accent border border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30 w-48 focus:w-64 transition-all focus:border-gold/40 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowShortcuts((v) => !v)}
            className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-sidebar-foreground/40 bg-sidebar-accent border border-sidebar-border hover:border-sidebar-foreground/20"
          >
            <span className="font-mono">?</span> {t("dashboardUI.shortcuts")}
          </button>
        </div>
      </div>

      {/* ── Shortcuts Modal ───────────────────────────── */}
      {showShortcuts && (
        <div className="rounded-xl p-4 border bg-sidebar-accent border-gold/20 animate-in fade-in mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-sidebar-foreground text-sm">{t("dashboardUI.keyboardShortcuts")}</h3>
            <button type="button" onClick={() => setShowShortcuts(false)} className="text-sidebar-foreground/40 text-xs">{t("dashboardUI.close")}</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {shortcuts.map((s) => (
              <div key={s.key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar border border-sidebar-border">
                <kbd className="px-1.5 py-0.5 rounded bg-sidebar-foreground/10 text-sidebar-foreground text-[10px] font-mono font-bold">{s.key}</kbd>
                <span className="text-[10px] text-sidebar-foreground/60">{t(s.labelKey)}</span>
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
          alerts={displayAlerts}
          loadingAlerts={loadingAlerts}
        />

        {/* Fleet Status List */}
        <FleetStatusTable
          vehicles={filteredVehicles}
          activeCount={activeCount}
          loadingVehicles={loadingVehicles}
        />

        {/* AI Agent + Notifications Widget Column */}
        <div className="space-y-4">
          <AIAgentMiniPanel />
          <NotificationSummaryWidget />
        </div>
      </div>

      {/* ── Operations Charts Grid ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Distance Chart */}
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <h3 className="font-heading font-bold text-sidebar-foreground text-sm mb-4 flex items-center gap-2">
            <Route className="w-4 h-4 text-gold" />
            {t("dashboardUI.distanceChart")}
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
                  formatter={(value: any) => [`${formatNumber(value)} km`, t("dashboardUI.distance")]}
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
            {t("dashboardUI.fleetActivity")}
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
                <Area type="monotone" dataKey="activeVehicles" stroke="#22c55e" fill="url(#activeGrad)" strokeWidth={2} name={t("dashboardUI.activeVehicles")} />
                <Area type="monotone" dataKey="alerts" stroke="#ef4444" fill="url(#alertGrad)" strokeWidth={2} name={t("dashboardUI.alertsLabel")} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
});
DashboardOverview.displayName = "DashboardOverview";

export default DashboardOverview;
