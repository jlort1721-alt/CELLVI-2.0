/**
 * Conflict Resolution Manager
 * Handles conflicts when local and server versions diverge
 */

import {
  logConflict,
  getUnresolvedConflicts,
  resolveConflict as resolveConflictDB,
  type ConflictRecord,
} from './indexedDB';

export type ResolutionStrategy = 'local' | 'server' | 'merged' | 'prompt';

/**
 * Detect if a conflict exists
 */
export const detectConflict = (
  localVersion: number,
  serverVersion: number,
  localData: Record<string, unknown>,
  serverData: Record<string, unknown>
): boolean => {
  // If versions differ and data is different, we have a conflict
  if (localVersion === serverVersion) return false;

  // Quick check: if data is identical, no real conflict
  const localStr = JSON.stringify(localData);
  const serverStr = JSON.stringify(serverData);

  return localStr !== serverStr;
};

/**
 * Automatic conflict resolution based on strategy
 */
export const resolveConflict = async (
  mutationId: string,
  entity: string,
  entityId: string,
  localVersion: number,
  serverVersion: number,
  localData: Record<string, unknown>,
  serverData: Record<string, unknown>,
  strategy: ResolutionStrategy = 'server' // Default: server wins
): Promise<{
  resolution: 'local' | 'server' | 'merged';
  data: Record<string, unknown>;
}> => {
  // Log the conflict first
  const conflictId = await logConflict({
    mutationId,
    entity,
    entityId,
    localVersion,
    serverVersion,
    localData,
    serverData,
  });

  let resolution: 'local' | 'server' | 'merged';
  let data: Record<string, unknown>;

  switch (strategy) {
    case 'local':
      // Local wins - use local data
      resolution = 'local';
      data = localData;
      break;

    case 'server':
      // Server wins - use server data (safest default)
      resolution = 'server';
      data = serverData;
      break;

    case 'merged':
      // Attempt automatic merge
      const merged = attemptAutoMerge(localData, serverData);
      resolution = 'merged';
      data = merged;
      break;

    case 'prompt':
      // Should prompt user - for now, fallback to server
      // In UI component, this would show a dialog
      resolution = 'server';
      data = serverData;
      break;

    default:
      resolution = 'server';
      data = serverData;
  }

  // Mark conflict as resolved
  await resolveConflictDB(conflictId, resolution);

  return { resolution, data };
};

/**
 * Attempt automatic merge of local and server data
 * Strategy: Last-write-wins per field
 */
const attemptAutoMerge = (
  localData: Record<string, unknown>,
  serverData: Record<string, unknown>
): Record<string, unknown> => {
  const merged: Record<string, unknown> = { ...serverData };

  // For each field in local data
  for (const [key, value] of Object.entries(localData)) {
    // If server doesn't have this field, add it
    if (!(key in serverData)) {
      merged[key] = value;
      continue;
    }

    // If values are different, prefer newer timestamp if available
    if (value !== serverData[key]) {
      // Check for timestamp fields
      const localTimestamp = getTimestamp(localData, key);
      const serverTimestamp = getTimestamp(serverData, key);

      if (localTimestamp && serverTimestamp) {
        // Use newer value
        merged[key] = localTimestamp > serverTimestamp ? value : serverData[key];
      } else {
        // No timestamps - use server value (safer)
        merged[key] = serverData[key];
      }
    }
  }

  return merged;
};

/**
 * Get timestamp for a field if it exists
 */
const getTimestamp = (data: Record<string, unknown>, field: string): number | null => {
  // Check common timestamp field patterns
  const timestampFields = [
    `${field}_updated_at`,
    `${field}_timestamp`,
    'updated_at',
    'modified_at',
    'timestamp',
  ];

  for (const tsField of timestampFields) {
    if (tsField in data) {
      const value = data[tsField];
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = Date.parse(value);
        if (!isNaN(parsed)) return parsed;
      }
    }
  }

  return null;
};

/**
 * Get all unresolved conflicts for UI display
 */
export const getConflicts = async (): Promise<ConflictRecord[]> => {
  return getUnresolvedConflicts();
};

/**
 * Check if entity has compatible changes (can auto-merge)
 * Returns true if changes don't overlap
 */
export const areChangesCompatible = (
  localData: Record<string, unknown>,
  serverData: Record<string, unknown>,
  baseData: Record<string, unknown>
): boolean => {
  const localChanges = new Set<string>();
  const serverChanges = new Set<string>();

  // Detect local changes
  for (const [key, value] of Object.entries(localData)) {
    if (value !== baseData[key]) {
      localChanges.add(key);
    }
  }

  // Detect server changes
  for (const [key, value] of Object.entries(serverData)) {
    if (value !== baseData[key]) {
      serverChanges.add(key);
    }
  }

  // Check for overlapping changes
  for (const field of localChanges) {
    if (serverChanges.has(field)) {
      // Same field changed on both sides
      if (localData[field] !== serverData[field]) {
        return false; // Conflict
      }
    }
  }

  return true; // Compatible
};

/**
 * Generate conflict summary for UI
 */
export const summarizeConflict = (conflict: ConflictRecord): {
  entity: string;
  entityId: string;
  conflictingFields: string[];
  localChanges: number;
  serverChanges: number;
  canAutoMerge: boolean;
} => {
  const conflictingFields: string[] = [];
  let localChanges = 0;
  let serverChanges = 0;

  for (const key of Object.keys(conflict.localData)) {
    const localValue = conflict.localData[key];
    const serverValue = conflict.serverData[key];

    if (localValue !== serverValue) {
      conflictingFields.push(key);
    }
  }

  // Count total changes
  localChanges = Object.keys(conflict.localData).length;
  serverChanges = Object.keys(conflict.serverData).length;

  // Check if can auto-merge
  const canAutoMerge = conflictingFields.length === 0;

  return {
    entity: conflict.entity,
    entityId: conflict.entityId,
    conflictingFields,
    localChanges,
    serverChanges,
    canAutoMerge,
  };
};

/**
 * Resolve conflict with user choice
 */
export const resolveWithUserChoice = async (
  conflictId: string,
  choice: 'local' | 'server' | 'merged',
  mergedData?: Record<string, unknown>
): Promise<void> => {
  await resolveConflictDB(conflictId, choice);

  // If merged and data provided, could save to cache here
  // For now, just mark as resolved
};
