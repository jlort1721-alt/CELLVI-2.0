/**
 * Performance Monitoring Hook
 * Tracks Web Vitals and React Query performance metrics
 * For development and production monitoring
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface PerformanceMetrics {
  // Web Vitals
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  FCP?: number; // First Contentful Paint

  // React Query metrics
  queryCount?: number;
  cacheSize?: number;
  staleCacheHits?: number;
  networkRequests?: number;

  // Custom metrics
  renderCount?: number;
  mountTime?: number;
}

interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  reportInterval?: number; // ms
  onReport?: (metrics: PerformanceMetrics) => void;
  trackWebVitals?: boolean;
  trackQueryMetrics?: boolean;
}

export const usePerformanceMonitor = (options: UsePerformanceMonitorOptions = {}) => {
  const {
    enabled = import.meta.env.DEV, // Only in development by default
    reportInterval = 30000, // Report every 30 seconds
    onReport,
    trackWebVitals = true,
    trackQueryMetrics = true,
  } = options;

  // Use try-catch to safely get queryClient
  let queryClient;
  try {
    queryClient = useQueryClient();
  } catch (error) {
    // If QueryClient is not available, just disable query metrics
    console.warn('[usePerformanceMonitor] QueryClient not available, disabling query metrics');
  }

  const metricsRef = useRef<PerformanceMetrics>({});
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;

    renderCountRef.current++;

    // Track Web Vitals
    if (trackWebVitals && 'PerformanceObserver' in window) {
      // LCP - Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        metricsRef.current.LCP = lastEntry.renderTime || lastEntry.loadTime;
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }

      // FID - First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          metricsRef.current.FID = entry.processingStart - entry.startTime;
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // FID not supported
      }

      // CLS - Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            metricsRef.current.CLS = clsValue;
          }
        });
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // CLS not supported
      }

      // Navigation Timing
      if (performance.getEntriesByType) {
        const navigationEntries = performance.getEntriesByType('navigation') as any[];
        if (navigationEntries.length > 0) {
          const nav = navigationEntries[0];
          metricsRef.current.TTFB = nav.responseStart - nav.requestStart;
        }
      }

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    }
  }, [enabled, trackWebVitals]);

  // Track React Query metrics
  useEffect(() => {
    if (!enabled || !trackQueryMetrics || !queryClient) return;

    const interval = setInterval(() => {
      try {
        const cache = queryClient.getQueryCache();
        const queries = cache.getAll();

        metricsRef.current.queryCount = queries.length;
        metricsRef.current.staleCacheHits = queries.filter((q) => q.isStale()).length;
        metricsRef.current.renderCount = renderCountRef.current;
        metricsRef.current.mountTime = Date.now() - mountTimeRef.current;

        // Report metrics
        if (onReport) {
          onReport({ ...metricsRef.current });
        }

        // Log to console in dev mode
        if (import.meta.env.DEV) {
          console.group('📊 Performance Metrics');
          console.table(metricsRef.current);
          console.groupEnd();
        }
      } catch (error) {
        console.warn('[usePerformanceMonitor] Error tracking query metrics:', error);
      }
    }, reportInterval);

    return () => clearInterval(interval);
  }, [enabled, trackQueryMetrics, reportInterval, onReport, queryClient]);

  return metricsRef.current;
};

/**
 * Report Web Vitals to analytics (Google Analytics, etc.)
 */
export const reportWebVitals = (metric: { name: string; value: number }) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.name,
      non_interaction: true,
    });
  }

  // Log in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value);
  }
};

/**
 * Measure component render time
 */
export const useMeasureRender = (componentName: string, enabled = import.meta.env.DEV) => {
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    renderStartRef.current = performance.now();

    return () => {
      const renderTime = performance.now() - renderStartRef.current;
      if (renderTime > 16) {
        // Log slow renders (>16ms = <60fps)
        console.warn(
          `[Slow Render] ${componentName}: ${renderTime.toFixed(2)}ms`
        );
      }
    };
  });
};

/**
 * Track bundle size and initial load performance
 */
export const trackLoadPerformance = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    const metrics = {
      dns: perfData.domainLookupEnd - perfData.domainLookupStart,
      tcp: perfData.connectEnd - perfData.connectStart,
      ttfb: perfData.responseStart - perfData.requestStart,
      download: perfData.responseEnd - perfData.responseStart,
      domInteractive: perfData.domInteractive - perfData.fetchStart,
      domComplete: perfData.domComplete - perfData.fetchStart,
      loadComplete: perfData.loadEventEnd - perfData.fetchStart,
    };

    if (import.meta.env.DEV) {
      console.group('🚀 Load Performance');
      console.table(metrics);
      console.groupEnd();
    }

    // Report to analytics
    if (window.gtag) {
      window.gtag('event', 'page_load_timing', {
        event_category: 'Performance',
        ttfb: Math.round(metrics.ttfb),
        dom_interactive: Math.round(metrics.domInteractive),
        load_complete: Math.round(metrics.loadComplete),
      });
    }
  });
};
