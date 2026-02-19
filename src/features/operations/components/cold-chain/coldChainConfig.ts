import React from "react";
import {
  CheckCircle, XCircle, AlertTriangle, Activity, WifiOff,
  Truck, MapPin, DoorOpen, Thermometer, ClipboardCheck, Gauge, Zap, CircleDot,
} from "lucide-react";

// ── Status Config ─────────────────────────────────────────────────────
export const statusConfig = {
  normal: { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle, labelKey: "coldChain.statusNormal", pulse: "bg-green-500" },
  warning: { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: AlertTriangle, labelKey: "coldChain.statusWarning", pulse: "bg-yellow-500" },
  critical: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: XCircle, labelKey: "coldChain.statusCritical", pulse: "bg-red-500" },
  offline: { color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20", icon: WifiOff, labelKey: "coldChain.statusOffline", pulse: "bg-gray-500" },
};

// ── Severity Config ───────────────────────────────────────────────────
export const severityConfig = {
  critical: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: XCircle },
  warning: { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: AlertTriangle },
  info: { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", icon: Activity },
};

// ── Classification Config ─────────────────────────────────────────────
export const classificationConfig: Record<string, { labelKey: string; color: string }> = {
  pharma: { labelKey: "coldChain.classPharma", color: "text-purple-400" },
  frozen: { labelKey: "coldChain.classFrozen", color: "text-cyan-400" },
  refrigerated: { labelKey: "coldChain.classRefrigerated", color: "text-blue-400" },
  "ambient-controlled": { labelKey: "coldChain.classAmbient", color: "text-orange-400" },
};

// ── Event Type Config ─────────────────────────────────────────────────
export const eventTypeConfig: Record<string, { icon: React.ElementType; color: string }> = {
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

// ── Compliance Status Config ──────────────────────────────────────────
export const complianceStatusConfig = {
  compliant: { labelKey: "coldChain.complianceCompliant", color: "text-green-500", bg: "bg-green-500/10" },
  non_compliant: { labelKey: "coldChain.complianceNonCompliant", color: "text-red-500", bg: "bg-red-500/10" },
  pending_review: { labelKey: "coldChain.compliancePending", color: "text-yellow-500", bg: "bg-yellow-500/10" },
};

// ── Animation Variants ────────────────────────────────────────────────
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};
