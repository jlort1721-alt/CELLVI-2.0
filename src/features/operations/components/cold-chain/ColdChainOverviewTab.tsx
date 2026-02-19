import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer, Droplets, AlertTriangle, CheckCircle, Search, Filter, Bell,
  Clock, Battery, Truck, Package, User,
  ArrowUpDown, DoorOpen, Award, Timer,
  ShieldAlert, ShieldCheck, Activity, MapPin,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import type { ColdChainUnit, ColdChainAlert, ComplianceRecord, ColdChainEvent } from "@/lib/coldChainData";
import type { SortField, SortDirection } from "@/features/operations/hooks/useColdChain";
import type { UnitStatus, CargoClassification } from "@/lib/coldChainData";
import { statusConfig, classificationConfig, itemVariants } from "./coldChainConfig";
import { UnitCard, AlertRow, EventTimelineItem, ComplianceRow } from "./ColdChainSubComponents";

// ── Props ─────────────────────────────────────────────────────────────

interface ColdChainOverviewTabProps {
  filteredUnits: ColdChainUnit[];
  selectedUnit: ColdChainUnit;
  selectedCfg: typeof statusConfig[keyof typeof statusConfig];
  filters: { search: string; status: UnitStatus | "all"; classification: CargoClassification | "all" };
  sortField: SortField;
  sortDir: SortDirection;
  stats: { total: number; normal: number; warning: number; critical: number; offline: number; slaFulfillment: number; avgCompliance: number; pharmaUnits: number; avgBattery: number };
  chartData: Array<{ time: string; temp: number; humidity: number; doorOpen: number | null; battery: number; signal: number }>;
  unitAlerts: ColdChainAlert[];
  unitEvents: ColdChainEvent[];
  unitCompliance: ComplianceRecord[];
  setSelectedUnit: (unit: ColdChainUnit) => void;
  updateSearch: (search: string) => void;
  updateStatusFilter: (status: UnitStatus | "all") => void;
  updateClassificationFilter: (classification: CargoClassification | "all") => void;
  toggleSort: (field: SortField) => void;
  acknowledgeAlert: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────

const ColdChainOverviewTab = React.memo<ColdChainOverviewTabProps>(({
  filteredUnits,
  selectedUnit,
  selectedCfg,
  filters,
  sortField,
  sortDir,
  stats,
  chartData,
  unitAlerts,
  unitEvents,
  unitCompliance,
  setSelectedUnit,
  updateSearch,
  updateStatusFilter,
  updateClassificationFilter,
  toggleSort,
  acknowledgeAlert,
}) => {
  const { t } = useTranslation();

  return (
    <TabsContent value="overview" className="mt-5 space-y-5">
      {/* Filters bar */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 p-3 rounded-2xl border border-white/5 bg-sidebar/30">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-foreground/30" />
          <input
            type="text"
            placeholder={t("coldChain.searchPlaceholder")}
            aria-label={t("coldChain.searchAriaLabel")}
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
              {s === "all" ? t("coldChain.allFilter") : t(statusConfig[s].labelKey)}
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
              {c === "all" ? t("coldChain.allType") : classificationConfig[c] ? t(classificationConfig[c].labelKey) : c}
            </button>
          ))}
        </div>
        <button onClick={() => toggleSort("status")} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold text-sidebar-foreground/30 hover:text-sidebar-foreground/50 hover:bg-white/5 transition-all">
          <ArrowUpDown className="w-3 h-3" /> {sortField} {sortDir === "asc" ? "\u2191" : "\u2193"}
        </button>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* ── Unit List ──────────────────────────────── */}
        <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-sidebar-foreground/40 text-[10px] uppercase tracking-widest flex items-center gap-2">
              <Truck className="w-3.5 h-3.5" /> {t("coldChain.fleetInTransit")}
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
                <span className="text-[11px]">{t("coldChain.noResults")}</span>
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
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedCfg.pulse} animate-pulse`} /> {t(selectedCfg.labelKey).toUpperCase()}
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
                { icon: Thermometer, label: t("coldChain.tempActual"), value: `${selectedUnit.currentTemp}°C`, color: selectedCfg.color },
                { icon: Droplets, label: t("coldChain.humiditySensor"), value: `${selectedUnit.humidity}%`, color: "text-cyan-400" },
                { icon: Battery, label: t("coldChain.sensorBattery"), value: `${selectedUnit.sensorBattery}%`, color: selectedUnit.sensorBattery > 50 ? "text-green-500" : "text-yellow-500" },
                { icon: DoorOpen, label: t("coldChain.doorOpenings"), value: `${selectedUnit.doorOpenCount}`, color: selectedUnit.doorOpenCount > 3 ? "text-red-500" : "text-sidebar-foreground/60" },
                { icon: ShieldAlert, label: t("coldChain.deviations24h"), value: `${selectedUnit.totalDeviations24h}`, color: selectedUnit.totalDeviations24h > 3 ? "text-red-500" : "text-green-500" },
                { icon: Award, label: t("coldChain.complianceLabel"), value: `${selectedUnit.complianceScore}%`, color: selectedUnit.complianceScore >= 95 ? "text-green-500" : selectedUnit.complianceScore >= 80 ? "text-yellow-500" : "text-red-500" },
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
                  <Activity className="w-3.5 h-3.5" /> {t("coldChain.thermalTelemetry")}
                </h4>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-[9px] text-blue-400"><div className="w-2 h-1 bg-blue-400 rounded" /> {t("coldChain.temperature")}</span>
                  <span className="flex items-center gap-1.5 text-[9px] text-cyan-400/40"><div className="w-2 h-1 bg-cyan-400/40 rounded" /> {t("coldChain.humidity")}</span>
                  <span className="flex items-center gap-1.5 text-[9px] text-red-500"><div className="w-4 h-0 border-t border-dashed border-red-500" /> {t("coldChain.upperLimit")}</span>
                  <span className="flex items-center gap-1.5 text-[9px] text-blue-500"><div className="w-4 h-0 border-t border-dashed border-blue-500" /> {t("coldChain.lowerLimit")}</span>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <div className="text-[9px] text-sidebar-foreground/25 font-bold uppercase tracking-widest">{t("coldChain.targetRange")}</div>
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
                  <Area yAxisId="temp" type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={2.5} fill="url(#ccTempGrad)" animationDuration={1500} name={`${t("coldChain.temperature")} (°C)`} />
                  <Area yAxisId="hum" type="monotone" dataKey="humidity" stroke="rgba(6,182,212,0.3)" strokeWidth={1} fill="url(#ccHumGrad)" strokeDasharray="3 3" name={`${t("coldChain.humidity")} (%)`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Bottom row: Events Timeline + Unit Compliance + Unit Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Events Timeline */}
            <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-4 shadow-xl">
              <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> {t("coldChain.eventTimeline")}
              </h4>
              <div className="space-y-0 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                {unitEvents.length > 0 ? unitEvents.map((event, i) => (
                  <EventTimelineItem key={event.id} event={event} isLast={i === unitEvents.length - 1} />
                )) : (
                  <div className="text-[10px] text-sidebar-foreground/20 text-center py-8">{t("coldChain.noEvents")}</div>
                )}
              </div>
            </motion.div>

            {/* Unit Compliance */}
            <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-4 shadow-xl">
              <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" /> {t("coldChain.certifications")}
              </h4>
              <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                {unitCompliance.length > 0 ? unitCompliance.map((record) => (
                  <ComplianceRow key={record.id} record={record} />
                )) : (
                  <div className="text-[10px] text-sidebar-foreground/20 text-center py-8">{t("coldChain.noCertifications")}</div>
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
                <Bell className="w-3.5 h-3.5" /> {t("coldChain.vehicleAlerts")}
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
                      {t("coldChain.noAlerts")}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </TabsContent>
  );
});

ColdChainOverviewTab.displayName = "ColdChainOverviewTab";

export default ColdChainOverviewTab;
