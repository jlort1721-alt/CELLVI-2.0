import { Bell, AlertTriangle, Info, XCircle, CheckCircle, Filter, BellOff, ExternalLink, Volume2, VolumeX } from "lucide-react";
import { useState, useMemo, useEffect, useRef, memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNotificationStore, type NotificationSeverity } from "@/stores/notificationStore";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useDesktopNotifications } from "@/hooks/useDesktopNotifications";
import { Button } from "@/components/ui/button";
import NotificationBadge from "./NotificationBadge";

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

const demoAlerts: AlertItem[] = [
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
  critical: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "alertCenter.critical" },
  high: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", label: "alertCenter.high" },
  medium: { icon: Info, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "alertCenter.medium" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", label: "alertCenter.info" },
};

const AlertRow = memo(({ alert, onAcknowledge }: { alert: AlertItem; onAcknowledge: (id: string) => void }) => {
  const { t } = useTranslation();
  const cfg = severityConfig[alert.severity];
  const Icon = cfg.icon;
  return (
    <div className={`rounded-xl p-4 border bg-sidebar flex items-start gap-3 transition-all ${!alert.acknowledged && alert.severity === "critical" ? "border-red-500/30 shadow-lg shadow-red-500/5" : "border-sidebar-border"}`}>
      <div className={`p-2 rounded-lg ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-sidebar-foreground">{alert.message}</p>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-sidebar-foreground/40">
          <span>{new Date(alert.timestamp).toLocaleString("es-CO")}</span>
          <span className={`px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} font-bold`}>{t(cfg.label)}</span>
          <span>{alert.type}</span>
        </div>
      </div>
      {!alert.acknowledged && (
        <button type="button" onClick={() => onAcknowledge(alert.id)} className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-500" title={t("alertCenter.confirmAlert")}>
          <CheckCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});
AlertRow.displayName = "AlertRow";

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, info: 3 };

const DashboardAlerts = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<AlertSeverity | "all">("all");
  const [alertList, setAlertList] = useState(demoAlerts);

  // Notification store integration
  const { notifications, unreadCount, soundEnabled, toggleSound, acknowledgeAll } = useNotificationStore();
  const { playSound } = useNotificationSound();
  useDesktopNotifications();

  // Play sound for new critical notifications
  const newNotifCount = useMemo(() => notifications.filter((n) => n.status === 'new' && !n.soundPlayed).length, [notifications]);
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (newNotifCount > prevCountRef.current && soundEnabled) {
      const newest = notifications.find((n) => n.status === 'new' && !n.soundPlayed);
      if (newest) {
        playSound(newest.severity === 'critical' ? 'critical' : newest.severity === 'high' ? 'warning' : 'info');
      }
    }
    prevCountRef.current = newNotifCount;
  }, [newNotifCount, soundEnabled, notifications, playSound]);

  // Combine demo alerts with real-time notifications for display
  const allAlerts = useMemo(() => {
    const fromStore: AlertItem[] = notifications.slice(0, 20).map((n) => ({
      id: n.id,
      severity: n.severity,
      type: n.type,
      message: n.message,
      vehicle: n.vehiclePlate || '',
      timestamp: n.timestamp,
      acknowledged: n.status !== 'new',
    }));
    return [...fromStore, ...alertList];
  }, [notifications, alertList]);

  const filtered = useMemo(() =>
    filter === "all" ? allAlerts : allAlerts.filter((a) => a.severity === filter),
    [filter, allAlerts]
  );

  // Priority sort: unacknowledged first, then by severity
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1;
      return (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3);
    });
  }, [filtered]);

  const acknowledge = useCallback((id: string) => {
    setAlertList((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
    // Also acknowledge in notification store if it came from there
    useNotificationStore.getState().acknowledgeNotification(id);
  }, []);

  const acknowledgeAllLocal = useCallback(() => {
    setAlertList((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
    acknowledgeAll();
  }, [acknowledgeAll]);

  const counts = useMemo(() => ({
    critical: allAlerts.filter((a) => a.severity === "critical").length,
    high: allAlerts.filter((a) => a.severity === "high").length,
    medium: allAlerts.filter((a) => a.severity === "medium").length,
    info: allAlerts.filter((a) => a.severity === "info").length,
    unacknowledged: allAlerts.filter((a) => !a.acknowledged).length,
  }), [allAlerts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-sidebar-foreground text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-gold" /> {t("alertCenter.title")}
          {unreadCount > 0 && (
            <span className="ml-2 text-xs font-bold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full animate-pulse">
              {t("alertCenter.newCount", { count: unreadCount })}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => toggleSound()} className="h-7 px-2 text-[9px]" title={soundEnabled ? t("alertCenter.muteSound") : t("alertCenter.enableSound")}>
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-green-500" /> : <VolumeX className="w-3.5 h-3.5 text-sidebar-foreground/40" />}
          </Button>
          {counts.unacknowledged > 0 && (
            <Button size="sm" variant="outline" onClick={acknowledgeAllLocal} className="h-7 text-[9px] text-green-500 border-green-500/20 hover:bg-green-500/10 rounded-lg">
              <BellOff className="w-3 h-3 mr-1" /> {t("alertCenter.confirmAll")} ({counts.unacknowledged})
            </Button>
          )}
          <NotificationBadge />
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-sidebar-foreground/40 mr-1" />
            {(["all", "critical", "high", "medium", "info"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${filter === s ? "bg-gold/20 text-gold" : "text-sidebar-foreground/40 hover:text-sidebar-foreground/60"}`}
              >
                {s === "all" ? t("alertCenter.all") : t(severityConfig[s].label)}
                {s !== "all" && <span className="ml-1 opacity-60">({counts[s]})</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["critical", "high", "medium", "info"] as const).map((sev) => {
          const cfg = severityConfig[sev];
          const Icon = cfg.icon;
          return (
            <div key={sev} className="rounded-xl p-4 border bg-sidebar border-sidebar-border hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setFilter(sev)}>
              <Icon className={`w-5 h-5 ${cfg.color} mb-2`} />
              <div className={`text-2xl font-bold font-heading ${cfg.color}`}>{counts[sev]}</div>
              <div className="text-xs text-sidebar-foreground/50">{t(cfg.label)}</div>
            </div>
          );
        })}
      </div>

      {/* Alert list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-sidebar-foreground/20">
            <CheckCircle className="w-8 h-8 mb-3 text-green-500/30" />
            <span className="text-sm">{t("alertCenter.noAlerts")}</span>
          </div>
        ) : (
          sorted.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onAcknowledge={acknowledge} />
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardAlerts;
