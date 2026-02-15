/**
 * Mutation Queue Manager
 * Handles queuing, processing, and retry logic for offline mutations
 */

import {
  addMutation,
  getPendingMutations,
  updateMutationStatus,
  deleteMutation,
  generateHash,
  type MutationRecord,
} from './indexedDB';
import { useSyncStatusStore } from '@/stores/syncStatusStore';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // Exponential backoff: 1s, 5s, 15s

/**
 * Queue a mutation for offline processing
 */
export const queueMutation = async (
  type: 'create' | 'update' | 'delete',
  entity: string,
  data: Record<string, unknown>,
  options: {
    entityId?: string;
    userId: string;
    priority?: number;
  }
): Promise<string> => {
  const { entityId, userId, priority = 5 } = options;

  const hash = generateHash({ type, entity, entityId, data });

  const mutationId = await addMutation({
    type,
    entity,
    entityId,
    data,
    userId,
    hash,
    priority,
  });

  // Add to sync status store for UI tracking
  useSyncStatusStore.getState().addOperation({
    type,
    entity,
  });

  return mutationId;
};

/**
 * Process pending mutations queue
 * Returns number of successfully processed mutations
 */
export const processPendingQueue = async (): Promise<number> => {
  const pending = await getPendingMutations();

  if (pending.length === 0) {
    return 0;
  }

  useSyncStatusStore.getState().startSync();
  let successCount = 0;

  for (const mutation of pending) {
    try {
      await processMutation(mutation);
      successCount++;
    } catch (error) {
      console.error(`Failed to process mutation ${mutation.id}:`, error);
    }
  }

  useSyncStatusStore.getState().endSync();

  return successCount;
};

/**
 * Process a single mutation
 */
const processMutation = async (mutation: MutationRecord): Promise<void> => {
  // Mark as syncing
  await updateMutationStatus(mutation.id, { status: 'syncing' });

  // Update UI
  useSyncStatusStore.getState().updateOperation(mutation.id, {
    status: 'syncing',
  });

  try {
    // Execute the mutation
    await executeMutation(mutation);

    // Mark as success and remove from queue
    await deleteMutation(mutation.id);

    // Update UI
    useSyncStatusStore.getState().updateOperation(mutation.id, {
      status: 'success',
    });

    // Clean up after 5 seconds
    setTimeout(() => {
      useSyncStatusStore.getState().removeOperation(mutation.id);
    }, 5000);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if we should retry
    if (mutation.retryCount < MAX_RETRIES) {
      // Schedule retry with exponential backoff
      const delay = RETRY_DELAYS[mutation.retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];

      await updateMutationStatus(mutation.id, {
        status: 'pending',
        retryCount: mutation.retryCount + 1,
        error: errorMessage,
      });

      // Update UI
      useSyncStatusStore.getState().updateOperation(mutation.id, {
        status: 'pending',
        retryCount: mutation.retryCount + 1,
        error: errorMessage,
      });

      // Schedule retry
      setTimeout(() => {
        processMutation(mutation);
      }, delay);
    } else {
      // Max retries reached, mark as error
      await updateMutationStatus(mutation.id, {
        status: 'error',
        error: errorMessage,
      });

      // Update UI
      useSyncStatusStore.getState().updateOperation(mutation.id, {
        status: 'error',
        error: errorMessage,
      });
    }

    throw error;
  }
};

/**
 * Execute mutation against API
 * This function will be integrated with Supabase client
 */
const executeMutation = async (mutation: MutationRecord): Promise<void> => {
  // Dynamic import to avoid circular dependencies
  const { supabase } = await import('@/integrations/supabase/client');

  const { type, entity, entityId, data } = mutation;

  switch (type) {
    case 'create':
      const { error: createError } = await supabase.from(entity).insert(data);
      if (createError) throw createError;
      break;

    case 'update':
      if (!entityId) throw new Error('entityId required for update');
      const { error: updateError } = await supabase
        .from(entity)
        .update(data)
        .eq('id', entityId);
      if (updateError) throw updateError;
      break;

    case 'delete':
      if (!entityId) throw new Error('entityId required for delete');
      const { error: deleteError } = await supabase
        .from(entity)
        .delete()
        .eq('id', entityId);
      if (deleteError) throw deleteError;
      break;

    default:
      throw new Error(`Unknown mutation type: ${type}`);
  }
};

/**
 * Get queue status
 */
export const getQueueStatus = async () => {
  const pending = await getPendingMutations();

  return {
    total: pending.length,
    byEntity: pending.reduce((acc, m) => {
      acc[m.entity] = (acc[m.entity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStatus: pending.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    highPriority: pending.filter((m) => m.priority >= 8).length,
  };
};

/**
 * Clear failed mutations (for manual intervention)
 */
export const clearFailedMutations = async (): Promise<number> => {
  const pending = await getPendingMutations();
  const failed = pending.filter((m) => m.status === 'error');

  for (const mutation of failed) {
    await deleteMutation(mutation.id);
    useSyncStatusStore.getState().removeOperation(mutation.id);
  }

  return failed.length;
};

/**
 * Retry all failed mutations
 */
export const retryFailedMutations = async (): Promise<number> => {
  const pending = await getPendingMutations();
  const failed = pending.filter((m) => m.status === 'error');

  for (const mutation of failed) {
    // Reset retry count and status
    await updateMutationStatus(mutation.id, {
      status: 'pending',
      retryCount: 0,
      error: undefined,
    });
  }

  // Process queue
  return processPendingQueue();
};
