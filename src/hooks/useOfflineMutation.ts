/**
 * Offline-First Mutation Hook
 * Wraps React Query's useMutation with offline queue support
 */

import { useMutation, useQueryClient, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queueMutation } from '@/lib/offline/mutationQueue';
import { useSyncStatusStore } from '@/stores/syncStatusStore';

export interface OfflineMutationOptions<TData, TVariables> extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  entity: string;
  getEntityId?: (variables: TVariables) => string | undefined;
  priority?: number;
  optimisticUpdate?: (variables: TVariables) => TData | void;
}

/**
 * Hook that queues mutations for offline processing
 *
 * @example
 * const createVehicle = useOfflineMutation({
 *   mutationFn: (vehicle) => supabase.from('vehicles').insert(vehicle),
 *   entity: 'vehicles',
 *   onSuccess: () => queryClient.invalidateQueries(['vehicles']),
 *   optimisticUpdate: (vehicle) => vehicle, // Optional optimistic data
 * });
 */
export const useOfflineMutation = <TData = unknown, TVariables = unknown>(
  options: OfflineMutationOptions<TData, TVariables>
): UseMutationResult<TData, Error, TVariables> => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isOnline } = useSyncStatusStore();

  const {
    mutationFn,
    entity,
    getEntityId,
    priority = 5,
    optimisticUpdate,
    onMutate,
    onSuccess,
    onError,
    onSettled,
    ...restOptions
  } = options;

  return useMutation<TData, Error, TVariables>({
    ...restOptions,

    mutationFn: async (variables) => {
      // If offline, queue the mutation
      if (!isOnline) {
        const entityId = getEntityId ? getEntityId(variables) : undefined;

        await queueMutation(
          entityId ? 'update' : 'create',
          entity,
          variables as Record<string, unknown>,
          {
            entityId,
            userId: user?.id || 'unknown',
            priority,
          }
        );

        // Return optimistic data if provided
        if (optimisticUpdate) {
          const optimisticData = optimisticUpdate(variables);
          if (optimisticData) {
            return optimisticData as TData;
          }
        }

        // Return a placeholder response for offline mutations
        return { id: 'offline', ...variables } as TData;
      }

      // If online, execute normally
      return mutationFn(variables);
    },

    onMutate: async (variables) => {
      // Call user's onMutate if provided
      const context = onMutate ? await onMutate(variables) : undefined;

      // If optimistic update provided, apply it
      if (optimisticUpdate && options.queryKey) {
        await queryClient.cancelQueries({ queryKey: options.queryKey as unknown[] });

        const previousData = queryClient.getQueryData(options.queryKey as unknown[]);

        const optimisticData = optimisticUpdate(variables);
        if (optimisticData) {
          queryClient.setQueryData(options.queryKey as unknown[], optimisticData);
        }

        return { ...context, previousData };
      }

      return context;
    },

    onSuccess: (data, variables, context) => {
      // Call user's onSuccess if provided
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },

    onError: (error, variables, context) => {
      // Rollback optimistic update if it exists
      if (context && 'previousData' in context && options.queryKey) {
        queryClient.setQueryData(
          options.queryKey as unknown[],
          (context as { previousData: unknown }).previousData
        );
      }

      // Call user's onError if provided
      if (onError) {
        onError(error, variables, context);
      }
    },

    onSettled: (data, error, variables, context) => {
      // Call user's onSettled if provided
      if (onSettled) {
        onSettled(data, error, variables, context);
      }
    },
  });
};

/**
 * Hook for delete mutations with offline support
 */
export const useOfflineDeleteMutation = <TData = unknown, TVariables = { id: string }>(
  options: Omit<OfflineMutationOptions<TData, TVariables>, 'getEntityId'> & {
    getEntityId: (variables: TVariables) => string;
  }
): UseMutationResult<TData, Error, TVariables> => {
  const { user } = useAuth();
  const { isOnline } = useSyncStatusStore();

  const { mutationFn, entity, getEntityId, priority = 5, ...restOptions } = options;

  return useMutation<TData, Error, TVariables>({
    ...restOptions,
    mutationFn: async (variables) => {
      if (!isOnline) {
        const entityId = getEntityId(variables);

        await queueMutation(
          'delete',
          entity,
          {} as Record<string, unknown>,
          {
            entityId,
            userId: user?.id || 'unknown',
            priority,
          }
        );

        return { success: true } as TData;
      }

      return mutationFn(variables);
    },
  });
};
