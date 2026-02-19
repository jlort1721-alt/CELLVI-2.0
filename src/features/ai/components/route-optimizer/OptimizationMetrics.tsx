import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Fuel, DollarSign, Leaf } from 'lucide-react';
import type { OptimizationResult } from '../../lib/routeOptimizer';

export interface OptimizationMetricsProps {
  metrics: OptimizationResult['metrics'];
  formatDistance: (km: number) => string;
  formatCurrency: (value: number) => string;
}

const OptimizationMetrics: React.FC<OptimizationMetricsProps> = ({
  metrics,
  formatDistance,
  formatCurrency,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="border-green-500 bg-green-50 dark:bg-green-950">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Distancia Total</CardTitle>
          <TrendingDown className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatDistance(metrics.totalDistance)}</div>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            {metrics.efficiencyGain.toFixed(1)}% más eficiente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Combustible</CardTitle>
          <Fuel className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.fuelConsumption.toFixed(1)} L
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Estimado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(metrics.totalCost)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Operacional
          </p>
        </CardContent>
      </Card>

      <Card className="border-green-500 bg-green-50 dark:bg-green-950">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CO₂ Ahorrado</CardTitle>
          <Leaf className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {metrics.co2Reduction.toFixed(1)} kg
          </div>
          <p className="text-xs text-green-600 mt-1">
            Reducción de emisiones
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

OptimizationMetrics.displayName = 'OptimizationMetrics';

export default React.memo(OptimizationMetrics);
