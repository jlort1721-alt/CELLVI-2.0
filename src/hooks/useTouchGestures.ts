/**
 * Touch Gestures Hook
 * Detects swipe, tap, long press, and pinch gestures on mobile devices
 */

import { useEffect, useRef, useCallback } from 'react';

export interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinchIn?: (scale: number) => void;
  onPinchOut?: (scale: number) => void;
  swipeThreshold?: number; // Minimum distance for swipe (px)
  longPressDelay?: number; // Time for long press (ms)
  doubleTapDelay?: number; // Max time between taps (ms)
  enabled?: boolean;
}

export const useTouchGestures = (
  elementRef: React.RefObject<HTMLElement>,
  options: TouchGestureOptions
) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onLongPress,
    onPinchIn,
    onPinchOut,
    swipeThreshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300,
    enabled = true,
  } = options;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTap = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const initialPinchDistance = useRef<number>(0);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      // Detect pinch gesture
      if (e.touches.length === 2 && (onPinchIn || onPinchOut)) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialPinchDistance.current = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      }

      // Start long press timer
      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          onLongPress();
        }, longPressDelay);
      }
    },
    [enabled, onLongPress, onPinchIn, onPinchOut, longPressDelay]
  );

  const handleTouchMove = useCallback(() => {
    // Cancel long press if finger moves
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !touchStart.current) return;

      // Clear long press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      const deltaTime = Date.now() - touchStart.current.time;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Detect swipe gestures
      if (absX > swipeThreshold || absY > swipeThreshold) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
          }
        }
      } else if (deltaTime < 200) {
        // Quick tap - check for double tap
        const now = Date.now();
        const timeSinceLastTap = now - lastTap.current;

        if (timeSinceLastTap < doubleTapDelay && onDoubleTap) {
          onDoubleTap();
          lastTap.current = 0; // Reset to prevent triple tap
        } else {
          if (onTap) {
            onTap();
          }
          lastTap.current = now;
        }
      }

      touchStart.current = null;
    },
    [
      enabled,
      swipeThreshold,
      doubleTapDelay,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      onTap,
      onDoubleTap,
    ]
  );

  const handlePinch = useCallback(
    (e: TouchEvent) => {
      if (!enabled || e.touches.length !== 2) return;
      if (!onPinchIn && !onPinchOut) return;

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (initialPinchDistance.current > 0) {
        const scale = currentDistance / initialPinchDistance.current;

        if (scale < 1 && onPinchIn) {
          onPinchIn(scale);
        } else if (scale > 1 && onPinchOut) {
          onPinchOut(scale);
        }
      }
    },
    [enabled, onPinchIn, onPinchOut]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchmove', handlePinch, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handlePinch);

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [elementRef, enabled, handleTouchStart, handleTouchMove, handleTouchEnd, handlePinch]);
};

/**
 * Simple swipe hook for common use cases
 */
export const useSwipe = (
  elementRef: React.RefObject<HTMLElement>,
  handlers: {
    onLeft?: () => void;
    onRight?: () => void;
    onUp?: () => void;
    onDown?: () => void;
  },
  enabled = true
) => {
  useTouchGestures(elementRef, {
    onSwipeLeft: handlers.onLeft,
    onSwipeRight: handlers.onRight,
    onSwipeUp: handlers.onUp,
    onSwipeDown: handlers.onDown,
    enabled,
  });
};
