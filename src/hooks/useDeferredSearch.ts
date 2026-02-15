/**
 * Deferred Search Hook
 * Uses React 18's useTransition for non-blocking search updates
 * Combines debouncing with transition for optimal UX
 */

import { useState, useTransition, useEffect, useCallback } from 'react';

export interface UseDeferredSearchOptions {
  debounceMs?: number;
  minLength?: number;
}

export interface UseDeferredSearchReturn {
  query: string;
  deferredQuery: string;
  isPending: boolean;
  setQuery: (value: string) => void;
  clear: () => void;
}

/**
 * Hook for deferred search with debouncing and transitions
 *
 * @example
 * const { query, deferredQuery, isPending, setQuery } = useDeferredSearch({
 *   debounceMs: 300,
 *   minLength: 2
 * });
 *
 * // In render:
 * <input value={query} onChange={(e) => setQuery(e.target.value)} />
 * {isPending && <Spinner />}
 * <ResultsList query={deferredQuery} />
 */
export const useDeferredSearch = (
  options: UseDeferredSearchOptions = {}
): UseDeferredSearchReturn => {
  const { debounceMs = 300, minLength = 0 } = options;

  const [query, setQuery] = useState('');
  const [deferredQuery, setDeferredQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // If query doesn't meet minimum length, clear deferred query immediately
    if (query.length < minLength && query.length > 0) {
      setDeferredQuery('');
      return;
    }

    // Debounce the update to deferredQuery
    const timeoutId = setTimeout(() => {
      startTransition(() => {
        setDeferredQuery(query);
      });
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs, minLength]);

  const clear = useCallback(() => {
    setQuery('');
    setDeferredQuery('');
  }, []);

  return {
    query,
    deferredQuery,
    isPending,
    setQuery,
    clear,
  };
};

/**
 * Simpler version without debouncing, just transition
 */
export const useTransitionSearch = () => {
  const [query, setQuery] = useState('');
  const [deferredQuery, setDeferredQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const updateQuery = useCallback((value: string) => {
    setQuery(value);
    startTransition(() => {
      setDeferredQuery(value);
    });
  }, []);

  return {
    query,
    deferredQuery,
    isPending,
    setQuery: updateQuery,
  };
};
