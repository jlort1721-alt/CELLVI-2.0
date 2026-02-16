import { memo } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';

const NotificationBadge = memo(() => {
  const { unreadCount, notifications, toggleOpen } = useNotificationStore();
  const hasCritical = notifications.some((n) => n.severity === 'critical' && n.status === 'new');

  return (
    <button
      onClick={toggleOpen}
      className="relative p-2 rounded-lg hover:bg-sidebar-foreground/5 transition-colors"
      title={`${unreadCount} notificaciones sin leer`}
    >
      <Bell className="w-5 h-5 text-sidebar-foreground/60" />
      {unreadCount > 0 && (
        <span
          className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center text-white shadow-lg ${
            hasCritical ? 'bg-red-500 animate-pulse' : 'bg-gold'
          }`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
});
NotificationBadge.displayName = 'NotificationBadge';

export default NotificationBadge;
