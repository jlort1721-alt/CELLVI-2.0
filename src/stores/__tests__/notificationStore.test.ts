/**
 * Notification Store Tests
 * Tests for src/stores/notificationStore.ts (Zustand + persist)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore } from '../notificationStore';
import type { Notification } from '../notificationStore';

const { setState, getState } = useNotificationStore;

/** Helper to build a minimal notification payload (omitting auto-generated fields). */
function makePayload(overrides: Partial<Omit<Notification, 'id' | 'timestamp' | 'status' | 'escalationLevel' | 'soundPlayed' | 'desktopNotified'>> = {}) {
  return {
    title: overrides.title ?? 'Test Alert',
    message: overrides.message ?? 'Something happened',
    severity: overrides.severity ?? ('medium' as const),
    type: overrides.type ?? 'test',
    vehicleId: overrides.vehicleId,
    vehiclePlate: overrides.vehiclePlate,
  };
}

beforeEach(() => {
  setState({
    notifications: [],
    unreadCount: 0,
    soundEnabled: true,
    desktopEnabled: true,
    filterSeverity: 'all',
    filterStatus: 'all',
    isOpen: false,
  });
});

// ── Initial State ──────────────────────────────────────────────────────────

describe('initial state', () => {
  it('should have empty notifications', () => {
    expect(getState().notifications).toEqual([]);
  });

  it('should have unreadCount of 0', () => {
    expect(getState().unreadCount).toBe(0);
  });

  it('should have soundEnabled true', () => {
    expect(getState().soundEnabled).toBe(true);
  });

  it('should have desktopEnabled true', () => {
    expect(getState().desktopEnabled).toBe(true);
  });
});

// ── addNotification ────────────────────────────────────────────────────────

describe('addNotification', () => {
  it('should add a notification with auto-generated id', () => {
    getState().addNotification(makePayload());
    const notifs = getState().notifications;
    expect(notifs).toHaveLength(1);
    expect(notifs[0].id).toMatch(/^notif-/);
  });

  it('should set status to "new"', () => {
    getState().addNotification(makePayload());
    expect(getState().notifications[0].status).toBe('new');
  });

  it('should set escalationLevel to 0', () => {
    getState().addNotification(makePayload());
    expect(getState().notifications[0].escalationLevel).toBe(0);
  });

  it('should set soundPlayed to false', () => {
    getState().addNotification(makePayload());
    expect(getState().notifications[0].soundPlayed).toBe(false);
  });

  it('should set desktopNotified to false', () => {
    getState().addNotification(makePayload());
    expect(getState().notifications[0].desktopNotified).toBe(false);
  });

  it('should auto-generate a timestamp', () => {
    getState().addNotification(makePayload());
    const ts = getState().notifications[0].timestamp;
    expect(ts).toBeTruthy();
    // Should be a valid ISO date string
    expect(new Date(ts).toISOString()).toBe(ts);
  });

  it('should increment unreadCount', () => {
    getState().addNotification(makePayload());
    expect(getState().unreadCount).toBe(1);
    getState().addNotification(makePayload());
    expect(getState().unreadCount).toBe(2);
  });

  it('should prepend new notifications (newest first)', () => {
    getState().addNotification(makePayload({ title: 'First' }));
    getState().addNotification(makePayload({ title: 'Second' }));
    expect(getState().notifications[0].title).toBe('Second');
    expect(getState().notifications[1].title).toBe('First');
  });

  it('should cap at 500 notifications', () => {
    // Seed with 500 notifications directly via setState for speed
    const seed: Notification[] = Array.from({ length: 500 }, (_, i) => ({
      id: `notif-seed-${i}`,
      title: `Seed ${i}`,
      message: 'msg',
      severity: 'info' as const,
      status: 'new' as const,
      type: 'test',
      timestamp: new Date().toISOString(),
      escalationLevel: 0,
      soundPlayed: false,
      desktopNotified: false,
    }));
    setState({ notifications: seed, unreadCount: 500 });
    expect(getState().notifications).toHaveLength(500);

    // Adding one more should still cap at 500
    getState().addNotification(makePayload({ title: 'Overflow' }));
    expect(getState().notifications).toHaveLength(500);
    // The newest should be at index 0
    expect(getState().notifications[0].title).toBe('Overflow');
  });
});

// ── acknowledgeNotification ────────────────────────────────────────────────

describe('acknowledgeNotification', () => {
  it('should set status to "acknowledged"', () => {
    getState().addNotification(makePayload());
    const id = getState().notifications[0].id;
    getState().acknowledgeNotification(id);
    expect(getState().notifications[0].status).toBe('acknowledged');
  });

  it('should add an acknowledgedAt timestamp', () => {
    getState().addNotification(makePayload());
    const id = getState().notifications[0].id;
    getState().acknowledgeNotification(id);
    expect(getState().notifications[0].acknowledgedAt).toBeTruthy();
  });

  it('should decrement unreadCount', () => {
    getState().addNotification(makePayload());
    getState().addNotification(makePayload());
    expect(getState().unreadCount).toBe(2);
    const id = getState().notifications[0].id;
    getState().acknowledgeNotification(id);
    expect(getState().unreadCount).toBe(1);
  });

  it('should not affect other notifications', () => {
    getState().addNotification(makePayload({ title: 'A' }));
    getState().addNotification(makePayload({ title: 'B' }));
    const idB = getState().notifications[0].id; // B is first (newest)
    getState().acknowledgeNotification(idB);
    // A (index 1) should still be 'new'
    expect(getState().notifications[1].status).toBe('new');
  });
});

// ── acknowledgeAll ─────────────────────────────────────────────────────────

describe('acknowledgeAll', () => {
  it('should acknowledge all "new" notifications', () => {
    getState().addNotification(makePayload({ title: 'A' }));
    getState().addNotification(makePayload({ title: 'B' }));
    getState().addNotification(makePayload({ title: 'C' }));
    getState().acknowledgeAll();
    const statuses = getState().notifications.map((n) => n.status);
    expect(statuses).toEqual(['acknowledged', 'acknowledged', 'acknowledged']);
  });

  it('should set unreadCount to 0', () => {
    getState().addNotification(makePayload());
    getState().addNotification(makePayload());
    getState().acknowledgeAll();
    expect(getState().unreadCount).toBe(0);
  });

  it('should add acknowledgedAt to all acknowledged notifications', () => {
    getState().addNotification(makePayload());
    getState().acknowledgeAll();
    expect(getState().notifications[0].acknowledgedAt).toBeTruthy();
  });

  it('should not re-acknowledge already-acknowledged notifications', () => {
    getState().addNotification(makePayload());
    const id = getState().notifications[0].id;
    getState().acknowledgeNotification(id);
    const firstAckedAt = getState().notifications[0].acknowledgedAt;
    // Call acknowledgeAll - already acknowledged ones should not change
    getState().acknowledgeAll();
    expect(getState().notifications[0].acknowledgedAt).toBe(firstAckedAt);
  });
});

// ── resolveNotification ────────────────────────────────────────────────────

describe('resolveNotification', () => {
  it('should set status to "resolved"', () => {
    getState().addNotification(makePayload());
    const id = getState().notifications[0].id;
    getState().resolveNotification(id);
    expect(getState().notifications[0].status).toBe('resolved');
  });

  it('should update unreadCount correctly when resolving a "new" notification', () => {
    getState().addNotification(makePayload());
    getState().addNotification(makePayload());
    expect(getState().unreadCount).toBe(2);
    const id = getState().notifications[0].id;
    getState().resolveNotification(id);
    expect(getState().unreadCount).toBe(1);
  });
});

// ── escalateNotification ───────────────────────────────────────────────────

describe('escalateNotification', () => {
  it('should set status to "escalated"', () => {
    getState().addNotification(makePayload());
    const id = getState().notifications[0].id;
    getState().escalateNotification(id);
    expect(getState().notifications[0].status).toBe('escalated');
  });

  it('should increment escalationLevel', () => {
    getState().addNotification(makePayload());
    const id = getState().notifications[0].id;
    expect(getState().notifications[0].escalationLevel).toBe(0);
    getState().escalateNotification(id);
    expect(getState().notifications[0].escalationLevel).toBe(1);
  });

  it('should increment escalationLevel cumulatively', () => {
    getState().addNotification(makePayload());
    const id = getState().notifications[0].id;
    getState().escalateNotification(id);
    getState().escalateNotification(id);
    expect(getState().notifications[0].escalationLevel).toBe(2);
  });
});

// ── removeNotification ─────────────────────────────────────────────────────

describe('removeNotification', () => {
  it('should remove the notification from the list', () => {
    getState().addNotification(makePayload());
    const id = getState().notifications[0].id;
    getState().removeNotification(id);
    expect(getState().notifications).toHaveLength(0);
  });

  it('should update unreadCount when removing a "new" notification', () => {
    getState().addNotification(makePayload());
    getState().addNotification(makePayload());
    expect(getState().unreadCount).toBe(2);
    const id = getState().notifications[0].id;
    getState().removeNotification(id);
    expect(getState().unreadCount).toBe(1);
  });

  it('should not change unreadCount when removing an acknowledged notification', () => {
    getState().addNotification(makePayload());
    getState().addNotification(makePayload());
    const id = getState().notifications[0].id;
    getState().acknowledgeNotification(id);
    expect(getState().unreadCount).toBe(1);
    getState().removeNotification(id);
    expect(getState().unreadCount).toBe(1);
  });
});

// ── toggleSound / toggleDesktop ────────────────────────────────────────────

describe('toggleSound', () => {
  it('should toggle soundEnabled from true to false', () => {
    expect(getState().soundEnabled).toBe(true);
    getState().toggleSound();
    expect(getState().soundEnabled).toBe(false);
  });

  it('should toggle soundEnabled from false to true', () => {
    getState().toggleSound(); // true -> false
    getState().toggleSound(); // false -> true
    expect(getState().soundEnabled).toBe(true);
  });
});

describe('toggleDesktop', () => {
  it('should toggle desktopEnabled from true to false', () => {
    expect(getState().desktopEnabled).toBe(true);
    getState().toggleDesktop();
    expect(getState().desktopEnabled).toBe(false);
  });

  it('should toggle desktopEnabled from false to true', () => {
    getState().toggleDesktop(); // true -> false
    getState().toggleDesktop(); // false -> true
    expect(getState().desktopEnabled).toBe(true);
  });
});

// ── setFilterSeverity / setFilterStatus ────────────────────────────────────

describe('setFilterSeverity', () => {
  it('should set filterSeverity to a specific value', () => {
    getState().setFilterSeverity('critical');
    expect(getState().filterSeverity).toBe('critical');
  });

  it('should set filterSeverity back to "all"', () => {
    getState().setFilterSeverity('high');
    getState().setFilterSeverity('all');
    expect(getState().filterSeverity).toBe('all');
  });
});

describe('setFilterStatus', () => {
  it('should set filterStatus to a specific value', () => {
    getState().setFilterStatus('resolved');
    expect(getState().filterStatus).toBe('resolved');
  });

  it('should set filterStatus back to "all"', () => {
    getState().setFilterStatus('acknowledged');
    getState().setFilterStatus('all');
    expect(getState().filterStatus).toBe('all');
  });
});

// ── toggleOpen ─────────────────────────────────────────────────────────────

describe('toggleOpen', () => {
  it('should toggle isOpen from false to true', () => {
    expect(getState().isOpen).toBe(false);
    getState().toggleOpen();
    expect(getState().isOpen).toBe(true);
  });

  it('should toggle isOpen from true to false', () => {
    getState().toggleOpen(); // false -> true
    getState().toggleOpen(); // true -> false
    expect(getState().isOpen).toBe(false);
  });
});

// ── markSoundPlayed / markDesktopNotified ──────────────────────────────────

describe('markSoundPlayed', () => {
  it('should mark soundPlayed as true on the target notification', () => {
    getState().addNotification(makePayload());
    const id = getState().notifications[0].id;
    expect(getState().notifications[0].soundPlayed).toBe(false);
    getState().markSoundPlayed(id);
    expect(getState().notifications[0].soundPlayed).toBe(true);
  });

  it('should not affect other notifications', () => {
    getState().addNotification(makePayload({ title: 'A' }));
    getState().addNotification(makePayload({ title: 'B' }));
    const idB = getState().notifications[0].id;
    getState().markSoundPlayed(idB);
    expect(getState().notifications[1].soundPlayed).toBe(false);
  });
});

describe('markDesktopNotified', () => {
  it('should mark desktopNotified as true on the target notification', () => {
    getState().addNotification(makePayload());
    const id = getState().notifications[0].id;
    expect(getState().notifications[0].desktopNotified).toBe(false);
    getState().markDesktopNotified(id);
    expect(getState().notifications[0].desktopNotified).toBe(true);
  });

  it('should not affect other notifications', () => {
    getState().addNotification(makePayload({ title: 'A' }));
    getState().addNotification(makePayload({ title: 'B' }));
    const idB = getState().notifications[0].id;
    getState().markDesktopNotified(idB);
    expect(getState().notifications[1].desktopNotified).toBe(false);
  });
});

// ── clearAll ───────────────────────────────────────────────────────────────

describe('clearAll', () => {
  it('should reset notifications to empty array', () => {
    getState().addNotification(makePayload());
    getState().addNotification(makePayload());
    getState().clearAll();
    expect(getState().notifications).toEqual([]);
  });

  it('should reset unreadCount to 0', () => {
    getState().addNotification(makePayload());
    getState().addNotification(makePayload());
    getState().clearAll();
    expect(getState().unreadCount).toBe(0);
  });
});
