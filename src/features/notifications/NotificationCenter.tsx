import { memo, useState, useMemo, useCallback } from "react";
import {
  Bell, AlertTriangle, Info, CheckCircle, X, Filter,
  Trash2, CheckCheck, Clock,
} from "lucide-react";
import { useSyncStatusStore } from "@/stores/syncStatusStore";

/* ── Types ────────────────────────────────────────────── */
type NotificationType = "alert" | "info" | "warning" | "system";
type NotificationSeverity = "low" | "medium" | "high" | "critical";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: number;
  read: boolean;
  source?: string;
}

/* ── Demo Notifications (used when no real data) ──────── */
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "alert",
    title: "Alerta de velocidad",
    message: "V-103 excedió 120 km/h en zona de 80 km/h",
    severity: "high",
    timestamp: Date.now() - 5 * 60 * 1000,
    read: false,
    source: "Policy Engine",
  },
  {
    id: "n2",
    type: "warning",
    title: "Temperatura fuera de rango",
    message: "Contenedor refrigerado V-207 alcanzó -15.2°C (límite: -18°C)",
    severity: "medium",
    timestamp: Date.now() - 15 * 60 * 1000,
    read: false,
    source: "Cadena de Frío",
  },
  {
    id: "n3",
    type: "system",
    title: "Sincronización completada",
    message: "3 operaciones pendientes procesadas correctamente",
    severity: "low",
    timestamp: Date.now() - 30 * 60 * 1000,
    read: true,
    source: "Sistema",
  },
  {
    id: "n4",
    type: "info",
    title: "Mantenimiento programado",
    message: "V-105 requiere cambio de aceite en 500 km",
    severity: "low",
    timestamp: Date.now() - 60 * 60 * 1000,
    read: true,
    source: "Mantenimiento Predictivo",
  },
  {
    id: "n5",
    type: "alert",
    title: "Geocerca violada",
    message: "V-112 salió de zona autorizada 'Ruta Norte'",
    severity: "critical",
    timestamp: Date.now() - 2 * 60 * 1000,
    read: false,
    source: "Geocercas",
  },
];

/* ── Helper: format relative time ─────────────────────── */
const timeAgo = (ts: number): string => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "Ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

/* ── Icon & color by type ─────────────────────────────── */
const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  alert: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
  warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10" },
  system: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
};

/* ── Filter Tabs ──────────────────────────────────────── */
const FILTERS: { key: "all" | NotificationType; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "alert", label: "Alertas" },
  { key: "warning", label: "Avisos" },
  { key: "info", label: "Info" },
  { key: "system", label: "Sistema" },
];

/* ── Notification Row ─────────────────────────────────── */
const NotificationRow = memo(({
  notification, onToggleRead, onDismiss,
}: {
  notification: Notification;
  onToggleRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) => {
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-b border-sidebar-border/50 hover:bg-sidebar-accent/30 transition-colors group ${
        !notification.read ? "bg-sidebar-accent/10" : ""
      }`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${config.bg}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className={`text-xs font-semibold ${!notification.read ? "text-sidebar-foreground" : "text-sidebar-foreground/60"}`}>
              {notification.title}
            </span>
            {!notification.read && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold ml-1.5 align-middle" />
            )}
          </div>
          <span className="text-[9px] text-sidebar-foreground/30 flex-shrink-0 flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {timeAgo(notification.timestamp)}
          </span>
        </div>
        <p className="text-[10px] text-sidebar-foreground/50 mt-0.5 line-clamp-2">{notification.message}</p>
        {notification.source && (
          <span className="text-[9px] text-gold/50 mt-1 inline-block">{notification.source}</span>
        )}
      </div>
      <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onToggleRead(notification.id)}
          className="p-1 rounded hover:bg-sidebar-accent"
          title={notification.read ? "Marcar como no leída" : "Marcar como leída"}
        >
          <CheckCheck className={`w-3 h-3 ${notification.read ? "text-sidebar-foreground/30" : "text-gold"}`} />
        </button>
        <button
          type="button"
          onClick={() => onDismiss(notification.id)}
          className="p-1 rounded hover:bg-red-500/10"
          title="Eliminar"
        >
          <X className="w-3 h-3 text-sidebar-foreground/30 hover:text-red-400" />
        </button>
      </div>
    </div>
  );
});
NotificationRow.displayName = "NotificationRow";

/* ── Main NotificationCenter ──────────────────────────── */
export const NotificationCenter = memo(({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<"all" | NotificationType>("all");
  const { pendingOperations } = useSyncStatusStore();

  const filtered = useMemo(
    () => activeFilter === "all" ? notifications : notifications.filter((n) => n.type === activeFilter),
    [notifications, activeFilter]
  );

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const toggleRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications((prev) => prev.filter((n) => !n.read));
  }, []);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-4 top-14 z-50 w-96 max-h-[calc(100vh-5rem)] bg-sidebar border border-sidebar-border rounded-xl shadow-2xl flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-heading font-bold text-sidebar-foreground">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="bg-gold/20 text-gold text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[10px] text-sidebar-foreground/40 hover:text-gold px-2 py-1 rounded"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={clearAll}
              className="text-[10px] text-sidebar-foreground/40 hover:text-red-400 px-2 py-1 rounded"
              title="Limpiar leídas"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-sidebar-border/50">
          <Filter className="w-3 h-3 text-sidebar-foreground/30 mr-1" />
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                activeFilter === f.key
                  ? "bg-gold/20 text-gold"
                  : "text-sidebar-foreground/40 hover:text-sidebar-foreground/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sync Status Banner */}
        {pendingOperations.length > 0 && (
          <div className="mx-3 mt-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-[10px] text-yellow-400 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            {pendingOperations.length} operación(es) pendiente(s) de sincronizar
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sidebar-foreground/30">
              <Bell className="w-8 h-8 mb-2" />
              <span className="text-xs">Sin notificaciones</span>
            </div>
          ) : (
            filtered.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onToggleRead={toggleRead}
                onDismiss={dismiss}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-sidebar-border text-center">
          <span className="text-[9px] text-sidebar-foreground/30">
            {notifications.length} notificación(es) total(es) - {unreadCount} sin leer
          </span>
        </div>
      </div>
    </>
  );
});
NotificationCenter.displayName = "NotificationCenter";
