import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  CheckCircle, MapPin, Battery, Clock, ShieldCheck,
  ArrowUp, ArrowDown, CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ColdChainUnit, ColdChainAlert, ComplianceRecord, ColdChainEvent } from "@/lib/coldChainData";
import {
  statusConfig,
  severityConfig,
  classificationConfig,
  eventTypeConfig,
  complianceStatusConfig,
  itemVariants,
} from "./coldChainConfig";

// ── KPICard ───────────────────────────────────────────────────────────

export const KPICard = React.memo(({ icon: Icon, label, value, subValue, color, trend }: {
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

// ── UnitCard ──────────────────────────────────────────────────────────

export const UnitCard = React.memo(({ unit, isSelected, onClick }: {
  unit: ColdChainUnit; isSelected: boolean; onClick: () => void;
}) => {
  const { t } = useTranslation();
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
          <span className={`text-[8px] font-bold ${classCfg?.color ?? "text-gray-400"} bg-white/5 px-1.5 py-0.5 rounded`}>{classCfg ? t(classCfg.labelKey) : unit.cargoClassification}</span>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold ${cfg.bg} ${cfg.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${cfg.pulse} ${unit.status !== "offline" ? "animate-pulse" : ""}`} />
          {t(cfg.labelKey)}
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

// ── AlertRow ──────────────────────────────────────────────────────────

export const AlertRow = React.memo(({ alert, onAcknowledge }: {
  alert: ColdChainAlert; onAcknowledge: (id: string) => void;
}) => {
  const { t, i18n } = useTranslation();
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
            {new Date(alert.timestamp).toLocaleString(i18n.language === "en" ? "en-US" : "es-CO", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
          </span>
          {alert.value !== undefined && alert.threshold !== undefined && (
            <span className="text-[8px] text-sidebar-foreground/25">
              {t("coldChain.valueThreshold", { value: alert.value, threshold: alert.threshold })}
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

// ── EventTimelineItem ─────────────────────────────────────────────────

export const EventTimelineItem = React.memo(({ event, isLast }: { event: ColdChainEvent; isLast: boolean }) => {
  const { i18n } = useTranslation();
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
            {new Date(event.timestamp).toLocaleTimeString(i18n.language === "en" ? "en-US" : "es-CO", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <p className="text-[9px] text-sidebar-foreground/40 mt-0.5 leading-relaxed">{event.description}</p>
      </div>
    </div>
  );
});
EventTimelineItem.displayName = "EventTimelineItem";

// ── ComplianceRow ─────────────────────────────────────────────────────

export const ComplianceRow = React.memo(({ record }: { record: ComplianceRecord }) => {
  const { t, i18n } = useTranslation();
  const statusCfg = complianceStatusConfig[record.status];

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
      <div className={`p-2 rounded-lg ${statusCfg.bg}`}>
        <ShieldCheck className={`w-4 h-4 ${statusCfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold text-sidebar-foreground">{record.standard}</span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${statusCfg.bg} ${statusCfg.color}`}>{t(statusCfg.labelKey)}</span>
        </div>
        <div className="flex items-center gap-3 text-[8px] text-sidebar-foreground/30">
          <span>Cert: {record.certNumber}</span>
          <span>Desv: {record.deviations}</span>
          <span>Vence: {new Date(record.expiresAt).toLocaleDateString(i18n.language === "en" ? "en-US" : "es-CO")}</span>
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
