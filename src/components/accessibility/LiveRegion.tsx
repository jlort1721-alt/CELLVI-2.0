/**
 * Live Region Component
 * Announces dynamic content changes to screen readers
 * WCAG 2.1 Success Criterion 4.1.3 (Status Messages)
 */

import React, { useEffect, useRef, useState } from 'react';

export type LiveRegionPoliteness = 'polite' | 'assertive' | 'off';

interface LiveRegionProps {
  message: string;
  politeness?: LiveRegionPoliteness;
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  clearAfter?: number; // Auto-clear message after N ms
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions',
  clearAfter,
}) => {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    // Update message
    setCurrentMessage(message);

    // Auto-clear if specified
    if (clearAfter && message) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      }}
    >
      {currentMessage}
    </div>
  );
};

/**
 * Hook for managing live region announcements
 */
export const useLiveRegion = () => {
  const [message, setMessage] = useState('');
  const [politeness, setPoliteness] = useState<LiveRegionPoliteness>('polite');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const announce = (
    newMessage: string,
    options: {
      politeness?: LiveRegionPoliteness;
      clearAfter?: number;
    } = {}
  ) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set politeness level
    if (options.politeness) {
      setPoliteness(options.politeness);
    }

    // Set message
    setMessage(newMessage);

    // Auto-clear if specified
    if (options.clearAfter) {
      timeoutRef.current = setTimeout(() => {
        setMessage('');
      }, options.clearAfter);
    }
  };

  const clear = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setMessage('');
  };

  return {
    message,
    politeness,
    announce,
    clear,
    LiveRegion: () => <LiveRegion message={message} politeness={politeness} />,
  };
};

/**
 * Global live region announcer (singleton pattern)
 */
class GlobalAnnouncer {
  private listeners: ((message: string, politeness: LiveRegionPoliteness) => void)[] = [];

  subscribe(callback: (message: string, politeness: LiveRegionPoliteness) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  announce(message: string, politeness: LiveRegionPoliteness = 'polite') {
    this.listeners.forEach((callback) => callback(message, politeness));
  }
}

export const globalAnnouncer = new GlobalAnnouncer();

/**
 * Global Live Region Provider
 * Place this once at app root level
 */
export const GlobalLiveRegion: React.FC = () => {
  const [message, setMessage] = useState('');
  const [politeness, setPoliteness] = useState<LiveRegionPoliteness>('polite');

  useEffect(() => {
    const unsubscribe = globalAnnouncer.subscribe((msg, pol) => {
      setMessage(msg);
      setPoliteness(pol);

      // Auto-clear after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    });

    return unsubscribe;
  }, []);

  return <LiveRegion message={message} politeness={politeness} clearAfter={5000} />;
};

/**
 * Convenience function to announce from anywhere in the app
 */
export const announce = (message: string, politeness: LiveRegionPoliteness = 'polite') => {
  globalAnnouncer.announce(message, politeness);
};
