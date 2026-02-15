/**
 * Memoized Alert Row Component
 * Optimized for rendering in large alert tables/lists
 */

import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export interface AlertRowProps {
  id: string;
  type: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  timestamp: number | string;
  vehiclePlate?: string;
  acknowledged?: boolean;
  onClick?: (id: string) => void;
  onAcknowledge?: (id: string) => void;
}

const AlertRowComponent: React.FC<AlertRowProps> = ({
  id,
  type,
  message,
  severity,
  timestamp,
  vehiclePlate,
  acknowledged,
  onClick,
  onAcknowledge,
}) => {
  const severityConfig = {
    critical: {
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      dotColor: 'bg-red-500',
    },
    high: {
      icon: AlertCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      dotColor: 'bg-orange-500',
    },
    medium: {
      icon: AlertCircle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      dotColor: 'bg-yellow-500',
    },
    low: {
      icon: Info,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/30',
      dotColor: 'bg-blue-400',
    },
    info: {
      icon: Info,
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/10',
      borderColor: 'border-gray-400/30',
      dotColor: 'bg-gray-400',
    },
  }[severity];

  const Icon = severityConfig.icon;

  const formattedTime =
    typeof timestamp === 'number'
      ? new Date(timestamp).toLocaleString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        })
      : timestamp;

  return (
    <div
      onClick={() => onClick?.(id)}
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer border ${
        acknowledged
          ? 'bg-sidebar-foreground/[0.02] border-sidebar-border/50 opacity-60'
          : `${severityConfig.bgColor} ${severityConfig.borderColor}`
      } hover:bg-sidebar-foreground/[0.05]`}
      role="button"
      tabIndex={0}
      aria-label={`Alerta ${severity}: ${message}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(id);
        }
      }}
    >
      {/* Severity indicator */}
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <div className={`w-2 h-2 rounded-full ${severityConfig.dotColor}`} />
      </div>

      {/* Alert content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`w-3.5 h-3.5 ${severityConfig.color}`} />
          <span className={`text-xs font-medium ${severityConfig.color} uppercase tracking-wide`}>
            {type}
          </span>
          {vehiclePlate && (
            <span className="text-xs text-sidebar-foreground/50">{vehiclePlate}</span>
          )}
          {acknowledged && (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" aria-label="Acknowledged" />
          )}
        </div>
        <p className="text-xs text-sidebar-foreground">{message}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] text-sidebar-foreground/30">{formattedTime}</span>
          {!acknowledged && onAcknowledge && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAcknowledge(id);
              }}
              className="text-[10px] text-sidebar-primary hover:underline"
              aria-label="Acknowledge alert"
            >
              Reconocer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Custom comparison function
 * Only re-render if alert data changes
 */
const areEqual = (prevProps: AlertRowProps, nextProps: AlertRowProps): boolean => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.type === nextProps.type &&
    prevProps.message === nextProps.message &&
    prevProps.severity === nextProps.severity &&
    prevProps.acknowledged === nextProps.acknowledged &&
    prevProps.vehiclePlate === nextProps.vehiclePlate &&
    prevProps.timestamp === nextProps.timestamp
  );
};

/**
 * Memoized export
 */
export const MemoizedAlertRow = React.memo(AlertRowComponent, areEqual);
