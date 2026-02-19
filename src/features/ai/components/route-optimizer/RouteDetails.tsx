import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Truck, Fuel, Navigation, Clock, Package, MapPin } from 'lucide-react';
import type { OptimizationResult, Vehicle } from '../../lib/routeOptimizer';

export interface RouteDetailsProps {
  result: OptimizationResult;
  vehicles: Vehicle[];
  selectedRoute: number;
  onSelectedRouteChange: (index: number) => void;
  formatDistance: (km: number) => string;
  getPriorityColor: (priority: string) => string;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({
  result,
  vehicles,
  selectedRoute,
  onSelectedRouteChange,
  formatDistance,
  getPriorityColor,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rutas Optimizadas</CardTitle>
        <CardDescription>
          {result.routes.length} rutas generadas • {result.unassignedDeliveries.length} entregas sin asignar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedRoute.toString()} onValueChange={(v) => onSelectedRouteChange(Number(v))}>
          <TabsList className="grid w-full grid-cols-2">
            {result.routes.map((route, idx) => (
              <TabsTrigger key={idx} value={idx.toString()}>
                <Truck className="h-4 w-4 mr-2" />
                {route.vehicleId}
              </TabsTrigger>
            ))}
          </TabsList>

          {result.routes.map((route, idx) => (
            <TabsContent key={idx} value={idx.toString()} className="space-y-4 mt-4">
              {/* Route Summary */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <Navigation className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Distancia</p>
                    <p className="font-semibold">{formatDistance(route.totalDistance)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <Fuel className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Combustible</p>
                    <p className="font-semibold">{route.estimatedFuel.toFixed(1)} L</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Entregas</p>
                    <p className="font-semibold">{route.deliveries.length}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Sequence */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Secuencia de Entregas
                </h4>
                <div className="space-y-2">
                  {route.sequence.map((deliveryId, seqIdx) => {
                    const delivery = route.deliveries.find((d) => d.id === deliveryId);
                    if (!delivery) return null;

                    return (
                      <div
                        key={deliveryId}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                          {seqIdx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{delivery.address}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {delivery.weight} kg
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {delivery.timeWindow.start} - {delivery.timeWindow.end}
                            </span>
                          </div>
                        </div>
                        <Badge variant={getPriorityColor(delivery.priority) as any}>
                          {delivery.priority === 'high' ? 'Alta' : delivery.priority === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Route Progress */}
              <div className="p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Capacidad Utilizada</span>
                  <span className="text-sm text-muted-foreground">
                    {route.deliveries.reduce((sum, d) => sum + d.weight, 0)} kg
                  </span>
                </div>
                <Progress
                  value={
                    (route.deliveries.reduce((sum, d) => sum + d.weight, 0) /
                      vehicles.find((v) => v.id === route.vehicleId)!.capacity.weight) *
                    100
                  }
                  className="h-2"
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

RouteDetails.displayName = 'RouteDetails';

export default React.memo(RouteDetails);
