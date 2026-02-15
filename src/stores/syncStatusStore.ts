/**
 * Sync Status Store - Enhanced with Offline Queue Integration
 *
 * Tracks synchronization status for offline/online operations
 * Integrates with IndexedDB mutation queue for persistent offline support
 */

import { create } from 'zustand';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  timestamp: number;
  status: 'pending' | 'syncing' | 'success' | 'error';
  retryCount: number;
  error?: string;
}

export interface QueueStats {
  total: number;
  byEntity: Record<string, number>;
  byStatus: Record<string, number>;
  highPriority: number;
}

interface SyncStatusState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: SyncOperation[];
  lastSyncTime: number | null;
  queueStats: QueueStats | null;

  // Basic Actions
  setOnline: (online: boolean) => void;
  addOperation: (op: Omit<SyncOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>) => void;
  updateOperation: (id: string, updates: Partial<SyncOperation>) => void;
  removeOperation: (id: string) => void;
  clearCompleted: () => void;
  startSync: () => void;
  endSync: () => void;

  // Enhanced Queue Actions
  processPendingQueue: () => Promise<number>;
  refreshQueueStats: () => Promise<void>;
  retryFailedOperations: () => Promise<number>;
  clearFailedOperations: () => Promise<number>;
}

export const useSyncStatusStore = create<SyncStatusState>((set, get) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  pendingOperations: [],
  lastSyncTime: null,
  queueStats: null,

  setOnline: (online) => {
    set({ isOnline: online });

    // Auto-process queue when coming back online
    if (online && get().pendingOperations.length > 0) {
      setTimeout(() => {
        get().processPendingQueue();
      }, 1000);
    }
  },

  addOperation: (op) =>
    set((state) => ({
      pendingOperations: [
        ...state.pendingOperations,
        {
          ...op,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          status: 'pending' as const,
          retryCount: 0,
        },
      ],
    })),

  updateOperation: (id, updates) =>
    set((state) => ({
      pendingOperations: state.pendingOperations.map((op) =>
        op.id === id ? { ...op, ...updates } : op
      ),
    })),

  removeOperation: (id) =>
    set((state) => ({
      pendingOperations: state.pendingOperations.filter((op) => op.id !== id),
    })),

  clearCompleted: () =>
    set((state) => ({
      pendingOperations: state.pendingOperations.filter(
        (op) => op.status !== 'success'
      ),
    })),

  startSync: () => set({ isSyncing: true }),

  endSync: () => set({ isSyncing: false, lastSyncTime: Date.now() }),

  // Enhanced Queue Methods
  processPendingQueue: async () => {
    const { processPendingQueue } = await import('@/lib/offline/mutationQueue');
    const count = await processPendingQueue();
    await get().refreshQueueStats();
    return count;
  },

  refreshQueueStats: async () => {
    const { getQueueStatus } = await import('@/lib/offline/mutationQueue');
    const stats = await getQueueStatus();
    set({ queueStats: stats });
  },

  retryFailedOperations: async () => {
    const { retryFailedMutations } = await import('@/lib/offline/mutationQueue');
    const count = await retryFailedMutations();
    await get().refreshQueueStats();
    return count;
  },

  clearFailedOperations: async () => {
    const { clearFailedMutations } = await import('@/lib/offline/mutationQueue');
    const count = await clearFailedMutations();
    await get().refreshQueueStats();
    return count;
  },
}));
