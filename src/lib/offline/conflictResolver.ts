/**
 * Conflict Resolution for Offline-First
 * 
 * Strategies:
 * - Last Write Wins (default)
 * - Server Wins
 * - Local Wins
 * - User Resolution (UI prompt)
 */

import { openCellviDB } from './indexedDB';
import { toast } from 'sonner';

export type ConflictResolution = 'local' | 'server' | 'merged';

export interface Conflict {
  id: string;
  resource: string;
  resourceId: string;
  localVersion: any;
  serverVersion: any;
  detectedAt: number;
  resolvedAt?: number;
  resolution?: ConflictResolution;
}

/**
 * Detect conflict between local and server versions
 */
export async function detectConflict(
  resource: string,
  resourceId: string,
  localData: any,
  serverData: any
): Promise<boolean> {
  // Simple version comparison
  const localVersion = localData.version || localData.lastModified || 0;
  const serverVersion = serverData.version || serverData.updated_at || serverData.lastModified || 0;

  return localVersion > serverVersion;
}

/**
 * Record conflict in IndexedDB
 */
export async function recordConflict(
  resource: string,
  resourceId: string,
  localVersion: any,
  serverVersion: any
): Promise<string> {
  const db = await openCellviDB();

  const conflict: Conflict = {
    id: crypto.randomUUID(),
    resource,
    resourceId,
    localVersion,
    serverVersion,
    detectedAt: Date.now(),
  };

  await db.put('conflicts', conflict);

  console.warn(`[Conflict] Detected for ${resource}:${resourceId}`);

  return conflict.id;
}

/**
 * Resolve conflict with strategy
 */
export async function resolveConflict(
  conflictId: string,
  resolution: ConflictResolution,
  mergedData?: any
): Promise<void> {
  const db = await openCellviDB();
  
  const conflict = await db.get('conflicts', conflictId);
  if (!conflict) throw new Error('Conflict not found');

  let resolvedData;

  switch (resolution) {
    case 'local':
      resolvedData = conflict.localVersion;
      break;
    case 'server':
      resolvedData = conflict.serverVersion;
      break;
    case 'merged':
      resolvedData = mergedData || conflict.serverVersion;
      break;
  }

  // Update conflict record
  await db.put('conflicts', {
    ...conflict,
    resolvedAt: Date.now(),
    resolution,
  });

  console.log(`[Conflict] Resolved ${conflictId} with strategy: ${resolution}`);

  return resolvedData;
}

/**
 * Get unresolved conflicts
 */
export async function getUnresolvedConflicts(): Promise<Conflict[]> {
  const db = await openCellviDB();
  const allConflicts = await db.getAll('conflicts');
  
  return allConflicts.filter(c => !c.resolvedAt);
}

/**
 * Auto-resolve conflicts using Last Write Wins
 */
export async function autoResolveConflicts(): Promise<number> {
  const conflicts = await getUnresolvedConflicts();
  
  for (const conflict of conflicts) {
    // Last Write Wins: Compare timestamps
    const localTime = conflict.localVersion.lastModified || conflict.localVersion.updated_at || 0;
    const serverTime = conflict.serverVersion.lastModified || conflict.serverVersion.updated_at || 0;

    const resolution: ConflictResolution = localTime > serverTime ? 'local' : 'server';
    
    await resolveConflict(conflict.id, resolution);
  }

  if (conflicts.length > 0) {
    toast.info(`${conflicts.length} conflictos resueltos automáticamente`);
  }

  return conflicts.length;
}

/**
 * Clear resolved conflicts older than N days
 */
export async function clearOldConflicts(daysOld: number = 7): Promise<number> {
  const db = await openCellviDB();
  const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  
  const allConflicts = await db.getAll('conflicts');
  const oldConflicts = allConflicts.filter(
    c => c.resolvedAt && c.resolvedAt < cutoffTime
  );

  await Promise.all(
    oldConflicts.map(c => db.delete('conflicts', c.id))
  );

  return oldConflicts.length;
}
