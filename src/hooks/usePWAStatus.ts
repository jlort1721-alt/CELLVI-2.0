/**
 * PWA Status Hook
 * Detects PWA installation state, notification permissions, and online/offline status
 */

import { useState, useEffect } from 'react';
import { getPermissionStatus, isPushSupported } from '@/lib/pwa/pushNotifications';
import type { BeforeInstallPromptEvent } from '@/types/shared';

/**
 * Reactive snapshot of the Progressive Web App environment.
 * Covers installation state, notification permissions, connectivity, and platform detection.
 */
export interface PWAStatus {
  // Installation
  /** Whether the app has been installed as a PWA. */
  isInstalled: boolean;
  /** Whether the app is running in standalone (PWA) display mode. */
  isStandalone: boolean;
  /** Whether the browser has offered an install prompt. */
  canInstall: boolean;
  /** The deferred install prompt event (call `.prompt()` to show). */
  installPromptEvent: BeforeInstallPromptEvent | null;

  // Notifications
  /** Current browser notification permission (`'granted'`, `'denied'`, or `'default'`). */
  notificationPermission: NotificationPermission;
  /** Whether the Push API is supported in this browser. */
  notificationsSupported: boolean;

  // Connectivity
  /** Whether the device currently has network connectivity. */
  isOnline: boolean;

  // Platform
  /** Detected platform based on user-agent sniffing. */
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  /** Whether the device is a mobile/tablet form factor. */
  isMobile: boolean;
}

/**
 * Hook that tracks PWA installation state, notification permissions,
 * online/offline connectivity, and platform detection.
 * Updates reactively when conditions change (e.g. going offline).
 *
 * @returns A {@link PWAStatus} object with current values.
 */
export const usePWAStatus = (): PWAStatus => {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isStandalone: false,
    canInstall: false,
    installPromptEvent: null,
    notificationPermission: 'default',
    notificationsSupported: false,
    isOnline: navigator.onLine,
    platform: detectPlatform(),
    isMobile: isMobileDevice(),
  });

  useEffect(() => {
    // Check if PWA is installed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone || // iOS Safari
      document.referrer.includes('android-app://');

    setStatus((prev) => ({
      ...prev,
      isStandalone,
      isInstalled: isStandalone,
      notificationPermission: getPermissionStatus(),
      notificationsSupported: isPushSupported(),
    }));

    // Listen for install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;

      setStatus((prev) => ({
        ...prev,
        canInstall: true,
        installPromptEvent: installEvent,
      }));
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setStatus((prev) => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
        installPromptEvent: null,
      }));

      // Track installation
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'pwa_install', {
          event_category: 'engagement',
        });
      }
    };

    // Listen for online/offline changes
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    // Listen for notification permission changes
    const checkNotificationPermission = () => {
      setStatus((prev) => ({
        ...prev,
        notificationPermission: getPermissionStatus(),
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check notification permissions periodically (in case changed in settings)
    const permissionInterval = setInterval(checkNotificationPermission, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(permissionInterval);
    };
  }, []);

  return status;
};

/**
 * Detect platform
 */
function detectPlatform(): 'ios' | 'android' | 'desktop' | 'unknown' {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }

  if (/android/.test(userAgent)) {
    return 'android';
  }

  if (/windows|mac|linux/.test(userAgent)) {
    return 'desktop';
  }

  return 'unknown';
}

/**
 * Detect if mobile device
 */
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Hook that wraps {@link usePWAStatus} to expose a simple install-prompt API.
 * @returns `{ canInstall, isInstalled, promptInstall }` where `promptInstall`
 *   shows the browser install dialog and resolves to `'accepted'`, `'dismissed'`, or `null`.
 */
export const useInstallPrompt = () => {
  const { installPromptEvent, canInstall, isInstalled } = usePWAStatus();

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | null> => {
    if (!installPromptEvent || !canInstall || isInstalled) {
      return null;
    }

    try {
      await installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;

      // Track user choice
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'pwa_install_prompt_response', {
          event_category: 'engagement',
          event_label: outcome,
        });
      }

      return outcome;
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return null;
    }
  };

  return {
    canInstall,
    isInstalled,
    promptInstall,
  };
};
