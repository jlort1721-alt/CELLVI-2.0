/**
 * IndexedDB Wrapper for Offline-First Architecture
 *
 * Provides a robust, versioned IndexedDB layer for:
 * - Offline data caching
 * - Mutation queue persistence
 * - Conflict detection
 * - Query result caching
 *
 * @example
 * const db = await openDB();
 * await db.vehicles.put(vehicle);
 * const allVehicles = await db.vehicles.getAll();
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

export interface CellviDB extends DBSchema {
  // Cached data from API
  vehicles: {
    key: string; // UUID
    value: {
      id: string;
      data: any;
      lastModified: number;
      version: number;
      syncedAt?: number;
    };
    indexes: {
      'by-lastModified': number;
      'by-syncedAt': number;
    };
  };

  drivers: {
    key: string;
    value: {
      id: string;
      data: any;
      lastModified: number;
      version: number;
      syncedAt?: number;
    };
    indexes: {
      'by-lastModified': number;
      'by-syncedAt': number;
    };
  };

  trips: {
    key: string;
    value: {
      id: string;
      data: any;
      lastModified: number;
      version: number;
      syncedAt?: number;
    };
    indexes: {
      'by-lastModified': number;
      'by-syncedAt': number;
    };
  };

  workOrders: {
    key: string;
    value: {
      id: string;
      data: any;
      lastModified: number;
      version: number;
      syncedAt?: number;
    };
    indexes: {
      'by-lastModified': number;
      'by-syncedAt': number;
    };
  };

  // Mutation queue for offline operations
  mutationQueue: {
    key: string; // UUID
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      resource: string; // 'vehicles', 'drivers', etc.
      resourceId?: string;
      data: any;
      createdAt: number;
      retryCount: number;
      lastError?: string;
      status: 'pending' | 'processing' | 'failed' | 'synced';
    };
    indexes: {
      'by-status': string;
      'by-createdAt': number;
      'by-resource': string;
    };
  };

  // Conflict tracking
  conflicts: {
    key: string;
    value: {
      id: string;
      resource: string;
      resourceId: string;
      localVersion: any;
      serverVersion: any;
      detectedAt: number;
      resolvedAt?: number;
      resolution?: 'local' | 'server' | 'merged';
    };
    indexes: {
      'by-detectedAt': number;
      'by-resource': string;
    };
  };

  // Query cache for read operations
  queryCache: {
    key: string; // query hash
    value: {
      queryKey: string;
      data: any;
      cachedAt: number;
      expiresAt: number;
    };
    indexes: {
      'by-expiresAt': number;
    };
  };

  // Metadata
  metadata: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'cellvi-offline-db';
const DB_VERSION = 1;

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

let dbInstance: IDBPDatabase<CellviDB> | null = null;

export async function openCellviDB(): Promise<IDBPDatabase<CellviDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<CellviDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`[IndexedDB] Upgrading from version ${oldVersion} to ${newVersion}`);

      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('vehicles')) {
        const vehiclesStore = db.createObjectStore('vehicles', { keyPath: 'id' });
        vehiclesStore.createIndex('by-lastModified', 'lastModified');
        vehiclesStore.createIndex('by-syncedAt', 'syncedAt');
      }

      if (!db.objectStoreNames.contains('drivers')) {
        const driversStore = db.createObjectStore('drivers', { keyPath: 'id' });
        driversStore.createIndex('by-lastModified', 'lastModified');
        driversStore.createIndex('by-syncedAt', 'syncedAt');
      }

      if (!db.objectStoreNames.contains('trips')) {
        const tripsStore = db.createObjectStore('trips', { keyPath: 'id' });
        tripsStore.createIndex('by-lastModified', 'lastModified');
        tripsStore.createIndex('by-syncedAt', 'syncedAt');
      }

      if (!db.objectStoreNames.contains('workOrders')) {
        const workOrdersStore = db.createObjectStore('workOrders', { keyPath: 'id' });
        workOrdersStore.createIndex('by-lastModified', 'lastModified');
        workOrdersStore.createIndex('by-syncedAt', 'syncedAt');
      }

      if (!db.objectStoreNames.contains('mutationQueue')) {
        const queueStore = db.createObjectStore('mutationQueue', { keyPath: 'id' });
        queueStore.createIndex('by-status', 'status');
        queueStore.createIndex('by-createdAt', 'createdAt');
        queueStore.createIndex('by-resource', 'resource');
      }

      if (!db.objectStoreNames.contains('conflicts')) {
        const conflictsStore = db.createObjectStore('conflicts', { keyPath: 'id' });
        conflictsStore.createIndex('by-detectedAt', 'detectedAt');
        conflictsStore.createIndex('by-resource', 'resource');
      }

      if (!db.objectStoreNames.contains('queryCache')) {
        const cacheStore = db.createObjectStore('queryCache', { keyPath: 'queryKey' });
        cacheStore.createIndex('by-expiresAt', 'expiresAt');
      }

      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata');
      }

      console.log('[IndexedDB] Database upgrade complete');
    },
    blocked() {
      console.warn('[IndexedDB] Database upgrade blocked. Close other tabs.');
    },
    blocking() {
      console.warn('[IndexedDB] This connection is blocking a newer version.');
      dbInstance?.close();
      dbInstance = null;
    },
    terminated() {
      console.error('[IndexedDB] Database connection terminated unexpectedly');
      dbInstance = null;
    },
  });

  console.log('[IndexedDB] Database opened successfully');
  return dbInstance;
}

// ============================================================================
// RESOURCE OPERATIONS
// ============================================================================

export async function putResource<T extends keyof CellviDB>(
  store: T,
  id: string,
  data: any,
  version: number = Date.now()
): Promise<void> {
  const db = await openCellviDB();

  await db.put(store as any, {
    id,
    data,
    lastModified: Date.now(),
    version,
    syncedAt: undefined, // Will be set when synced
  });
}

export async function getResource<T extends keyof CellviDB>(
  store: T,
  id: string
): Promise<any | null> {
  const db = await openCellviDB();
  const record = await db.get(store as any, id);
  return record?.data || null;
}

export async function getAllResources<T extends keyof CellviDB>(
  store: T
): Promise<any[]> {
  const db = await openCellviDB();
  const records = await db.getAll(store as any);
  return records.map(r => r.data);
}

export async function deleteResource<T extends keyof CellviDB>(
  store: T,
  id: string
): Promise<void> {
  const db = await openCellviDB();
  await db.delete(store as any, id);
}

export async function clearStore<T extends keyof CellviDB>(
  store: T
): Promise<void> {
  const db = await openCellviDB();
  await db.clear(store as any);
}

// ============================================================================
// QUERY CACHE OPERATIONS
// ============================================================================

export async function cacheQuery(
  queryKey: string,
  data: any,
  ttlMs: number = 5 * 60 * 1000 // 5 minutes default
): Promise<void> {
  const db = await openCellviDB();
  const now = Date.now();

  await db.put('queryCache', {
    queryKey,
    data,
    cachedAt: now,
    expiresAt: now + ttlMs,
  });
}

export async function getCachedQuery(
  queryKey: string
): Promise<any | null> {
  const db = await openCellviDB();
  const cached = await db.get('queryCache', queryKey);

  if (!cached) return null;

  // Check if expired
  if (cached.expiresAt < Date.now()) {
    await db.delete('queryCache', queryKey);
    return null;
  }

  return cached.data;
}

export async function invalidateQueryCache(
  pattern?: string
): Promise<void> {
  const db = await openCellviDB();

  if (!pattern) {
    // Clear all cache
    await db.clear('queryCache');
    return;
  }

  // Clear matching queries
  const allKeys = await db.getAllKeys('queryCache');
  const keysToDelete = allKeys.filter(key =>
    typeof key === 'string' && key.includes(pattern)
  );

  await Promise.all(
    keysToDelete.map(key => db.delete('queryCache', key))
  );
}

// ============================================================================
// CLEANUP OPERATIONS
// ============================================================================

/**
 * Remove expired cache entries
 */
export async function cleanupExpiredCache(): Promise<number> {
  const db = await openCellviDB();
  const now = Date.now();

  const tx = db.transaction('queryCache', 'readwrite');
  const index = tx.store.index('by-expiresAt');

  let deletedCount = 0;
  let cursor = await index.openCursor(IDBKeyRange.upperBound(now));

  while (cursor) {
    await cursor.delete();
    deletedCount++;
    cursor = await cursor.continue();
  }

  await tx.done;

  if (deletedCount > 0) {
    console.log(`[IndexedDB] Cleaned up ${deletedCount} expired cache entries`);
  }

  return deletedCount;
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  vehicles: number;
  drivers: number;
  trips: number;
  workOrders: number;
  pendingMutations: number;
  conflicts: number;
  cacheSize: number;
  totalSize: number;
}> {
  const db = await openCellviDB();

  const [vehicles, drivers, trips, workOrders, mutations, conflicts, cache] = await Promise.all([
    db.count('vehicles'),
    db.count('drivers'),
    db.count('trips'),
    db.count('workOrders'),
    db.countFromIndex('mutationQueue', 'by-status', 'pending'),
    db.count('conflicts'),
    db.count('queryCache'),
  ]);

  return {
    vehicles,
    drivers,
    trips,
    workOrders,
    pendingMutations: mutations,
    conflicts,
    cacheSize: cache,
    totalSize: vehicles + drivers + trips + workOrders + mutations + conflicts + cache,
  };
}

/**
 * Export all data for debugging
 */
export async function exportDatabase(): Promise<any> {
  const db = await openCellviDB();

  const [vehicles, drivers, trips, workOrders, mutations, conflicts, cache] = await Promise.all([
    db.getAll('vehicles'),
    db.getAll('drivers'),
    db.getAll('trips'),
    db.getAll('workOrders'),
    db.getAll('mutationQueue'),
    db.getAll('conflicts'),
    db.getAll('queryCache'),
  ]);

  return {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      vehicles,
      drivers,
      trips,
      workOrders,
      mutations,
      conflicts,
      cache,
    },
  };
}

/**
 * Clear all data (use with caution!)
 */
export async function clearAllData(): Promise<void> {
  const db = await openCellviDB();

  await Promise.all([
    db.clear('vehicles'),
    db.clear('drivers'),
    db.clear('trips'),
    db.clear('workOrders'),
    db.clear('mutationQueue'),
    db.clear('conflicts'),
    db.clear('queryCache'),
    db.clear('metadata'),
  ]);

  console.log('[IndexedDB] All data cleared');
}

// ============================================================================
// METADATA OPERATIONS
// ============================================================================

export async function setMetadata(key: string, value: any): Promise<void> {
  const db = await openCellviDB();
  await db.put('metadata', value, key);
}

export async function getMetadata(key: string): Promise<any | null> {
  const db = await openCellviDB();
  return (await db.get('metadata', key)) || null;
}

// Initialize cleanup on module load
if (typeof window !== 'undefined') {
  // Clean up expired cache every 5 minutes
  setInterval(() => {
    cleanupExpiredCache().catch(console.error);
  }, 5 * 60 * 1000);
}
