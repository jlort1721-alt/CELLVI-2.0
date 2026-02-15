/**
 * IndexedDB Wrapper for Offline-First Data Persistence
 * Provides schema versioning, CRUD operations, and conflict detection
 */

const DB_NAME = 'cellvi_offline_db';
const DB_VERSION = 1;

/**
 * Database Stores
 */
export const STORES = {
  MUTATIONS: 'offline_mutations',      // Queued mutations waiting to sync
  CACHED_DATA: 'cached_data',         // Cached entities for offline read
  CONFLICT_LOG: 'conflict_log',       // Conflict resolution history
} as const;

/**
 * Mutation Record
 */
export interface MutationRecord {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId?: string;
  data: Record<string, unknown>;
  timestamp: number;
  userId: string;
  hash: string;                       // Content hash for deduplication
  retryCount: number;
  status: 'pending' | 'syncing' | 'success' | 'error';
  error?: string;
  priority: number;                   // Higher = more important
}

/**
 * Cached Data Record
 */
export interface CachedDataRecord {
  id: string;
  entity: string;
  data: Record<string, unknown>;
  timestamp: number;
  version: number;                    // For conflict detection
  lastSyncedAt: number | null;
}

/**
 * Conflict Record
 */
export interface ConflictRecord {
  id: string;
  mutationId: string;
  entity: string;
  entityId: string;
  localVersion: number;
  serverVersion: number;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  timestamp: number;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merged';
}

/**
 * Open IndexedDB connection
 */
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Mutations Store
      if (!db.objectStoreNames.contains(STORES.MUTATIONS)) {
        const mutationsStore = db.createObjectStore(STORES.MUTATIONS, { keyPath: 'id' });
        mutationsStore.createIndex('status', 'status', { unique: false });
        mutationsStore.createIndex('priority', 'priority', { unique: false });
        mutationsStore.createIndex('timestamp', 'timestamp', { unique: false });
        mutationsStore.createIndex('entity', 'entity', { unique: false });
      }

      // Cached Data Store
      if (!db.objectStoreNames.contains(STORES.CACHED_DATA)) {
        const cachedDataStore = db.createObjectStore(STORES.CACHED_DATA, { keyPath: 'id' });
        cachedDataStore.createIndex('entity', 'entity', { unique: false });
        cachedDataStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Conflict Log Store
      if (!db.objectStoreNames.contains(STORES.CONFLICT_LOG)) {
        const conflictStore = db.createObjectStore(STORES.CONFLICT_LOG, { keyPath: 'id' });
        conflictStore.createIndex('mutationId', 'mutationId', { unique: false });
        conflictStore.createIndex('resolved', 'resolved', { unique: false });
        conflictStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

/**
 * Add a mutation to the queue
 */
export const addMutation = async (mutation: Omit<MutationRecord, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<string> => {
  const db = await openDB();
  const id = crypto.randomUUID();

  const record: MutationRecord = {
    ...mutation,
    id,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.MUTATIONS], 'readwrite');
    const store = transaction.objectStore(STORES.MUTATIONS);
    const request = store.add(record);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get all pending mutations (ordered by priority, then timestamp)
 */
export const getPendingMutations = async (): Promise<MutationRecord[]> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.MUTATIONS], 'readonly');
    const store = transaction.objectStore(STORES.MUTATIONS);
    const index = store.index('status');
    const request = index.getAll('pending');

    request.onsuccess = () => {
      // Sort by priority DESC, then timestamp ASC
      const mutations = request.result.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.timestamp - b.timestamp;
      });
      resolve(mutations);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Update mutation status
 */
export const updateMutationStatus = async (
  id: string,
  updates: Partial<Pick<MutationRecord, 'status' | 'error' | 'retryCount'>>
): Promise<void> => {
  const db = await openDB();

  return new Promise(async (resolve, reject) => {
    const transaction = db.transaction([STORES.MUTATIONS], 'readwrite');
    const store = transaction.objectStore(STORES.MUTATIONS);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const record = getRequest.result;
      if (!record) {
        reject(new Error(`Mutation ${id} not found`));
        return;
      }

      const updated = { ...record, ...updates };
      const putRequest = store.put(updated);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

/**
 * Delete mutation from queue
 */
export const deleteMutation = async (id: string): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.MUTATIONS], 'readwrite');
    const store = transaction.objectStore(STORES.MUTATIONS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Cache data for offline read access
 */
export const cacheData = async (entity: string, data: Record<string, unknown>[], version: number = 1): Promise<void> => {
  const db = await openDB();
  const timestamp = Date.now();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CACHED_DATA], 'readwrite');
    const store = transaction.objectStore(STORES.CACHED_DATA);

    // Clear old cache for this entity
    const index = store.index('entity');
    const request = index.openCursor(IDBKeyRange.only(entity));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        // Add new cached data
        data.forEach((item) => {
          const record: CachedDataRecord = {
            id: `${entity}_${item.id}`,
            entity,
            data: item,
            timestamp,
            version,
            lastSyncedAt: timestamp,
          };
          store.add(record);
        });
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

/**
 * Get cached data for an entity
 */
export const getCachedData = async (entity: string): Promise<Record<string, unknown>[]> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CACHED_DATA], 'readonly');
    const store = transaction.objectStore(STORES.CACHED_DATA);
    const index = store.index('entity');
    const request = index.getAll(entity);

    request.onsuccess = () => {
      const records = request.result as CachedDataRecord[];
      resolve(records.map((r) => r.data));
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Log a conflict for resolution
 */
export const logConflict = async (conflict: Omit<ConflictRecord, 'id' | 'timestamp' | 'resolved'>): Promise<string> => {
  const db = await openDB();
  const id = crypto.randomUUID();

  const record: ConflictRecord = {
    ...conflict,
    id,
    timestamp: Date.now(),
    resolved: false,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CONFLICT_LOG], 'readwrite');
    const store = transaction.objectStore(STORES.CONFLICT_LOG);
    const request = store.add(record);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get unresolved conflicts
 */
export const getUnresolvedConflicts = async (): Promise<ConflictRecord[]> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CONFLICT_LOG], 'readonly');
    const store = transaction.objectStore(STORES.CONFLICT_LOG);
    const index = store.index('resolved');
    const request = index.getAll(false);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Resolve a conflict
 */
export const resolveConflict = async (id: string, resolution: 'local' | 'server' | 'merged'): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CONFLICT_LOG], 'readwrite');
    const store = transaction.objectStore(STORES.CONFLICT_LOG);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const record = getRequest.result;
      if (!record) {
        reject(new Error(`Conflict ${id} not found`));
        return;
      }

      const updated = { ...record, resolved: true, resolution };
      const putRequest = store.put(updated);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

/**
 * Clear all data (for logout/reset)
 */
export const clearAllData = async (): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.MUTATIONS, STORES.CACHED_DATA, STORES.CONFLICT_LOG],
      'readwrite'
    );

    transaction.objectStore(STORES.MUTATIONS).clear();
    transaction.objectStore(STORES.CACHED_DATA).clear();
    transaction.objectStore(STORES.CONFLICT_LOG).clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

/**
 * Generate content hash for deduplication
 */
export const generateHash = (data: Record<string, unknown>): string => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
};
