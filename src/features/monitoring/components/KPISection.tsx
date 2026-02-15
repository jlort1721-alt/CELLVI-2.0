/**
 * KPI Section Component
 * Groups dashboard KPI cards with optimized rendering
 */

import React, { memo } from 'react';
import { Car, AlertTriangle, Gauge, Route, Fuel, Activity } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { SkeletonKPI } from '@/components/ui/skeleton';
import { formatNumber, formatKm, platformStats } from '@/lib/demoData';

interface KPISectionProps {
  vehicleCount?: number;
  activeCount?: number;
  alertCount?: number;
  efficiency?: number;
  kmToday?: number;
  avgSpeed?: number;
  sparkData?: {
    vehicles?: number[];
    alerts?: number[];
    distance?: number[];
    fuel?: number[];
  };
  isLoading?: boolean;
}

const KPISectionComponent: React.FC<KPISectionProps> = ({
  vehicleCount = 0,
  activeCount = 0,
  alertCount = 0,
  efficiency = 0,
  kmToday = 0,
  avgSpeed = 0,
  sparkData,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonKPI key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <KpiCard
        icon={Car}
        label="Vehículos"
        value={vehicleCount}
        delta={`${activeCount} activos`}
        deltaType="up"
        color="#3b82f6"
        sparkData={sparkData?.vehicles}
      />
      <KpiCard
        icon={AlertTriangle}
        label="Alertas Activas"
        value={alertCount}
        delta={alertCount > 5 ? 'Alta actividad' : 'Normal'}
        deltaType={alertCount > 5 ? 'down' : 'neutral'}
        color="#ef4444"
        sparkData={sparkData?.alerts}
      />
      <KpiCard
        icon={Gauge}
        label="Velocidad Promedio"
        value={`${avgSpeed} km/h`}
        delta="Últimas 24h"
        deltaType="neutral"
        color="#8b5cf6"
      />
      <KpiCard
        icon={Route}
        label="Km Hoy"
        value={formatNumber(kmToday)}
        delta={`${formatKm(platformStats.kmTraveledThisMonth)} este mes`}
        deltaType="up"
        color="hsl(45,95%,55%)"
        sparkData={sparkData?.distance}
      />
      <KpiCard
        icon={Fuel}
        label="Eficiencia"
        value={`${efficiency.toFixed(0)}%`}
        delta="Global"
        deltaType="up"
        color="#f97316"
        sparkData={sparkData?.fuel}
      />
      <KpiCard
        icon={Activity}
        label="Estado Sistema"
        value="Óptimo"
        delta="99.9% uptime"
        deltaType="up"
        color="#22c55e"
      />
    </div>
  );
};

/**
 * Comparison function for memo
 */
const areEqual = (prevProps: KPISectionProps, nextProps: KPISectionProps): boolean => {
  return (
    prevProps.vehicleCount === nextProps.vehicleCount &&
    prevProps.activeCount === nextProps.activeCount &&
    prevProps.alertCount === nextProps.alertCount &&
    prevProps.efficiency === nextProps.efficiency &&
    prevProps.kmToday === nextProps.kmToday &&
    prevProps.avgSpeed === nextProps.avgSpeed &&
    prevProps.isLoading === nextProps.isLoading &&
    JSON.stringify(prevProps.sparkData) === JSON.stringify(nextProps.sparkData)
  );
};

export const KPISection = memo(KPISectionComponent, areEqual);
