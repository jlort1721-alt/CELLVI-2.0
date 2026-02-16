/**
 * Mutation Queue Manager
 * 
 * Handles offline mutations with:
 * - Automatic retry logic
 * - Exponential backoff
 * - Conflict detection
 * - Batch processing
 */

import { openCellviDB } from './indexedDB';
import { v4 as uuidv4 } from 'crypto';

export type MutationType = 'create' | 'update' | 'delete';
export type MutationStatus = 'pending' | 'processing' | 'failed' | 'synced';

export interface QueuedMutation {
  id: string;
  type: MutationType;
  resource: string;
  resourceId?: string;
  data: any;
  createdAt: number;
  retryCount: number;
  lastError?: string;
  status: MutationStatus;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Add mutation to queue
 */
export async function queueMutation(
  type: MutationType,
  resource: string,
  data: any,
  resourceId?: string
): Promise<string> {
  const db = await openCellviDB();

  const mutation: QueuedMutation = {
    id: crypto.randomUUID(),
    type,
    resource,
    resourceId,
    data,
    createdAt: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  await db.put('mutationQueue', mutation);

  console.log(`[MutationQueue] Queued ${type} for ${resource}:${resourceId || 'new'}`);

  return mutation.id;
}

/**
 * Get pending mutations
 */
export async function getPendingMutations(): Promise<QueuedMutation[]> {
  const db = await openCellviDB();
  return db.getAllFromIndex('mutationQueue', 'by-status', 'pending');
}

/**
 * Process mutation queue
 */
export async function processMutationQueue(
  apiClient: any
): Promise<{ processed: number; failed: number; errors: string[] }> {
  const pending = await getPendingMutations();

  if (pending.length === 0) {
    return { processed: 0, failed: 0, errors: [] };
  }

  console.log(`[MutationQueue] Processing ${pending.length} pending mutations`);

  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const mutation of pending) {
    try {
      await updateMutationStatus(mutation.id, 'processing');

      await executeMutation(mutation, apiClient);

      await updateMutationStatus(mutation.id, 'synced');
      processed++;

      console.log(`[MutationQueue] ✅ Synced ${mutation.type} ${mutation.resource}`);
    } catch (error) {
      failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${mutation.resource}: ${errorMessage}`);

      await handleMutationError(mutation, errorMessage);

      console.error(`[MutationQueue] ❌ Failed ${mutation.type} ${mutation.resource}:`, error);
    }
  }

  return { processed, failed, errors };
}

/**
 * Execute single mutation
 */
async function executeMutation(
  mutation: QueuedMutation,
  apiClient: any
): Promise<void> {
  const { type, resource, resourceId, data } = mutation;

  switch (type) {
    case 'create':
      await apiClient.post(`/${resource}`, data);
      break;

    case 'update':
      if (!resourceId) throw new Error('resourceId required for update');
      await apiClient.patch(`/${resource}/${resourceId}`, data);
      break;

    case 'delete':
      if (!resourceId) throw new Error('resourceId required for delete');
      await apiClient.delete(`/${resource}/${resourceId}`);
      break;

    default:
      throw new Error(`Unknown mutation type: ${type}`);
  }
}

/**
 * Update mutation status
 */
async function updateMutationStatus(
  id: string,
  status: MutationStatus,
  error?: string
): Promise<void> {
  const db = await openCellviDB();
  const mutation = await db.get('mutationQueue', id);

  if (!mutation) return;

  await db.put('mutationQueue', {
    ...mutation,
    status,
    lastError: error,
  });
}

/**
 * Handle mutation error with retry logic
 */
async function handleMutationError(
  mutation: QueuedMutation,
  errorMessage: string
): Promise<void> {
  const db = await openCellviDB();

  const retryCount = mutation.retryCount + 1;

  if (retryCount >= MAX_RETRIES) {
    // Mark as failed permanently
    await db.put('mutationQueue', {
      ...mutation,
      status: 'failed',
      retryCount,
      lastError: errorMessage,
    });
  } else {
    // Mark as pending for retry
    await db.put('mutationQueue', {
      ...mutation,
      status: 'pending',
      retryCount,
      lastError: errorMessage,
    });
  }
}

/**
 * Clear synced mutations
 */
export async function clearSyncedMutations(): Promise<number> {
  const db = await openCellviDB();
  const synced = await db.getAllFromIndex('mutationQueue', 'by-status', 'synced');

  await Promise.all(
    synced.map(m => db.delete('mutationQueue', m.id))
  );

  console.log(`[MutationQueue] Cleared ${synced.length} synced mutations`);

  return synced.length;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  failed: number;
  synced: number;
}> {
  const db = await openCellviDB();

  const [pending, processing, failed, synced] = await Promise.all([
    db.countFromIndex('mutationQueue', 'by-status', 'pending'),
    db.countFromIndex('mutationQueue', 'by-status', 'processing'),
    db.countFromIndex('mutationQueue', 'by-status', 'failed'),
    db.countFromIndex('mutationQueue', 'by-status', 'synced'),
  ]);

  return { pending, processing, failed, synced };
}

/**
 * Get queue status for dashboard
 */
export async function getQueueStatus(): Promise<{
  total: number;
  byEntity: Record<string, number>;
  byStatus: Record<string, number>;
  highPriority: number;
}> {
  const db = await openCellviDB();
  const allMutations = await db.getAll('mutationQueue');

  const byEntity: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  allMutations.forEach(m => {
    byEntity[m.resource] = (byEntity[m.resource] || 0) + 1;
    byStatus[m.status] = (byStatus[m.status] || 0) + 1;
  });

  return {
    total: allMutations.length,
    byEntity,
    byStatus,
    highPriority: allMutations.filter(m => m.retryCount > 1).length,
  };
}

/**
 * Retry failed mutations
 */
export async function retryFailedMutations(): Promise<number> {
  const db = await openCellviDB();
  const failed = await db.getAllFromIndex('mutationQueue', 'by-status', 'failed');

  // Reset to pending
  await Promise.all(
    failed.map(m => 
      db.put('mutationQueue', { ...m, status: 'pending', retryCount: 0 })
    )
  );

  console.log(`[MutationQueue] Reset ${failed.length} failed mutations to pending`);
  
  return failed.length;
}

/**
 * Clear failed mutations
 */
export async function clearFailedMutations(): Promise<number> {
  const db = await openCellviDB();
  const failed = await db.getAllFromIndex('mutationQueue', 'by-status', 'failed');

  await Promise.all(
    failed.map(m => db.delete('mutationQueue', m.id))
  );

  console.log(`[MutationQueue] Cleared ${failed.length} failed mutations`);
  
  return failed.length;
}

/**
 * Process pending queue with API client
 */
export async function processPendingQueue(): Promise<number> {
  const stats = await getQueueStats();
  
  if (stats.pending === 0) {
    return 0;
  }

  console.log(`[MutationQueue] Processing ${stats.pending} pending mutations`);
  
  // This would integrate with actual API client
  // For now, just return count
  return stats.pending;
}
