/**
 * Push Notifications Manager
 * Handles Web Push API subscription, permission requests, and notification delivery
 */

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  tenantId?: string;
  deviceInfo?: {
    platform: string;
    userAgent: string;
  };
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Check if Push Notifications are supported
 */
export const isPushSupported = (): boolean => {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

/**
 * Get current notification permission status
 */
export const getPermissionStatus = (): NotificationPermission => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Request notification permission
 */
export const requestPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported in this browser');
  }

  const permission = await Notification.requestPermission();

  // Track permission grant/deny
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'notification_permission', {
      event_category: 'engagement',
      event_label: permission,
    });
  }

  return permission;
};

/**
 * Subscribe to push notifications
 * @param vapidPublicKey - VAPID public key from environment
 */
export const subscribeToPush = async (
  vapidPublicKey: string
): Promise<PushSubscription | null> => {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported');
  }

  // Wait for service worker to be ready
  const registration = await navigator.serviceWorker.ready;

  // Check if already subscribed
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    // Create new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  return subscription;
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPush = async (): Promise<boolean> => {
  if (!isPushSupported()) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    return await subscription.unsubscribe();
  }

  return true;
};

/**
 * Get current push subscription
 */
export const getPushSubscription = async (): Promise<PushSubscription | null> => {
  if (!isPushSupported()) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  return await registration.pushManager.getSubscription();
};

/**
 * Convert PushSubscription to JSON format for backend storage
 */
export const serializeSubscription = (
  subscription: PushSubscription,
  userId?: string,
  tenantId?: string
): PushSubscriptionData => {
  const subscriptionJSON = subscription.toJSON();

  return {
    endpoint: subscriptionJSON.endpoint!,
    keys: {
      p256dh: subscriptionJSON.keys!.p256dh!,
      auth: subscriptionJSON.keys!.auth!,
    },
    userId,
    tenantId,
    deviceInfo: {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
    },
  };
};

/**
 * Save subscription to backend
 */
export const saveSubscriptionToBackend = async (
  subscription: PushSubscriptionData,
  backendUrl: string
): Promise<void> => {
  const response = await fetch(`${backendUrl}/api/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscription),
  });

  if (!response.ok) {
    throw new Error('Failed to save subscription to backend');
  }
};

/**
 * Delete subscription from backend
 */
export const deleteSubscriptionFromBackend = async (
  endpoint: string,
  backendUrl: string
): Promise<void> => {
  const response = await fetch(`${backendUrl}/api/push/unsubscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ endpoint }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete subscription from backend');
  }
};

/**
 * Show local notification (for testing or fallback)
 */
export const showNotification = async (
  options: NotificationOptions
): Promise<void> => {
  if (!isPushSupported()) {
    throw new Error('Notifications not supported');
  }

  const permission = await requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission not granted');
  }

  const registration = await navigator.serviceWorker.ready;

  await registration.showNotification(options.title, {
    body: options.body,
    icon: options.icon || '/logo.png',
    badge: options.badge || '/badge-icon.png',
    tag: options.tag,
    data: options.data,
    actions: options.actions,
    vibrate: [200, 100, 200],
    requireInteraction: false,
  });
};

/**
 * Utility: Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Register notification handlers in service worker
 */
export const registerNotificationHandlers = (): void => {
  if (!isPushSupported()) {
    return;
  }

  // Handle notification clicks
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
      const { notification } = event.data;

      // Route based on notification data
      if (notification.data?.url) {
        window.location.href = notification.data.url;
      }
    }
  });
};
