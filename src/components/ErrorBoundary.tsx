/**
 * Error Boundary Component - PR #26
 *
 * Catches React errors and prevents entire app crashes.
 * Provides fallback UI and error reporting capabilities.
 */

import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  level?: 'page' | 'feature' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (in production, send to error tracking service)
    console.error('ErrorBoundary caught error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send to Sentry or other error tracking service
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state if resetKeys change
    if (
      this.props.resetKeys &&
      prevProps.resetKeys &&
      this.props.resetKeys.some((key, idx) => key !== prevProps.resetKeys![idx])
    ) {
      this.reset();
    }
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.reset}
          level={this.props.level || 'component'}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  level: 'page' | 'feature' | 'component';
}

function ErrorFallback({ error, errorInfo, onReset, level }: ErrorFallbackProps) {
  const isPageLevel = level === 'page';
  const isFeatureLevel = level === 'feature';

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${
        isPageLevel ? 'h-screen bg-navy' : 'min-h-[400px] bg-sidebar rounded-lg border border-sidebar-border'
      }`}
    >
      <div className="max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-heading font-bold text-sidebar-foreground mb-2">
            {isPageLevel && 'Oops! Algo salió mal'}
            {isFeatureLevel && 'Error en esta sección'}
            {!isPageLevel && !isFeatureLevel && 'Error al cargar este componente'}
          </h2>
          <p className="text-sm text-sidebar-foreground/60">
            {isPageLevel &&
              'La página encontró un error inesperado. Puedes intentar recargar o volver al inicio.'}
            {isFeatureLevel &&
              'Esta funcionalidad encontró un problema. El resto de la aplicación debería funcionar normalmente.'}
            {!isPageLevel && !isFeatureLevel && 'Este componente no se pudo cargar correctamente.'}
          </p>
        </div>

        {/* Error details (only in development) */}
        {import.meta.env.DEV && error && (
          <details className="text-left bg-red-500/5 border border-red-500/20 rounded-lg p-4">
            <summary className="text-xs font-mono text-red-400 cursor-pointer mb-2">
              Error details (dev only)
            </summary>
            <div className="space-y-2">
              <div className="text-xs text-red-300">
                <strong>Error:</strong> {error.message}
              </div>
              {error.stack && (
                <pre className="text-[10px] text-red-300/80 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {error.stack}
                </pre>
              )}
              {errorInfo && (
                <pre className="text-[10px] text-red-300/80 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
          </details>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          {isPageLevel ? (
            <>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Ir al inicio
              </Button>
              <Button onClick={() => window.location.reload()} size="sm" className="gap-2 bg-gold-gradient text-navy">
                <RefreshCw className="w-4 h-4" />
                Recargar página
              </Button>
            </>
          ) : (
            <Button onClick={onReset} size="sm" className="gap-2 bg-gold-gradient text-navy">
              <RefreshCw className="w-4 h-4" />
              Intentar de nuevo
            </Button>
          )}
        </div>

        {/* Support info */}
        {isPageLevel && (
          <p className="text-xs text-sidebar-foreground/40">
            Si el problema persiste, contacta a soporte técnico
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook to programmatically throw errors (for testing)
 */
export function useErrorHandler() {
  const throwError = (error: Error) => {
    throw error;
  };

  return { throwError };
}
