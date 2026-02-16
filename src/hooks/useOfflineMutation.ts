/**
 * Offline Mutation Hook
 * 
 * Wraps useMutation with offline support:
 * - Queues mutations when offline
 * - Optimistic UI updates
 * - Auto-sync when online
 * - Conflict detection
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { queueMutation } from '@/lib/offline/mutationQueue';
import { detectConflict, recordConflict } from '@/lib/offline/conflictResolver';
import { putResource } from '@/lib/offline/indexedDB';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from 'sonner';

interface OfflineMutationOptions<TData, TVariables> extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  resourceType: 'vehicles' | 'drivers' | 'trips' | 'workOrders';
  optimisticData?: (variables: TVariables) => any;
}

export function useOfflineMutation<TData = unknown, TVariables = unknown>(
  options: OfflineMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      // If offline, queue the mutation
      if (!isOnline) {
        const mutationId = await queueMutation(
          'create', // or detect from variables
          options.resourceType,
          variables as any
        );

        // Store optimistic data in IndexedDB
        if (options.optimisticData) {
          const optimisticItem = options.optimisticData(variables);
          await putResource(
            options.resourceType,
            optimisticItem.id,
            optimisticItem
          );
        }

        toast.info('Sin conexión. Se sincronizará cuando vuelva la red.');

        // Return optimistic data
        return (options.optimisticData?.(variables) || {}) as TData;
      }

      // If online, execute normally
      return options.mutationFn(variables);
    },

    onMutate: async (variables) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: [options.resourceType] });

      // Snapshot previous value
      const previous = queryClient.getQueryData([options.resourceType]);

      // Optimistic update
      if (options.optimisticData) {
        const optimisticItem = options.optimisticData(variables);
        
        queryClient.setQueryData([options.resourceType], (old: any) => {
          if (Array.isArray(old)) {
            return [...old, optimisticItem];
          }
          return [optimisticItem];
        });
      }

      // Call user's onMutate if provided
      if (options.onMutate) {
        const userContext = await options.onMutate(variables);
        return { previous, ...userContext };
      }

      return { previous };
    },

    onError: (error, variables, context: any) => {
      // Rollback optimistic update
      if (context?.previous) {
        queryClient.setQueryData([options.resourceType], context.previous);
      }

      // Detect conflict
      if (error.message?.includes('conflict') || error.message?.includes('version')) {
        toast.error('Conflicto detectado. Por favor, recarga los datos.');
      } else {
        toast.error('Error al guardar cambios');
      }

      // Call user's onError if provided
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },

    onSuccess: (data, variables, context) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: [options.resourceType] });

      toast.success('Cambios guardados exitosamente');

      // Call user's onSuccess if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },

    // Pass through other options
    ...options,
  });
}

/**
 * Hook for update mutations with conflict detection
 */
export function useOfflineUpdate<TData = unknown, TVariables = unknown>(
  options: OfflineMutationOptions<TData, TVariables> & {
    getLocalVersion: (id: string) => Promise<any>;
  }
) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: any) => {
      if (!isOnline) {
        await queueMutation('update', options.resourceType, variables, variables.id);
        toast.info('Sin conexión. Se sincronizará cuando vuelva la red.');
        return variables as TData;
      }

      // Check for conflicts before updating
      const localVersion = await options.getLocalVersion(variables.id);
      const serverData = await options.mutationFn(variables);

      if (localVersion) {
        const hasConflict = await detectConflict(
          options.resourceType,
          variables.id,
          localVersion,
          serverData
        );

        if (hasConflict) {
          await recordConflict(
            options.resourceType,
            variables.id,
            localVersion,
            serverData
          );
          toast.warning('Conflicto detectado. Revisa los cambios.');
        }
      }

      return serverData;
    },

    onMutate: options.onMutate,
    onError: options.onError,
    onSuccess: options.onSuccess,
  });
}
