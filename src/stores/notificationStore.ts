import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Severity level for platform notifications, ordered from most to least urgent. */
export type NotificationSeverity = 'critical' | 'high' | 'medium' | 'info';

/** Lifecycle status of a notification. */
export type NotificationStatus = 'new' | 'acknowledged' | 'resolved' | 'escalated';

/**
 * A platform notification (alert, escalation, or informational message).
 * Notifications are stored in-memory and capped at 500 entries.
 */
export interface Notification {
  /** Unique identifier generated on creation. */
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  status: NotificationStatus;
  /** Category key (e.g. `'speed'`, `'temperature'`, `'geofence'`). */
  type: string;
  vehicleId?: string;
  vehiclePlate?: string;
  /** ISO 8601 timestamp of when the notification was created. */
  timestamp: string;
  /** ISO 8601 timestamp of when the notification was acknowledged. */
  acknowledgedAt?: string;
  /** Number of times this notification has been escalated. */
  escalationLevel: number;
  soundPlayed: boolean;
  desktopNotified: boolean;
  /** AI-generated recommendation for resolving this notification. */
  aiRecommendation?: string;
}

/**
 * Rule defining when an unattended notification should be escalated.
 */
export interface EscalationRule {
  id: string;
  name: string;
  severity: NotificationSeverity;
  /** Minutes after creation before escalation triggers. */
  escalateAfterMinutes: number;
  /** Target role or user for escalation (e.g. `'supervisor'`). */
  escalateTo: string;
  active: boolean;
}

/**
 * Zustand state shape for the notification system.
 * Persists user preferences (sound, desktop, rules) to localStorage.
 */
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  soundEnabled: boolean;
  desktopEnabled: boolean;
  escalationRules: EscalationRule[];
  filterSeverity: NotificationSeverity | 'all';
  filterStatus: NotificationStatus | 'all';
  isOpen: boolean;

  /**
   * Add a new notification. Auto-generates `id`, `timestamp`, and defaults.
   * @param n - Notification payload (without system-managed fields).
   */
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'status' | 'escalationLevel' | 'soundPlayed' | 'desktopNotified'>) => void;
  /**
   * Mark a single notification as acknowledged by its ID.
   * @param id - Notification ID.
   */
  acknowledgeNotification: (id: string) => void;
  /** Acknowledge all unread notifications at once. */
  acknowledgeAll: () => void;
  /**
   * Mark a notification as resolved.
   * @param id - Notification ID.
   */
  resolveNotification: (id: string) => void;
  /**
   * Escalate a notification, incrementing its escalation level.
   * @param id - Notification ID.
   */
  escalateNotification: (id: string) => void;
  /**
   * Remove a notification from the list entirely.
   * @param id - Notification ID.
   */
  removeNotification: (id: string) => void;
  /** Toggle audible notification sounds on/off. */
  toggleSound: () => void;
  /** Toggle desktop (browser) notifications on/off. */
  toggleDesktop: () => void;
  setFilterSeverity: (s: NotificationSeverity | 'all') => void;
  setFilterStatus: (s: NotificationStatus | 'all') => void;
  /** Toggle the notification panel open/closed. */
  toggleOpen: () => void;
  markSoundPlayed: (id: string) => void;
  markDesktopNotified: (id: string) => void;
  /** Remove all notifications and reset unread count to zero. */
  clearAll: () => void;
}

/**
 * Zustand store for the notification center.
 * Manages notification CRUD, escalation, filtering, and user preferences.
 *
 * @example
 * const addNotification = useNotificationStore((s) => s.addNotification);
 * addNotification({ title: 'Speed Alert', message: '...', severity: 'high', type: 'speed' });
 */
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
