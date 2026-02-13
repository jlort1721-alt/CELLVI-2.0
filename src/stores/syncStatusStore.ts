/**
 * Sync Status Store - PR #27
 *
 * Tracks synchronization status for offline/online operations
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

interface SyncStatusState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: SyncOperation[];
  lastSyncTime: number | null;

  // Actions
  setOnline: (online: boolean) => void;
  addOperation: (op: Omit<SyncOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>) => void;
  updateOperation: (id: string, updates: Partial<SyncOperation>) => void;
  removeOperation: (id: string) => void;
  clearCompleted: () => void;
  startSync: () => void;
  endSync: () => void;
}

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  pendingOperations: [],
  lastSyncTime: null,

  setOnline: (online) => set({ isOnline: online }),

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
}));
