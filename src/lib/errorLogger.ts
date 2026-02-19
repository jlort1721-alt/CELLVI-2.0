/**
 * Centralized error logging utility.
 * Replaces scattered console.error calls with structured logging.
 */

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Log an error with structured context. Outputs to console in development
 * and forwards to Sentry in production (when configured).
 * @param error - The thrown error or error message.
 * @param severity - Severity level (default `'medium'`).
 * @param context - Optional metadata (component name, action, user ID).
 */
export function logError(
  error: unknown,
  severity: ErrorSeverity = 'medium',
  context?: ErrorContext
): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  // Always log to console in development
  if (import.meta.env.DEV) {
    console.error(`[${severity.toUpperCase()}]`, message, context || '', stack || '');
  }

  // Send to Sentry in production (if configured)
  if (import.meta.env.VITE_SENTRY_DSN && !import.meta.env.DEV) {
    import('@sentry/react').then(Sentry => {
      Sentry.withScope(scope => {
        scope.setLevel(severity === 'critical' ? 'fatal' : severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'info');
        if (context) {
          scope.setContext('errorContext', context);
        }
        if (error instanceof Error) {
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage(message);
        }
      });
    }).catch(() => {
      // Sentry not available, already logged to console
    });
  }
}

/**
 * Convenience wrapper for API/network errors. Logs at `'high'` severity.
 * @param error - The thrown error.
 * @param endpoint - The API endpoint that failed.
 * @param context - Optional additional context.
 */
export function logApiError(error: unknown, endpoint: string, context?: ErrorContext): void {
  logError(error, 'high', { ...context, action: 'api_call', endpoint });
}

/**
 * Convenience wrapper for non-critical UI rendering errors. Logs at `'low'` severity.
 * @param error - The thrown error.
 * @param component - Name of the React component that encountered the error.
 */
export function logUIError(error: unknown, component: string): void {
  logError(error, 'low', { component, action: 'ui_render' });
}
