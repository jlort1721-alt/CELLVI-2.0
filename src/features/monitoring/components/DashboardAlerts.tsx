import { Bell, AlertTriangle, Info, XCircle, CheckCircle, Filter } from "lucide-react";
import { useState } from "react";

type AlertSeverity = "critical" | "high" | "medium" | "info";

interface AlertItem {
  id: string;
  severity: AlertSeverity;
  type: string;
  message: string;
  vehicle: string;
  timestamp: string;
  acknowledged: boolean;
}

const alerts: AlertItem[] = [
  { id: "a-1", severity: "critical", type: "speed", message: "PUT-321 — Exceso de velocidad: 110 km/h (límite: 80)", vehicle: "PUT-321", timestamp: "2026-02-11T14:15:00Z", acknowledged: false },
  { id: "a-2", severity: "critical", type: "temperature", message: "NAR-456 — Temperatura fuera de rango: 9.1°C (máx: 8°C)", vehicle: "NAR-456", timestamp: "2026-02-11T14:10:00Z", acknowledged: false },
  { id: "a-3", severity: "high", type: "fuel", message: "CAU-654 — Caída abrupta de combustible: -18% en 25 min", vehicle: "CAU-654", timestamp: "2026-02-11T13:45:00Z", acknowledged: true },
  { id: "a-4", severity: "high", type: "geofence", message: "NAR-123 — Salida de geocerca: Base Pasto", vehicle: "NAR-123", timestamp: "2026-02-11T12:30:00Z", acknowledged: true },
  { id: "a-5", severity: "medium", type: "battery", message: "CAU-654 — Batería baja: 60%", vehicle: "CAU-654", timestamp: "2026-02-11T10:00:00Z", acknowledged: true },
  { id: "a-6", severity: "medium", type: "maintenance", message: "VAL-789 — Mantenimiento programado en 500 km", vehicle: "VAL-789", timestamp: "2026-02-11T09:00:00Z", acknowledged: false },
  { id: "a-7", severity: "info", type: "connectivity", message: "PUT-321 — Conmutación a satelital (sin cobertura 4G)", vehicle: "PUT-321", timestamp: "2026-02-11T08:30:00Z", acknowledged: true },
  { id: "a-8", severity: "info", type: "driver", message: "NAR-123 — Conductor inició inspección pre-operacional", vehicle: "NAR-123", timestamp: "2026-02-11T06:00:00Z", acknowledged: true },
];

const severityConfig: Record<AlertSeverity, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string }> = {
  critical: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Crítica" },
  high: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", label: "Alta" },
  medium: { icon: Info, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Media" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", label: "Info" },
};

const DashboardAlerts = () => {
  const [filter, setFilter] = useState<AlertSeverity | "all">("all");
  const [alertList, setAlertList] = useState(alerts);

  const filtered = filter === "all" ? alertList : alertList.filter((a) => a.severity === filter);

  const acknowledge = (id: string) => {
    setAlertList((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-sidebar-foreground text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-gold" /> Centro de Alertas
        </h2>
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-sidebar-foreground/40 mr-1" />
          {(["all", "critical", "high", "medium", "info"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${filter === s ? "bg-gold/20 text-gold" : "text-sidebar-foreground/40 hover:text-sidebar-foreground/60"
                }`}
            >
              {s === "all" ? "Todas" : severityConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["critical", "high", "medium", "info"] as const).map((sev) => {
          const cfg = severityConfig[sev];
          const Icon = cfg.icon;
          const count = alertList.filter((a) => a.severity === sev).length;
          return (
            <div key={sev} className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
              <Icon className={`w-5 h-5 ${cfg.color} mb-2`} />
              <div className={`text-2xl font-bold font-heading ${cfg.color}`}>{count}</div>
              <div className="text-xs text-sidebar-foreground/50">{cfg.label}</div>
            </div>
          );
        })}
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {filtered.map((alert) => {
          const cfg = severityConfig[alert.severity];
          const Icon = cfg.icon;
          return (
            <div key={alert.id} className={`rounded-xl p-4 border bg-sidebar flex items-start gap-3 ${!alert.acknowledged && alert.severity === "critical" ? "border-red-500/30" : "border-sidebar-border"
              }`}>
              <div className={`p-2 rounded-lg ${cfg.bg}`}>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-sidebar-foreground">{alert.message}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-sidebar-foreground/40">
                  <span>{new Date(alert.timestamp).toLocaleString("es-CO")}</span>
                  <span className={`px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} font-bold`}>{cfg.label}</span>
                  <span>{alert.type}</span>
                </div>
              </div>
              {!alert.acknowledged && (
                <button onClick={() => acknowledge(alert.id)} className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-500">
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardAlerts;
