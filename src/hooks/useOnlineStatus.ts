/**
 * Online Status Hook - PR #28
 *
 * Detects online/offline status and provides connectivity info
 */

import { useEffect } from 'react';
import { useSyncStatusStore } from '@/stores/syncStatusStore';
import { toast } from 'sonner';

export function useOnlineStatus() {
  const { isOnline, setOnline } = useSyncStatusStore();

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      toast.success('Conexión restaurada', {
        description: 'Sincronizando datos pendientes...',
      });
    };

    const handleOffline = () => {
      setOnline(false);
      toast.warning('Sin conexión', {
        description: 'Trabajando en modo offline',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  return { isOnline };
}
