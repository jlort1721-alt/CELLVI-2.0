import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import type { OptimizedRouteRecord } from '../../hooks/useRouteOptimization';

export interface OptimizationStats {
  totalRoutes: number;
  totalDistance: number;
  totalCost: number;
  totalFuelSaved: number;
  totalCO2Reduced: number;
  avgEfficiencyGain: number;
}

export interface OptimizationHistoryProps {
  stats: OptimizationStats | undefined;
  savedRoutes: OptimizedRouteRecord[] | undefined;
  loadingHistory: boolean;
  formatDistance: (km: number) => string;
}

const OptimizationHistory: React.FC<OptimizationHistoryProps> = ({
  stats,
  savedRoutes,
  loadingHistory,
  formatDistance,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Optimizaciones
        </CardTitle>
        <CardDescription>
          Rutas guardadas y estadísticas acumuladas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Aggregate Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4 p-4 bg-secondary/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Total Rutas</p>
              <p className="text-2xl font-bold">{stats.totalRoutes}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Distancia Total</p>
              <p className="text-2xl font-bold">{formatDistance(stats.totalDistance)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ahorro Promedio</p>
              <p className="text-2xl font-bold text-green-600">{stats.avgEfficiencyGain.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CO₂ Reducido</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalCO2Reduced.toFixed(1)} kg</p>
            </div>
          </div>
        )}

        {/* Saved Routes List */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Últimas Optimizaciones</h4>
          {loadingHistory ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : savedRoutes && savedRoutes.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {savedRoutes.slice(0, 10).map((route) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{route.route_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(route.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Eficiencia</p>
                      <p className="text-sm font-semibold text-green-600">
                        +{route.efficiency_gain.toFixed(1)}%
                      </p>
                    </div>
                    <Badge variant={
                      route.status === 'completed' ? 'default' :
                      route.status === 'in_progress' ? 'secondary' :
                      route.status === 'cancelled' ? 'destructive' : 'outline'
                    }>
                      {route.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay rutas guardadas aún</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

OptimizationHistory.displayName = 'OptimizationHistory';

export default React.memo(OptimizationHistory);
