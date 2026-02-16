/**
 * Live Region for Screen Readers
 * WCAG 2.1 requirement for dynamic content announcements
 */

import { create } from 'zustand';

interface LiveRegionStore {
  message: string;
  announce: (message: string) => void;
}

export const useLiveRegion = create<LiveRegionStore>((set) => ({
  message: '',
  announce: (message: string) => {
    set({ message });
    // Clear after announcement
    setTimeout(() => set({ message: '' }), 1000);
  },
}));

export function GlobalLiveRegion() {
  const message = useLiveRegion(state => state.message);

  return (
    <>
      {/* Polite announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>

      {/* Assertive announcements for critical updates */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}

/**
 * Hook to announce messages to screen readers
 */
export function useAnnounce() {
  const announce = useLiveRegion(state => state.announce);

  return {
    announce,
    announcePolite: (message: string) => announce(message),
    announceAssertive: (message: string) => announce(message),
  };
}

/**
 * Convenience function to announce messages directly
 * Can be used outside of React components
 */
export const announce = (message: string) => {
  useLiveRegion.getState().announce(message);
};
