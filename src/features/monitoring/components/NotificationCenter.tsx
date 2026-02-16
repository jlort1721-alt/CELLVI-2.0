import { memo, useRef } from 'react';
import { Bell, BellOff, Volume2, VolumeX, Monitor, CheckCircle, AlertTriangle, XCircle, Info, ArrowUpRight, Trash2, X, Filter } from 'lucide-react';
import { useNotificationStore, type NotificationSeverity, type NotificationStatus, type Notification } from '@/stores/notificationStore';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const severityConfig: Record<NotificationSeverity, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string }> = {
  critical: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Crítica' },
  high: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Alta' },
  medium: { icon: Info, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Media' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Info' },
};

const NotificationItem = memo(({ notification, onAcknowledge, onResolve, onEscalate, onRemove }: {
  notification: Notification;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onEscalate: (id: string) => void;
  onRemove: (id: string) => void;
}) => {
  const cfg = severityConfig[notification.severity];
  const Icon = cfg.icon;
  const isNew = notification.status === 'new';
  const timeAgo = getTimeAgo(notification.timestamp);

  return (
    <div className={`p-3 rounded-xl border transition-all ${
      isNew && notification.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' :
      isNew ? 'border-gold/20 bg-gold/5' :
      'border-sidebar-border/50 bg-sidebar/50'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-lg ${cfg.bg} shrink-0 mt-0.5`}>
          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold text-sidebar-foreground truncate">{notification.title}</span>
            {notification.vehiclePlate && (
              <span className="text-[8px] font-mono text-sidebar-foreground/40 bg-sidebar-foreground/5 px-1.5 py-0.5 rounded">
                {notification.vehiclePlate}
              </span>
            )}
          </div>
          <p className="text-[10px] text-sidebar-foreground/50 leading-relaxed line-clamp-2">{notification.message}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[8px] text-sidebar-foreground/30">{timeAgo}</span>
            <span className={`text-[7px] font-bold uppercase px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
            {notification.status !== 'new' && (
              <span className="text-[7px] font-bold uppercase px-1.5 py-0.5 rounded bg-sidebar-foreground/5 text-sidebar-foreground/40">
                {notification.status === 'acknowledged' ? 'Confirmada' : notification.status === 'resolved' ? 'Resuelta' : 'Escalada'}
              </span>
            )}
            {notification.aiRecommendation && (
              <span className="text-[7px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">IA</span>
            )}
          </div>
        </div>
        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          {isNew && (
            <button onClick={() => onAcknowledge(notification.id)} className="p-1 rounded hover:bg-green-500/10 text-green-500" title="Confirmar">
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}
          {(notification.status === 'new' || notification.status === 'acknowledged') && (
            <button onClick={() => onEscalate(notification.id)} className="p-1 rounded hover:bg-orange-500/10 text-orange-500" title="Escalar">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => onRemove(notification.id)} className="p-1 rounded hover:bg-red-500/10 text-sidebar-foreground/20 hover:text-red-400" title="Eliminar">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
});
NotificationItem.displayName = 'NotificationItem';

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${Math.floor(hours / 24)}d`;
}

const NotificationCenter = memo(() => {
  const {
    notifications, isOpen, toggleOpen, soundEnabled, desktopEnabled,
    toggleSound, toggleDesktop, acknowledgeNotification, acknowledgeAll,
    resolveNotification, escalateNotification, removeNotification,
    filterSeverity, setFilterSeverity, filterStatus, setFilterStatus, clearAll,
  } = useNotificationStore();

  const parentRef = useRef<HTMLDivElement>(null);

  // Filter notifications
  const filtered = notifications.filter((n) => {
    if (filterSeverity !== 'all' && n.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && n.status !== filterStatus) return false;
    return true;
  });

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 10,
  });

  return (
    <Sheet open={isOpen} onOpenChange={toggleOpen}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px] bg-sidebar border-sidebar-border p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-sidebar-border shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-heading text-sidebar-foreground flex items-center gap-2">
              <Bell className="w-5 h-5 text-gold" />
              Centro de Notificaciones
              <span className="text-[10px] font-mono bg-gold/10 text-gold px-2 py-0.5 rounded-full">
                {notifications.filter((n) => n.status === 'new').length}
              </span>
            </SheetTitle>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 mt-3">
            <button onClick={toggleSound} className={`p-1.5 rounded-lg transition-colors ${soundEnabled ? 'bg-green-500/10 text-green-500' : 'bg-sidebar-foreground/5 text-sidebar-foreground/30'}`} title={soundEnabled ? 'Silenciar' : 'Activar sonido'}>
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button onClick={toggleDesktop} className={`p-1.5 rounded-lg transition-colors ${desktopEnabled ? 'bg-green-500/10 text-green-500' : 'bg-sidebar-foreground/5 text-sidebar-foreground/30'}`} title={desktopEnabled ? 'Desactivar escritorio' : 'Activar escritorio'}>
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <div className="flex-1" />
            <button onClick={acknowledgeAll} className="text-[9px] font-bold text-green-500 hover:bg-green-500/10 px-2.5 py-1.5 rounded-lg transition-colors">
              <BellOff className="w-3 h-3 inline mr-1" /> Confirmar Todas
            </button>
            <button onClick={clearAll} className="text-[9px] font-bold text-red-400/60 hover:bg-red-500/10 hover:text-red-400 px-2 py-1.5 rounded-lg transition-colors">
              <Trash2 className="w-3 h-3 inline mr-1" /> Limpiar
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-1 mt-2">
            <Filter className="w-3 h-3 text-sidebar-foreground/30 mr-1" />
            {(['all', 'critical', 'high', 'medium', 'info'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeverity(s)}
                className={`px-2 py-0.5 rounded text-[8px] font-bold transition-colors ${
                  filterSeverity === s ? 'bg-gold/15 text-gold' : 'text-sidebar-foreground/30 hover:text-sidebar-foreground/50'
                }`}
              >
                {s === 'all' ? 'Todas' : severityConfig[s].label}
              </button>
            ))}
            <span className="mx-1 text-sidebar-foreground/10">|</span>
            {(['all', 'new', 'acknowledged', 'escalated'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2 py-0.5 rounded text-[8px] font-bold transition-colors ${
                  filterStatus === s ? 'bg-gold/15 text-gold' : 'text-sidebar-foreground/30 hover:text-sidebar-foreground/50'
                }`}
              >
                {s === 'all' ? 'Todos' : s === 'new' ? 'Nuevas' : s === 'acknowledged' ? 'Confirmadas' : 'Escaladas'}
              </button>
            ))}
          </div>
        </SheetHeader>

        {/* Notification List */}
        <div ref={parentRef} className="flex-1 overflow-auto px-4 py-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-sidebar-foreground/20">
              <Bell className="w-10 h-10 mb-3 opacity-30" />
              <span className="text-sm">Sin notificaciones</span>
            </div>
          ) : (
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const notification = filtered[virtualItem.index];
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    ref={virtualizer.measureElement}
                    data-index={virtualItem.index}
                  >
                    <div className="pb-2">
                      <NotificationItem
                        notification={notification}
                        onAcknowledge={acknowledgeNotification}
                        onResolve={resolveNotification}
                        onEscalate={escalateNotification}
                        onRemove={removeNotification}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
});
NotificationCenter.displayName = 'NotificationCenter';

export default NotificationCenter;
