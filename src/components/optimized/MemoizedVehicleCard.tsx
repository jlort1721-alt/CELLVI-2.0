/**
 * Memoized Vehicle Card Component
 * Optimized for rendering in large lists with React.memo
 */

import React from 'react';
import { Car, Fuel, Battery, Signal } from 'lucide-react';

export interface VehicleCardProps {
  id: string;
  plate: string;
  driver?: string;
  status: 'activo' | 'detenido' | 'alerta' | 'apagado';
  speed?: number;
  fuel?: number;
  battery?: number;
  signal?: number;
  lastUpdate?: string;
  onClick?: (id: string) => void;
  isSelected?: boolean;
}

const VehicleCardComponent: React.FC<VehicleCardProps> = ({
  id,
  plate,
  driver,
  status,
  speed,
  fuel,
  battery,
  signal,
  lastUpdate,
  onClick,
  isSelected,
}) => {
  const statusColor = {
    activo: 'bg-green-500',
    detenido: 'bg-yellow-500',
    alerta: 'bg-red-500',
    apagado: 'bg-gray-500',
  }[status];

  const statusTextColor = {
    activo: 'text-green-500',
    detenido: 'text-yellow-500',
    alerta: 'text-red-500',
    apagado: 'text-gray-500',
  }[status];

  return (
    <div
      onClick={() => onClick?.(id)}
      className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer border ${
        isSelected
          ? 'bg-sidebar-accent border-sidebar-primary shadow-md'
          : 'bg-sidebar border-sidebar-border hover:bg-sidebar-foreground/[0.03] hover:border-sidebar-border/50'
      }`}
      role="button"
      tabIndex={0}
      aria-label={`Vehículo ${plate}, ${status}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(id);
        }
      }}
    >
      {/* Left: Status indicator and info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Status dot with animation for active vehicles */}
        <div className="w-2 h-2 rounded-full flex-shrink-0 relative">
          {status === 'activo' && (
            <div className="absolute inset-0 rounded-full animate-ping opacity-75 bg-green-500" />
          )}
          <div className={`relative w-full h-full rounded-full ${statusColor}`} />
        </div>

        {/* Vehicle info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Car className={`w-3.5 h-3.5 ${statusTextColor}`} />
            <span className="text-xs text-sidebar-foreground font-bold truncate">
              {plate}
            </span>
            {speed !== undefined && speed > 0 && (
              <span className="text-[9px] text-blue-400 font-mono">{speed} km/h</span>
            )}
          </div>
          {driver && (
            <span className="text-[10px] text-sidebar-foreground/40 block truncate">
              {driver}
            </span>
          )}
          {lastUpdate && (
            <span className="text-[9px] text-sidebar-foreground/30">{lastUpdate}</span>
          )}
        </div>
      </div>

      {/* Right: Telemetry indicators */}
      <div className="flex items-center gap-2">
        {fuel !== undefined && (
          <div className="flex flex-col items-center">
            <Fuel
              className={`w-3 h-3 ${
                fuel > 50
                  ? 'text-green-500'
                  : fuel > 30
                  ? 'text-yellow-500'
                  : 'text-red-500'
              }`}
            />
            <span className="text-[9px] text-sidebar-foreground/40">{fuel}%</span>
          </div>
        )}
        {battery !== undefined && (
          <div className="flex flex-col items-center">
            <Battery
              className={`w-3 h-3 ${
                battery > 50
                  ? 'text-green-500'
                  : battery > 20
                  ? 'text-yellow-500'
                  : 'text-red-500'
              }`}
            />
            <span className="text-[9px] text-sidebar-foreground/40">{battery}%</span>
          </div>
        )}
        {signal !== undefined && (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((bar) => (
              <div
                key={bar}
                className={`w-0.5 rounded-full ${
                  bar <= signal ? 'bg-blue-500' : 'bg-sidebar-border'
                }`}
                style={{ height: `${bar * 2 + 4}px` }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Custom comparison function for React.memo
 * Only re-render if meaningful props change
 */
const areEqual = (prevProps: VehicleCardProps, nextProps: VehicleCardProps): boolean => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.plate === nextProps.plate &&
    prevProps.status === nextProps.status &&
    prevProps.speed === nextProps.speed &&
    prevProps.fuel === nextProps.fuel &&
    prevProps.battery === nextProps.battery &&
    prevProps.signal === nextProps.signal &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.driver === nextProps.driver &&
    prevProps.lastUpdate === nextProps.lastUpdate
  );
};

/**
 * Memoized export - prevents unnecessary re-renders
 */
export const MemoizedVehicleCard = React.memo(VehicleCardComponent, areEqual);
