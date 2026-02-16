import { useCallback, useState, useEffect } from 'react';
import type { NotificationSeverity } from '@/stores/notificationStore';

export function useDesktopNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied' as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [isSupported]);

  const showDesktopNotification = useCallback((
    title: string,
    options: { body: string; severity: NotificationSeverity; vehiclePlate?: string }
  ) => {
    if (!isSupported || permission !== 'granted') return;

    const notification = new Notification(title, {
      body: options.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `cellvi-${options.severity}-${Date.now()}`,
      requireInteraction: options.severity === 'critical',
      silent: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close non-critical after 8 seconds
    if (options.severity !== 'critical') {
      setTimeout(() => notification.close(), 8000);
    }
  }, [permission, isSupported]);

  return { showDesktopNotification, requestPermission, isSupported, permission };
}
