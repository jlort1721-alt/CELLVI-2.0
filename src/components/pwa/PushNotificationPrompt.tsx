/**
 * Push Notification Permission Prompt
 * Contextual UI to request notification permissions at the right time
 */

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  requestPermission,
  subscribeToPush,
  getPermissionStatus,
  isPushSupported,
  serializeSubscription,
} from '@/lib/pwa/pushNotifications';
import { useToast } from '@/hooks/use-toast';

interface PushNotificationPromptProps {
  onSubscribe?: (subscription: PushSubscription) => void;
  onDismiss?: () => void;
  // Don't show if user dismissed in the last N days
  dismissCooldownDays?: number;
}

const STORAGE_KEY = 'push_notification_prompt_dismissed';
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export const PushNotificationPrompt: React.FC<PushNotificationPromptProps> = ({
  onSubscribe,
  onDismiss,
  dismissCooldownDays = 7,
}) => {
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const shouldShow = checkShouldShow();
    setVisible(shouldShow);
  }, []);

  const checkShouldShow = (): boolean => {
    // Don't show if not supported
    if (!isPushSupported()) {
      return false;
    }

    // Don't show if already granted or denied
    const permission = getPermissionStatus();
    if (permission !== 'default') {
      return false;
    }

    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismiss =
        (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceDismiss < dismissCooldownDays) {
        return false;
      }
    }

    return true;
  };

  const handleEnable = async () => {
    setSubscribing(true);

    try {
      // Request permission
      const permission = await requestPermission();

      if (permission !== 'granted') {
        toast({
          title: 'Permisos denegados',
          description:
            'No podrás recibir notificaciones de alertas críticas. Puedes habilitarlas más tarde en configuración.',
          variant: 'destructive',
        });
        handleDismiss();
        return;
      }

      // Subscribe to push
      if (!VAPID_PUBLIC_KEY) {
        console.error('VAPID_PUBLIC_KEY not configured');
        toast({
          title: 'Error de configuración',
          description: 'No se pudo configurar las notificaciones push.',
          variant: 'destructive',
        });
        return;
      }

      const subscription = await subscribeToPush(VAPID_PUBLIC_KEY);

      if (subscription) {
        toast({
          title: '¡Notificaciones activadas!',
          description: 'Recibirás alertas críticas en tiempo real.',
        });

        onSubscribe?.(subscription);

        // Save to backend (implement your backend endpoint)
        // const data = serializeSubscription(subscription, userId, tenantId);
        // await saveSubscriptionToBackend(data, 'https://your-backend.com');

        setVisible(false);
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron activar las notificaciones.',
        variant: 'destructive',
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in">
      <div className="rounded-xl border bg-sidebar border-sidebar-border shadow-xl p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sidebar-foreground text-sm">
                Activar Notificaciones
              </h3>
              <p className="text-xs text-sidebar-foreground/60 mt-0.5">
                Recibe alertas críticas de tu flota en tiempo real
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleEnable}
            disabled={subscribing}
            size="sm"
            className="flex-1"
          >
            {subscribing ? 'Activando...' : 'Activar'}
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="flex-1"
          >
            Ahora no
          </Button>
        </div>

        <p className="text-[10px] text-sidebar-foreground/40 text-center">
          Solo recibirás alertas importantes. Puedes desactivar en cualquier momento.
        </p>
      </div>
    </div>
  );
};

/**
 * Inline notification prompt (for settings page)
 */
export const InlinePushPrompt: React.FC<{
  onSubscribe?: (subscription: PushSubscription) => void;
}> = ({ onSubscribe }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribing, setSubscribing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setPermission(getPermissionStatus());
  }, []);

  const handleToggle = async () => {
    if (permission === 'granted') {
      // Unsubscribe logic
      toast({
        title: 'Función no disponible',
        description: 'Usa la configuración del navegador para revocar permisos.',
      });
      return;
    }

    setSubscribing(true);
    try {
      const newPermission = await requestPermission();
      setPermission(newPermission);

      if (newPermission === 'granted' && VAPID_PUBLIC_KEY) {
        const subscription = await subscribeToPush(VAPID_PUBLIC_KEY);
        if (subscription) {
          onSubscribe?.(subscription);
          toast({
            title: 'Notificaciones activadas',
            description: 'Recibirás alertas en tiempo real.',
          });
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-sidebar border-sidebar-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          {permission === 'granted' ? (
            <Bell className="w-5 h-5 text-blue-500" />
          ) : (
            <BellOff className="w-5 h-5 text-sidebar-foreground/40" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-sidebar-foreground">
            Notificaciones Push
          </p>
          <p className="text-xs text-sidebar-foreground/60">
            {permission === 'granted'
              ? 'Activas - Recibes alertas en tiempo real'
              : permission === 'denied'
              ? 'Bloqueadas - Habilita en configuración del navegador'
              : 'Inactivas - Activa para recibir alertas críticas'}
          </p>
        </div>
      </div>
      <Button
        onClick={handleToggle}
        disabled={subscribing || permission === 'denied'}
        size="sm"
        variant={permission === 'granted' ? 'outline' : 'default'}
      >
        {permission === 'granted' ? 'Activas' : 'Activar'}
      </Button>
    </div>
  );
};
