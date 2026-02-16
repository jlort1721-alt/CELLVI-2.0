import { useState, useEffect } from 'react';
import {
  isPushSupported,
  getPermissionStatus,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
  showLocalNotification,
  type PushSubscriptionData,
} from '@/lib/pwa/pushNotifications';

// Replace with your actual VAPID public key
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check support and permission on mount
    setIsSupported(isPushSupported());
    setPermission(getPermissionStatus());

    // Check if already subscribed
    getPushSubscription().then((sub) => {
      setSubscription(sub);
      setIsSubscribed(!!sub);
    });
  }, []);

  const subscribe = async () => {
    setIsLoading(true);
    try {
      // Request permission if not granted
      if (permission !== 'granted') {
        const newPermission = await requestNotificationPermission();
        setPermission(newPermission);

        if (newPermission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      // Subscribe to push
      const subscriptionData = await subscribeToPush(VAPID_PUBLIC_KEY);
      
      if (subscriptionData) {
        // Here you would send subscriptionData to your backend
        // await supabase.from('push_subscriptions').insert({
        //   user_id: currentUser.id,
        //   subscription: subscriptionData,
        // });

        const sub = await getPushSubscription();
        setSubscription(sub);
        setIsSubscribed(true);

        // Show test notification
        await showLocalNotification('¡Notificaciones activadas!', {
          body: 'Ahora recibirás alertas en tiempo real de CELLVI',
          tag: 'welcome',
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPush();
      
      if (success) {
        // Here you would remove subscription from your backend
        // await supabase.from('push_subscriptions')
        //   .delete()
        //   .eq('user_id', currentUser.id);

        setSubscription(null);
        setIsSubscribed(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    await showLocalNotification('Notificación de prueba', {
      body: 'Esta es una notificación local de prueba',
      tag: 'test',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      requireInteraction: false,
      data: {
        url: '/platform',
      },
    });
  };

  return {
    isSupported,
    permission,
    subscription,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
