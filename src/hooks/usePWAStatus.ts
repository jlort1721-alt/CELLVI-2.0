/**
 * PWA Status Hook
 * Detects PWA installation state, notification permissions, and online/offline status
 */

import { useState, useEffect } from 'react';
import { getPermissionStatus, isPushSupported } from '@/lib/pwa/pushNotifications';

export interface PWAStatus {
  // Installation
  isInstalled: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;

  // Notifications
  notificationPermission: NotificationPermission;
  notificationsSupported: boolean;

  // Connectivity
  isOnline: boolean;

  // Platform
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  isMobile: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

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
 * Hook to trigger install prompt
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
