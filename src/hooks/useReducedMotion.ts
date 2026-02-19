import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Detect whether the user prefers reduced motion via OS accessibility settings.
 * Listens for changes to `prefers-reduced-motion` and updates reactively.
 *
 * @returns `true` if the user has enabled reduced motion, `false` otherwise.
 *
 * @example
 * const reduceMotion = useReducedMotion();
 * const transition = reduceMotion ? 'none' : 'transform 0.3s ease';
 */
export function useReducedMotion(): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return matches;
}
