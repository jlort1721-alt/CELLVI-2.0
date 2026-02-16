import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer, Droplets, AlertTriangle, CheckCircle, XCircle, TrendingUp,
  Download, FileCheck, ShieldCheck, Activity, MapPin, Gauge, Search, Filter, RefreshCw,
  Bell, BellOff, Clock, Battery, Signal, Truck, Package, User,
  ArrowUpDown, Eye, Wifi, WifiOff, DoorOpen, Zap, Award, BarChart3, Timer,
  CircleDot, ShieldAlert, ClipboardCheck, ArrowUp, ArrowDown,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useColdChain, type TabView } from "@/features/operations/hooks/useColdChain";
import type { ColdChainUnit, ColdChainAlert, ComplianceRecord, ColdChainEvent } from "@/lib/coldChainData";

// ── Config ────────────────────────────────────────────────────────────

const statusConfig = {
  normal: { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle, label: "Normal", pulse: "bg-green-500" },
  warning: { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: AlertTriangle, label: "Advertencia", pulse: "bg-yellow-500" },
  critical: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: XCircle, label: "Crítico", pulse: "bg-red-500" },
  offline: { color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20", icon: WifiOff, label: "Sin Conexión", pulse: "bg-gray-500" },
};

const severityConfig = {
  critical: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: XCircle },
  warning: { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: AlertTriangle },
  info: { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", icon: Activity },
};

const classificationConfig: Record<string, { label: string; color: string }> = {
  pharma: { label: "Farmacéutico", color: "text-purple-400" },
  frozen: { label: "Congelado", color: "text-cyan-400" },
  refrigerated: { label: "Refrigerado", color: "text-blue-400" },
  "ambient-controlled": { label: "Ambiente Ctrl.", color: "text-orange-400" },
};

const eventTypeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  departure: { icon: Truck, color: "text-green-500" },
  arrival: { icon: MapPin, color: "text-blue-400" },
  door_open: { icon: DoorOpen, color: "text-yellow-500" },
  door_close: { icon: DoorOpen, color: "text-green-500" },
  temp_deviation: { icon: Thermometer, color: "text-red-500" },
  checkpoint: { icon: CheckCircle, color: "text-gold" },
  refuel: { icon: Zap, color: "text-orange-400" },
  inspection: { icon: ClipboardCheck, color: "text-purple-400" },
  calibration: { icon: Gauge, color: "text-cyan-400" },
};

const complianceStatusConfig = {
  compliant: { label: "Cumple", color: "text-green-500", bg: "bg-green-500/10" },
  non_compliant: { label: "No Cumple", color: "text-red-500", bg: "bg-red-500/10" },
  pending_review: { label: "En Revisión", color: "text-yellow-500", bg: "bg-yellow-500/10" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

// ── Sub-components ────────────────────────────────────────────────────

const KPICard = React.memo(({ icon: Icon, label, value, subValue, color, trend }: {
  icon: React.ElementType; label: string; value: string | number; subValue?: string; color: string; trend?: "up" | "down" | "neutral";
}) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="rounded-2xl p-4 border bg-sidebar/40 backdrop-blur-xl border-white/5 group transition-all duration-300 shadow-xl hover:shadow-2xl"
  >
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-xl ${color.replace("text-", "bg-").replace("500", "500/10").replace("400", "400/10").replace("gold", "gold/10")}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-0.5 text-[9px] font-bold ${trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-sidebar-foreground/30"}`}>
          {trend === "up" ? <ArrowUp className="w-2.5 h-2.5" /> : trend === "down" ? <ArrowDown className="w-2.5 h-2.5" /> : null}
        </div>
      )}
    </div>
    <div className={`text-2xl font-bold font-heading ${color} tracking-tighter leading-none`}>{value}</div>
    <div className="text-[9px] text-sidebar-foreground/30 uppercase tracking-widest font-bold mt-1.5">{label}</div>
    {subValue && <div className="text-[9px] text-sidebar-foreground/20 mt-0.5">{subValue}</div>}
  </motion.div>
));
KPICard.displayName = "KPICard";

const UnitCard = React.memo(({ unit, isSelected, onClick }: {
  unit: ColdChainUnit; isSelected: boolean; onClick: () => void;
}) => {
  const cfg = statusConfig[unit.status];
  const classCfg = classificationConfig[unit.cargoClassification];

  return (
    <motion.button
      layout
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${isSelected
        ? "border-gold/50 bg-gold/5 shadow-lg shadow-gold/5"
        : "border-white/5 bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.02]"
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-sidebar-foreground text-sm tracking-tight">{unit.vehiclePlate}</span>
          <span className={`text-[8px] font-bold ${classCfg?.color ?? "text-gray-400"} bg-white/5 px-1.5 py-0.5 rounded`}>{classCfg?.label ?? unit.cargoClassification}</span>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold ${cfg.bg} ${cfg.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${cfg.pulse} ${unit.status !== "offline" ? "animate-pulse" : ""}`} />
          {cfg.label}
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-1.5 text-[10px] text-sidebar-foreground/40 mb-3">
        <MapPin className="w-3 h-3 shrink-0" />
        <span className="truncate">{unit.origin} → {unit.destination}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-sidebar-foreground/5 rounded-full mb-3 overflow-hidden">
        <motion.div
          className="h-full bg-gold/60 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${unit.progressPercent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {/* Metrics */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className={`text-base font-bold font-heading tracking-tighter ${cfg.color}`}>{unit.currentTemp}°C</span>
            <span className="text-[7px] text-sidebar-foreground/25 uppercase font-bold tracking-widest">TEMP</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold font-heading tracking-tighter text-cyan-400">{unit.humidity}%</span>
            <span className="text-[7px] text-sidebar-foreground/25 uppercase font-bold tracking-widest">HUM</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold font-heading tracking-tighter text-sidebar-foreground/60">{unit.progressPercent}%</span>
            <span className="text-[7px] text-sidebar-foreground/25 uppercase font-bold tracking-widest">RUTA</span>
          </div>
        </div>
        {/* Battery & compliance mini */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <Battery className={`w-3 h-3 ${unit.sensorBattery > 50 ? "text-green-500" : unit.sensorBattery > 25 ? "text-yellow-500" : "text-red-500"}`} />
            <span className="text-[8px] text-sidebar-foreground/30 font-bold">{unit.sensorBattery}%</span>
          </div>
          <div className={`text-[8px] font-bold ${unit.complianceScore >= 95 ? "text-green-500" : unit.complianceScore >= 80 ? "text-yellow-500" : "text-red-500"}`}>
            {unit.complianceScore}%
          </div>
        </div>
      </div>
    </motion.button>
  );
});
UnitCard.displayName = "UnitCard";

const AlertRow = React.memo(({ alert, onAcknowledge }: {
  alert: ColdChainAlert; onAcknowledge: (id: string) => void;
}) => {
  const cfg = severityConfig[alert.severity];
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`flex items-start gap-3 p-3 rounded-xl border ${alert.acknowledged ? "border-white/5 bg-white/[0.01] opacity-60" : `${cfg.border} ${cfg.bg}`} transition-all`}
    >
      <div className={`p-1.5 rounded-lg ${cfg.bg} shrink-0 mt-0.5`}>
        <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-sidebar-foreground/60">{alert.vehiclePlate}</span>
          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
            {alert.severity}
          </span>
          <span className="text-[8px] text-sidebar-foreground/30 uppercase">{alert.type.replace(/_/g, " ")}</span>
        </div>
        <p className="text-[10px] text-sidebar-foreground/50 leading-relaxed">{alert.message}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <Clock className="w-2.5 h-2.5 text-sidebar-foreground/20" />
          <span className="text-[8px] text-sidebar-foreground/25">
            {new Date(alert.timestamp).toLocaleString("es-CO", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
          </span>
          {alert.value !== undefined && alert.threshold !== undefined && (
            <span className="text-[8px] text-sidebar-foreground/25">
              Valor: {alert.value} / Umbral: {alert.threshold}
            </span>
          )}
        </div>
      </div>
      {!alert.acknowledged && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAcknowledge(alert.id)}
          className="shrink-0 h-7 px-2 text-[9px] text-green-500 hover:bg-green-500/10 hover:text-green-400"
        >
          <CheckCircle className="w-3 h-3 mr-1" /> ACK
        </Button>
      )}
    </motion.div>
  );
});
AlertRow.displayName = "AlertRow";

const EventTimelineItem = React.memo(({ event, isLast }: { event: ColdChainEvent; isLast: boolean }) => {
  const cfg = eventTypeConfig[event.type] ?? { icon: CircleDot, color: "text-sidebar-foreground/30" };
  const Icon = cfg.icon;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`p-1.5 rounded-lg bg-white/5 border border-white/5`}>
          <Icon className={`w-3 h-3 ${cfg.color}`} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-white/5 mt-1" />}
      </div>
      <div className="pb-4 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-sidebar-foreground/60 capitalize">{event.type.replace(/_/g, " ")}</span>
          <span className="text-[8px] text-sidebar-foreground/25">
            {new Date(event.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <p className="text-[9px] text-sidebar-foreground/40 mt-0.5 leading-relaxed">{event.description}</p>
      </div>
    </div>
  );
});
EventTimelineItem.displayName = "EventTimelineItem";

const ComplianceRow = React.memo(({ record }: { record: ComplianceRecord }) => {
  const statusCfg = complianceStatusConfig[record.status];

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
      <div className={`p-2 rounded-lg ${statusCfg.bg}`}>
        <ShieldCheck className={`w-4 h-4 ${statusCfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold text-sidebar-foreground">{record.standard}</span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</span>
        </div>
        <div className="flex items-center gap-3 text-[8px] text-sidebar-foreground/30">
          <span>Cert: {record.certNumber}</span>
          <span>Desv: {record.deviations}</span>
          <span>Vence: {new Date(record.expiresAt).toLocaleDateString("es-CO")}</span>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-lg font-bold font-heading tracking-tighter ${record.score >= 90 ? "text-green-500" : record.score >= 70 ? "text-yellow-500" : "text-red-500"}`}>
          {record.score}%
        </div>
        <div className="text-[7px] text-sidebar-foreground/20 uppercase font-bold tracking-widest">SCORE</div>
      </div>
    </div>
  );
});
ComplianceRow.displayName = "ComplianceRow";

// ── Main Component ────────────────────────────────────────────────────

const DashboardColdChain = () => {
  const {
    selectedUnit, activeTab, filters, sortField, sortDir, alerts, isLiveMode, lastSync,
    stats, filteredUnits, chartData, unitAlerts, unitEvents, unitCompliance,
    alertCounts, complianceSummary, allUnits, allComplianceRecords,
    setSelectedUnit, setActiveTab, acknowledgeAlert, acknowledgeAllAlerts,
    updateSearch, updateStatusFilter, updateClassificationFilter, toggleSort,
    setIsLiveMode, refreshData,
  } = useColdChain();

  // Chart data for analytics: compliance by standard
  const complianceByStandard = useMemo(() => {
    const standards = ["GDP", "HACCP", "WHO-PQS", "INVIMA", "RNDC"] as const;
    return standards.map(std => {
      const records = allComplianceRecords.filter(r => r.standard === std);
      const avg = records.length > 0 ? records.reduce((s, r) => s + r.score, 0) / records.length : 0;
      return { standard: std, score: parseFloat(avg.toFixed(1)), count: records.length };
    }).filter(s => s.count > 0);
  }, [allComplianceRecords]);

  // Pie chart data for status distribution
  const statusDistribution = useMemo(() => [
    { name: "Normal", value: stats.normal, fill: "#22c55e" },
    { name: "Advertencia", value: stats.warning, fill: "#eab308" },
    { name: "Crítico", value: stats.critical, fill: "#ef4444" },
    ...(stats.offline > 0 ? [{ name: "Sin Conexión", value: stats.offline, fill: "#6b7280" }] : []),
  ], [stats]);

  // Deviations per unit for analytics
  const deviationsPerUnit = useMemo(() =>
    filteredUnits.map(u => ({
      plate: u.vehiclePlate,
      deviations: u.totalDeviations24h,
      compliance: u.complianceScore,
    })),
  [filteredUnits]);

  // Pre-sorted alerts for Alerts tab (avoids re-sorting on every render)
  const sortedAlerts = useMemo(() =>
    [...alerts].sort((a, b) => {
      if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1;
      const sev = { critical: 0, warning: 1, info: 2 };
      if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }),
  [alerts]);

  if (!selectedUnit) {
    return (
      <div className="flex items-center justify-center h-64 text-sidebar-foreground/50 text-sm">
        No hay unidades de cadena de frío disponibles.
      </div>
    );
  }

  const selectedCfg = statusConfig[selectedUnit.status];

  return (
    <motion.div className="space-y-5" initial="hidden" animate="visible" variants={containerVariants}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-sidebar-foreground text-2xl flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/10">
              <Thermometer className="w-6 h-6 text-blue-400" />
            </div>
            Cold Chain Command Center
          </h2>
          <p className="text-[11px] text-sidebar-foreground/40 mt-1 flex items-center gap-2">
            Monitoreo térmico empresarial — Pharma, Food & Logistics
            <span className="flex items-center gap-1 text-[9px] font-bold">
              {isLiveMode ? (
                <span className="flex items-center gap-1 text-green-500"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE</span>
              ) : (
                <span className="flex items-center gap-1 text-sidebar-foreground/30"><WifiOff className="w-3 h-3" /> OFFLINE</span>
              )}
            </span>
            <span className="text-[8px] text-sidebar-foreground/20">
              Sync: {lastSync.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm" variant="ghost"
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={`h-8 px-3 text-[10px] rounded-xl ${isLiveMode ? "text-green-500 bg-green-500/5 hover:bg-green-500/10" : "text-sidebar-foreground/40 hover:bg-white/5"}`}
          >
            {isLiveMode ? <Wifi className="w-3 h-3 mr-1.5" /> : <WifiOff className="w-3 h-3 mr-1.5" />}
            {isLiveMode ? "Live" : "Paused"}
          </Button>
          <Button size="sm" variant="ghost" onClick={refreshData} className="h-8 px-3 text-[10px] text-sidebar-foreground/40 hover:bg-white/5 rounded-xl">
            <RefreshCw className="w-3 h-3 mr-1.5" /> Sync
          </Button>
          <Button size="sm" variant="outline" className="text-[10px] h-8 bg-gold/5 border-gold/20 text-gold hover:bg-gold/10 rounded-xl px-3">
            <Download className="w-3 h-3 mr-1.5" /> Exportar RNDC
          </Button>
          <Button size="sm" variant="outline" className="text-[10px] h-8 bg-purple-500/5 border-purple-500/20 text-purple-400 hover:bg-purple-500/10 rounded-xl px-3">
            <FileCheck className="w-3 h-3 mr-1.5" /> Informe GDP
          </Button>
        </div>
      </motion.div>

      {/* ── KPI Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        <KPICard icon={Truck} label="Unidades Activas" value={stats.total} color="text-blue-400" trend="up" />
        <KPICard icon={CheckCircle} label="En Rango Normal" value={stats.normal} color="text-green-500" trend="up" />
        <KPICard icon={AlertTriangle} label="En Advertencia" value={stats.warning} color="text-yellow-500" trend={stats.warning > 0 ? "down" : "neutral"} />
        <KPICard icon={XCircle} label="Estado Crítico" value={stats.critical} color="text-red-500" trend={stats.critical > 0 ? "down" : "neutral"} />
        <KPICard icon={ShieldCheck} label="SLA Cumplimiento" value={`${stats.slaFulfillment}%`} color="text-gold" trend="up" subValue={`${stats.pharmaUnits} pharma`} />
        <KPICard icon={Award} label="Compliance Avg" value={`${stats.avgCompliance}%`} color="text-purple-400" trend={stats.avgCompliance >= 90 ? "up" : "down"} />
        <KPICard icon={Bell} label="Alertas Activas" value={alertCounts.total} color="text-orange-400" subValue={`${alertCounts.critical} críticas`} />
        <KPICard icon={Battery} label="Batería Prom." value={`${stats.avgBattery}%`} color="text-cyan-400" trend={stats.avgBattery > 70 ? "up" : "down"} />
      </div>

      {/* ── Tabs Navigation ────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabView)} className="w-full">
        <motion.div variants={itemVariants}>
          <TabsList className="bg-sidebar/60 border border-white/5 p-1 rounded-xl h-auto gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold rounded-lg text-[10px] font-bold uppercase tracking-wider px-4 py-2">
              <Eye className="w-3 h-3 mr-1.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider px-4 py-2 relative">
              <Bell className="w-3 h-3 mr-1.5" /> Alertas
              {alertCounts.total > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {alertCounts.total}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400 rounded-lg text-[10px] font-bold uppercase tracking-wider px-4 py-2">
              <ShieldCheck className="w-3 h-3 mr-1.5" /> Compliance
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-wider px-4 py-2">
              <BarChart3 className="w-3 h-3 mr-1.5" /> Analytics
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* ═══════════ OVERVIEW TAB ═══════════ */}
        <TabsContent value="overview" className="mt-5 space-y-5">
          {/* Filters bar */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 p-3 rounded-2xl border border-white/5 bg-sidebar/30">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-foreground/30" />
              <input
                type="text"
                placeholder="Buscar placa, carga, conductor, ruta..."
                aria-label="Buscar unidades de cadena de frío"
                value={filters.search}
                onChange={(e) => updateSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-[11px] text-sidebar-foreground placeholder:text-sidebar-foreground/20 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-sidebar-foreground/30" />
              {(["all", "normal", "warning", "critical"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${filters.status === s
                    ? "bg-gold/10 text-gold border border-gold/20"
                    : "text-sidebar-foreground/30 hover:text-sidebar-foreground/50 hover:bg-white/5 border border-transparent"
                    }`}
                >
                  {s === "all" ? "Todos" : statusConfig[s].label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {(["all", "pharma", "frozen", "refrigerated", "ambient-controlled"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => updateClassificationFilter(c)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all ${filters.classification === c
                    ? "bg-gold/10 text-gold border border-gold/20"
                    : "text-sidebar-foreground/30 hover:text-sidebar-foreground/50 hover:bg-white/5 border border-transparent"
                    }`}
                >
                  {c === "all" ? "Tipo: Todos" : classificationConfig[c]?.label ?? c}
                </button>
              ))}
            </div>
            <button onClick={() => toggleSort("status")} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold text-sidebar-foreground/30 hover:text-sidebar-foreground/50 hover:bg-white/5 transition-all">
              <ArrowUpDown className="w-3 h-3" /> {sortField} {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* ── Unit List ──────────────────────────────── */}
            <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-sidebar-foreground/40 text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5" /> Flota en Tránsito
                </h3>
                <Badge variant="outline" className="text-[8px] border-white/10 text-sidebar-foreground/30 rounded-full">
                  {filteredUnits.length}/{stats.total}
                </Badge>
              </div>
              <div className="space-y-2.5 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {filteredUnits.map((unit) => (
                    <UnitCard
                      key={unit.id}
                      unit={unit}
                      isSelected={selectedUnit.id === unit.id}
                      onClick={() => setSelectedUnit(unit)}
                    />
                  ))}
                </AnimatePresence>
                {filteredUnits.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-sidebar-foreground/20">
                    <Search className="w-8 h-8 mb-3 opacity-30" />
                    <span className="text-[11px]">Sin resultados</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Detail Panel ────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">
              {/* Unit Header */}
              <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 backdrop-blur-xl border-white/5 p-5 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/5 rounded-full -mr-36 -mt-36 blur-3xl opacity-40" />

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${selectedCfg.bg} flex items-center justify-center font-bold text-lg text-sidebar-foreground border ${selectedCfg.border} shadow-lg`}>
                      {selectedUnit.vehiclePlate.substring(0, 3)}
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-sidebar-foreground text-lg tracking-tight flex items-center gap-2">
                        {selectedUnit.vehiclePlate}
                        <span className="text-sidebar-foreground/30">—</span>
                        <span className={classificationConfig[selectedUnit.cargoClassification]?.color ?? ""}>{selectedUnit.cargoType}</span>
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`flex items-center gap-1 text-[9px] font-bold ${selectedCfg.color} ${selectedCfg.bg} px-2 py-0.5 rounded-lg border ${selectedCfg.border}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${selectedCfg.pulse} animate-pulse`} /> {selectedCfg.label.toUpperCase()}
                        </span>
                        <span className="text-[9px] text-sidebar-foreground/30">Sensor: {selectedUnit.sensorId} ({selectedUnit.sensorType})</span>
                        <span className="text-[9px] text-sidebar-foreground/30">Trip: {selectedUnit.tripId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5 min-w-[60px]">
                      <User className="w-3 h-3 text-sidebar-foreground/30 mb-1" />
                      <span className="text-[9px] font-bold text-sidebar-foreground/60">{selectedUnit.driverName.split(" ")[0]}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5 min-w-[60px]">
                      <Timer className="w-3 h-3 text-sidebar-foreground/30 mb-1" />
                      <span className="text-[9px] font-bold text-sidebar-foreground/60">
                        ETA {new Date(selectedUnit.eta).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5 min-w-[60px]">
                      <Package className="w-3 h-3 text-sidebar-foreground/30 mb-1" />
                      <span className="text-[9px] font-bold text-sidebar-foreground/60">{selectedUnit.compartments} comp.</span>
                    </div>
                  </div>
                </div>

                {/* Quick metrics row */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-5 relative z-10">
                  {[
                    { icon: Thermometer, label: "Temp Actual", value: `${selectedUnit.currentTemp}°C`, color: selectedCfg.color },
                    { icon: Droplets, label: "Humedad", value: `${selectedUnit.humidity}%`, color: "text-cyan-400" },
                    { icon: Battery, label: "Batería Sensor", value: `${selectedUnit.sensorBattery}%`, color: selectedUnit.sensorBattery > 50 ? "text-green-500" : "text-yellow-500" },
                    { icon: DoorOpen, label: "Aperturas Puerta", value: `${selectedUnit.doorOpenCount}`, color: selectedUnit.doorOpenCount > 3 ? "text-red-500" : "text-sidebar-foreground/60" },
                    { icon: ShieldAlert, label: "Desviaciones 24h", value: `${selectedUnit.totalDeviations24h}`, color: selectedUnit.totalDeviations24h > 3 ? "text-red-500" : "text-green-500" },
                    { icon: Award, label: "Compliance", value: `${selectedUnit.complianceScore}%`, color: selectedUnit.complianceScore >= 95 ? "text-green-500" : selectedUnit.complianceScore >= 80 ? "text-yellow-500" : "text-red-500" },
                  ].map((m, i) => (
                    <div key={i} className="flex flex-col items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <m.icon className={`w-3.5 h-3.5 ${m.color} mb-1.5`} />
                      <span className={`text-base font-bold font-heading tracking-tighter ${m.color}`}>{m.value}</span>
                      <span className="text-[7px] text-sidebar-foreground/25 uppercase font-bold tracking-widest mt-0.5">{m.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Temperature Chart */}
              <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 backdrop-blur-xl border-white/5 p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" /> Telemetría Térmica — 24h
                    </h4>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-[9px] text-blue-400"><div className="w-2 h-1 bg-blue-400 rounded" /> Temperatura</span>
                      <span className="flex items-center gap-1.5 text-[9px] text-cyan-400/40"><div className="w-2 h-1 bg-cyan-400/40 rounded" /> Humedad</span>
                      <span className="flex items-center gap-1.5 text-[9px] text-red-500"><div className="w-4 h-0 border-t border-dashed border-red-500" /> Lím. Superior</span>
                      <span className="flex items-center gap-1.5 text-[9px] text-blue-500"><div className="w-4 h-0 border-t border-dashed border-blue-500" /> Lím. Inferior</span>
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="text-[9px] text-sidebar-foreground/25 font-bold uppercase tracking-widest">Rango Objetivo</div>
                    <div className="text-sm font-bold text-sidebar-foreground px-3 py-1 bg-white/5 rounded-xl border border-white/5 mt-1">
                      {selectedUnit.targetTempMin}°C — {selectedUnit.targetTempMax}°C
                    </div>
                  </div>
                </div>

                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="ccTempGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ccHumGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} interval={7} axisLine={false} tickLine={false} tickMargin={12} />
                      <YAxis
                        yAxisId="temp"
                        tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                        domain={[selectedUnit.targetTempMin - 5, selectedUnit.targetTempMax + 5]}
                        axisLine={false} tickLine={false} tickMargin={8}
                      />
                      <YAxis yAxisId="hum" orientation="right" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.15)" }} domain={[0, 100]} axisLine={false} tickLine={false} tickMargin={8} />
                      <Tooltip
                        contentStyle={{ background: "rgba(10,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, backdropFilter: "blur(10px)", fontSize: 10 }}
                        itemStyle={{ color: "white" }}
                        labelStyle={{ color: "rgba(255,255,255,0.5)", marginBottom: 4 }}
                      />
                      <ReferenceLine yAxisId="temp" y={selectedUnit.targetTempMax} stroke="#ef4444" strokeDasharray="6 6" strokeWidth={1}
                        label={{ value: `MAX ${selectedUnit.targetTempMax}°C`, fill: "#ef4444", fontSize: 8, fontWeight: "bold", position: "insideTopLeft" }}
                      />
                      <ReferenceLine yAxisId="temp" y={selectedUnit.targetTempMin} stroke="#3b82f6" strokeDasharray="6 6" strokeWidth={1}
                        label={{ value: `MIN ${selectedUnit.targetTempMin}°C`, fill: "#3b82f6", fontSize: 8, fontWeight: "bold", position: "insideBottomLeft" }}
                      />
                      <Area yAxisId="temp" type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={2.5} fill="url(#ccTempGrad)" animationDuration={1500} name="Temperatura (°C)" />
                      <Area yAxisId="hum" type="monotone" dataKey="humidity" stroke="rgba(6,182,212,0.3)" strokeWidth={1} fill="url(#ccHumGrad)" strokeDasharray="3 3" name="Humedad (%)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Bottom row: Events Timeline + Unit Compliance + Unit Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Events Timeline */}
                <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-4 shadow-xl">
                  <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Timeline de Eventos
                  </h4>
                  <div className="space-y-0 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                    {unitEvents.length > 0 ? unitEvents.map((event, i) => (
                      <EventTimelineItem key={event.id} event={event} isLast={i === unitEvents.length - 1} />
                    )) : (
                      <div className="text-[10px] text-sidebar-foreground/20 text-center py-8">Sin eventos registrados</div>
                    )}
                  </div>
                </motion.div>

                {/* Unit Compliance */}
                <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-4 shadow-xl">
                  <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Certificaciones
                  </h4>
                  <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                    {unitCompliance.length > 0 ? unitCompliance.map((record) => (
                      <ComplianceRow key={record.id} record={record} />
                    )) : (
                      <div className="text-[10px] text-sidebar-foreground/20 text-center py-8">Sin certificaciones</div>
                    )}
                    {/* Compliance standards badges */}
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5 mt-3">
                      {selectedUnit.complianceStandards.map(std => (
                        <span key={std} className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-[8px] font-bold border border-purple-500/10">
                          {std}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Unit Alerts */}
                <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-4 shadow-xl">
                  <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5" /> Alertas del Vehículo
                    {unitAlerts.filter(a => !a.acknowledged).length > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-bold rounded-full">
                        {unitAlerts.filter(a => !a.acknowledged).length}
                      </span>
                    )}
                  </h4>
                  <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                      {unitAlerts.length > 0 ? unitAlerts.map((alert) => (
                        <AlertRow key={alert.id} alert={alert} onAcknowledge={acknowledgeAlert} />
                      )) : (
                        <div className="text-[10px] text-sidebar-foreground/20 text-center py-8 flex flex-col items-center gap-2">
                          <CheckCircle className="w-6 h-6 text-green-500/30" />
                          Sin alertas
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══════════ ALERTS TAB ═══════════ */}
        <TabsContent value="alerts" className="mt-5 space-y-5">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl p-4 border bg-red-500/5 border-red-500/10">
                <div className="text-2xl font-bold font-heading text-red-500 tracking-tighter">{alertCounts.critical}</div>
                <div className="text-[9px] text-sidebar-foreground/30 uppercase tracking-widest font-bold">Críticas</div>
              </div>
              <div className="rounded-2xl p-4 border bg-yellow-500/5 border-yellow-500/10">
                <div className="text-2xl font-bold font-heading text-yellow-500 tracking-tighter">{alertCounts.warning}</div>
                <div className="text-[9px] text-sidebar-foreground/30 uppercase tracking-widest font-bold">Advertencias</div>
              </div>
              <div className="rounded-2xl p-4 border bg-blue-400/5 border-blue-400/10">
                <div className="text-2xl font-bold font-heading text-blue-400 tracking-tighter">{alertCounts.info}</div>
                <div className="text-[9px] text-sidebar-foreground/30 uppercase tracking-widest font-bold">Informativas</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={acknowledgeAllAlerts} className="text-[10px] h-8 rounded-xl text-green-500 border-green-500/20 hover:bg-green-500/10">
                <BellOff className="w-3 h-3 mr-1.5" /> Confirmar Todas
              </Button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-5 shadow-2xl">
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {sortedAlerts.map((alert) => (
                  <AlertRow key={alert.id} alert={alert} onAcknowledge={acknowledgeAlert} />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </TabsContent>

        {/* ═══════════ COMPLIANCE TAB ═══════════ */}
        <TabsContent value="compliance" className="mt-5 space-y-5">
          {/* Summary cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl p-4 border bg-green-500/5 border-green-500/10">
              <div className="text-2xl font-bold font-heading text-green-500 tracking-tighter">{complianceSummary.compliant}</div>
              <div className="text-[9px] text-sidebar-foreground/30 uppercase tracking-widest font-bold">Cumplen</div>
            </div>
            <div className="rounded-2xl p-4 border bg-red-500/5 border-red-500/10">
              <div className="text-2xl font-bold font-heading text-red-500 tracking-tighter">{complianceSummary.nonCompliant}</div>
              <div className="text-[9px] text-sidebar-foreground/30 uppercase tracking-widest font-bold">No Cumplen</div>
            </div>
            <div className="rounded-2xl p-4 border bg-yellow-500/5 border-yellow-500/10">
              <div className="text-2xl font-bold font-heading text-yellow-500 tracking-tighter">{complianceSummary.pending}</div>
              <div className="text-[9px] text-sidebar-foreground/30 uppercase tracking-widest font-bold">En Revisión</div>
            </div>
            <div className="rounded-2xl p-4 border bg-purple-500/5 border-purple-500/10">
              <div className="text-2xl font-bold font-heading text-purple-400 tracking-tighter">{complianceSummary.rate}%</div>
              <div className="text-[9px] text-sidebar-foreground/30 uppercase tracking-widest font-bold">Tasa Cumplimiento</div>
            </div>
          </motion.div>

          {/* Compliance records table */}
          <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-5 shadow-2xl">
            <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-3.5 h-3.5" /> Registros de Cumplimiento Global
            </h4>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {allComplianceRecords.map((record) => {
                const unit = allUnits.find(u => u.id === record.unitId) ?? allUnits[0];
                const statusCfg = complianceStatusConfig[record.status];
                return (
                  <div key={record.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                    <div className={`p-2 rounded-lg ${statusCfg.bg} shrink-0`}>
                      <ShieldCheck className={`w-4 h-4 ${statusCfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-sidebar-foreground">{unit?.vehiclePlate}</span>
                        <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{record.standard}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[8px] text-sidebar-foreground/30">
                        <span>Trip: {record.tripId}</span>
                        <span>Cert: {record.certNumber}</span>
                        <span>Auditoría: {new Date(record.auditDate).toLocaleDateString("es-CO")}</span>
                        <span>Desviaciones: {record.deviations}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-lg font-bold font-heading tracking-tighter ${record.score >= 90 ? "text-green-500" : record.score >= 70 ? "text-yellow-500" : "text-red-500"}`}>
                        {record.score}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </TabsContent>

        {/* ═══════════ ANALYTICS TAB ═══════════ */}
        <TabsContent value="analytics" className="mt-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Status Distribution Pie */}
            <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-5 shadow-2xl">
              <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5" /> Distribución de Estado de Flota
              </h4>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} animationDuration={1200}>
                      {statusDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "rgba(10,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 10 }}
                      itemStyle={{ color: "white" }}
                    />
                    <Legend
                      formatter={(value) => <span className="text-[10px] text-sidebar-foreground/50">{value}</span>}
                      iconType="circle"
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Compliance by Standard */}
            <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-5 shadow-2xl">
              <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Award className="w-3.5 h-3.5" /> Compliance Score por Estándar
              </h4>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complianceByStandard} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="standard" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)", fontWeight: "bold" }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip
                      contentStyle={{ background: "rgba(10,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 10 }}
                      itemStyle={{ color: "white" }}
                      formatter={(value: number) => [`${value}%`, "Score"]}
                    />
                    <Bar dataKey="score" fill="#a855f7" radius={[0, 6, 6, 0]} animationDuration={1200} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Deviations per Unit */}
            <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-5 shadow-2xl">
              <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5" /> Desviaciones por Vehículo (24h)
              </h4>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deviationsPerUnit}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="plate" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "rgba(10,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 10 }}
                      itemStyle={{ color: "white" }}
                    />
                    <Bar dataKey="deviations" name="Desviaciones" fill="#ef4444" radius={[6, 6, 0, 0]} animationDuration={1200} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Compliance Score per Unit */}
            <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-5 shadow-2xl">
              <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> Score de Cumplimiento por Vehículo
              </h4>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deviationsPerUnit}>
                    <defs>
                      <linearGradient id="ccCompGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="plate" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "rgba(10,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 10 }}
                      itemStyle={{ color: "white" }}
                      formatter={(value: number) => [`${value}%`, "Compliance"]}
                    />
                    <ReferenceLine y={90} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1}
                      label={{ value: "META 90%", fill: "#22c55e", fontSize: 8, fontWeight: "bold", position: "insideTopLeft" }}
                    />
                    <Bar dataKey="compliance" name="Compliance" fill="url(#ccCompGrad)" radius={[6, 6, 0, 0]} animationDuration={1200} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Sensor health overview */}
          <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-5 shadow-2xl">
            <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Signal className="w-3.5 h-3.5" /> Salud de Sensores — Vista General
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {filteredUnits.map(unit => {
                const unitCfg = statusConfig[unit.status];
                return (
                  <button
                    key={unit.id}
                    onClick={() => { setSelectedUnit(unit); setActiveTab("overview"); }}
                    className="flex flex-col items-center p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-xl ${unitCfg.bg} flex items-center justify-center mb-2 border ${unitCfg.border} group-hover:scale-110 transition-transform`}>
                      <span className="text-[10px] font-bold text-sidebar-foreground">{unit.vehiclePlate.substring(0, 3)}</span>
                    </div>
                    <span className="text-[8px] font-bold text-sidebar-foreground/50">{unit.vehiclePlate}</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-0.5">
                        <Battery className={`w-2.5 h-2.5 ${unit.sensorBattery > 50 ? "text-green-500" : unit.sensorBattery > 25 ? "text-yellow-500" : "text-red-500"}`} />
                        <span className="text-[7px] text-sidebar-foreground/30">{unit.sensorBattery}%</span>
                      </div>
                    </div>
                    <span className={`text-[7px] font-bold mt-1 ${unitCfg.color}`}>{unit.sensorType}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default DashboardColdChain;
