/**
 * Progress Announcer Component
 * Announces loading/progress states to screen readers
 * WCAG 2.1 Success Criterion 4.1.3 (Status Messages)
 */

import React, { useEffect } from 'react';
import { announce } from './LiveRegion';

interface ProgressAnnouncerProps {
  isLoading?: boolean;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  progress?: number; // 0-100
  announceProgress?: boolean;
}

export const ProgressAnnouncer: React.FC<ProgressAnnouncerProps> = ({
  isLoading = false,
  loadingMessage = 'Cargando...',
  successMessage = 'Carga completada',
  errorMessage,
  progress,
  announceProgress = false,
}) => {
  // Announce loading start
  useEffect(() => {
    if (isLoading) {
      announce(loadingMessage, 'polite');
    }
  }, [isLoading, loadingMessage]);

  // Announce progress milestones
  useEffect(() => {
    if (announceProgress && progress !== undefined && isLoading) {
      // Announce at 25%, 50%, 75%, 100%
      if ([25, 50, 75, 100].includes(progress)) {
        announce(`Progreso: ${progress}%`, 'polite');
      }
    }
  }, [progress, announceProgress, isLoading]);

  // Announce completion or error
  useEffect(() => {
    if (!isLoading) {
      if (errorMessage) {
        announce(errorMessage, 'assertive');
      } else if (successMessage) {
        announce(successMessage, 'polite');
      }
    }
  }, [isLoading, successMessage, errorMessage]);

  return null; // This component only announces, doesn't render
};

/**
 * Hook for announcing query states
 */
export const useQueryAnnouncer = (
  queryState: {
    isLoading?: boolean;
    isError?: boolean;
    error?: Error | null;
  },
  messages: {
    loading?: string;
    success?: string;
    error?: string;
  } = {}
) => {
  const {
    loading = 'Cargando datos...',
    success = 'Datos cargados correctamente',
    error = 'Error al cargar datos',
  } = messages;

  // Announce loading start
  useEffect(() => {
    try {
      if (queryState?.isLoading) {
        announce(loading, 'polite');
      }
    } catch (err) {
      console.warn('[useQueryAnnouncer] Error announcing loading state:', err);
    }
  }, [queryState?.isLoading, loading]);

  // Announce completion or error
  useEffect(() => {
    try {
      if (!queryState?.isLoading) {
        if (queryState?.isError) {
          announce(`${error}: ${queryState.error?.message || 'Error desconocido'}`, 'assertive');
        } else {
          announce(success, 'polite');
        }
      }
    } catch (err) {
      console.warn('[useQueryAnnouncer] Error announcing completion state:', err);
    }
  }, [queryState?.isLoading, queryState?.isError, success, error, queryState?.error]);
};

/**
 * Hook for announcing mutation states
 */
export const useMutationAnnouncer = (
  mutationState: {
    isPending?: boolean;
    isSuccess?: boolean;
    isError?: boolean;
    error?: Error | null;
  },
  messages: {
    pending?: string;
    success?: string;
    error?: string;
  } = {}
) => {
  const {
    pending = 'Guardando...',
    success = 'Guardado exitosamente',
    error = 'Error al guardar',
  } = messages;

  useEffect(() => {
    if (mutationState.isPending) {
      announce(pending, 'polite');
    }
  }, [mutationState.isPending, pending]);

  useEffect(() => {
    if (mutationState.isSuccess) {
      announce(success, 'polite');
    }
  }, [mutationState.isSuccess, success]);

  useEffect(() => {
    if (mutationState.isError) {
      announce(`${error}: ${mutationState.error?.message}`, 'assertive');
    }
  }, [mutationState.isError, error, mutationState.error]);
};
