import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationSeverity = 'critical' | 'high' | 'medium' | 'info';
export type NotificationStatus = 'new' | 'acknowledged' | 'resolved' | 'escalated';

export interface Notification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  status: NotificationStatus;
  type: string;
  vehicleId?: string;
  vehiclePlate?: string;
  timestamp: string;
  acknowledgedAt?: string;
  escalationLevel: number;
  soundPlayed: boolean;
  desktopNotified: boolean;
  aiRecommendation?: string;
}

export interface EscalationRule {
  id: string;
  name: string;
  severity: NotificationSeverity;
  escalateAfterMinutes: number;
  escalateTo: string;
  active: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  soundEnabled: boolean;
  desktopEnabled: boolean;
  escalationRules: EscalationRule[];
  filterSeverity: NotificationSeverity | 'all';
  filterStatus: NotificationStatus | 'all';
  isOpen: boolean;

  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'status' | 'escalationLevel' | 'soundPlayed' | 'desktopNotified'>) => void;
  acknowledgeNotification: (id: string) => void;
  acknowledgeAll: () => void;
  resolveNotification: (id: string) => void;
  escalateNotification: (id: string) => void;
  removeNotification: (id: string) => void;
  toggleSound: () => void;
  toggleDesktop: () => void;
  setFilterSeverity: (s: NotificationSeverity | 'all') => void;
  setFilterStatus: (s: NotificationStatus | 'all') => void;
  toggleOpen: () => void;
  markSoundPlayed: (id: string) => void;
  markDesktopNotified: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      soundEnabled: true,
      desktopEnabled: true,
      escalationRules: [
        { id: 'er-1', name: 'Críticas sin atender', severity: 'critical', escalateAfterMinutes: 5, escalateTo: 'supervisor', active: true },
        { id: 'er-2', name: 'Altas sin atender', severity: 'high', escalateAfterMinutes: 15, escalateTo: 'manager', active: true },
      ],
      filterSeverity: 'all',
      filterStatus: 'all',
      isOpen: false,

      addNotification: (n) => set((s) => {
        const notification: Notification = {
          ...n,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date().toISOString(),
          status: 'new',
          escalationLevel: 0,
          soundPlayed: false,
          desktopNotified: false,
        };
        const updated = [notification, ...s.notifications].slice(0, 500);
        return { notifications: updated, unreadCount: s.unreadCount + 1 };
      }),

      acknowledgeNotification: (id) => set((s) => {
        const notifications = s.notifications.map((n) =>
          n.id === id ? { ...n, status: 'acknowledged' as const, acknowledgedAt: new Date().toISOString() } : n
        );
        const unreadCount = notifications.filter((n) => n.status === 'new').length;
        return { notifications, unreadCount };
      }),

      acknowledgeAll: () => set((s) => {
        const now = new Date().toISOString();
        const notifications = s.notifications.map((n) =>
          n.status === 'new' ? { ...n, status: 'acknowledged' as const, acknowledgedAt: now } : n
        );
        return { notifications, unreadCount: 0 };
      }),

      resolveNotification: (id) => set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, status: 'resolved' as const } : n
        ),
        unreadCount: s.notifications.filter((n) => n.status === 'new' && n.id !== id).length,
      })),

      escalateNotification: (id) => set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, status: 'escalated' as const, escalationLevel: n.escalationLevel + 1 } : n
        ),
      })),

      removeNotification: (id) => set((s) => {
        const notifications = s.notifications.filter((n) => n.id !== id);
        return { notifications, unreadCount: notifications.filter((n) => n.status === 'new').length };
      }),

      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleDesktop: () => set((s) => ({ desktopEnabled: !s.desktopEnabled })),
      setFilterSeverity: (filterSeverity) => set({ filterSeverity }),
      setFilterStatus: (filterStatus) => set({ filterStatus }),
      toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
      markSoundPlayed: (id) => set((s) => ({
        notifications: s.notifications.map((n) => n.id === id ? { ...n, soundPlayed: true } : n),
      })),
      markDesktopNotified: (id) => set((s) => ({
        notifications: s.notifications.map((n) => n.id === id ? { ...n, desktopNotified: true } : n),
      })),
      clearAll: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: 'cellvi-notification-storage',
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        desktopEnabled: state.desktopEnabled,
        escalationRules: state.escalationRules,
      }),
    }
  )
);
