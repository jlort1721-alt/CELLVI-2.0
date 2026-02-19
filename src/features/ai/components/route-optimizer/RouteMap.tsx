import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import type { OptimizationResult, Delivery } from '../../lib/routeOptimizer';

const ROUTE_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export interface RouteMapProps {
  result: OptimizationResult;
  deliveries: Delivery[];
  getPriorityColor: (priority: string) => string;
}

const RouteMap: React.FC<RouteMapProps> = ({ result, deliveries, getPriorityColor }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Mapa de Rutas
        </CardTitle>
        <CardDescription>
          Visualización interactiva de rutas optimizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full rounded-lg overflow-hidden border">
          <MapContainer
            center={[4.6097, -74.0817]} // Bogotá, Colombia
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Render route paths with different colors */}
            {result.routes.map((route, idx) => {
              const routeColor = ROUTE_COLORS[idx % ROUTE_COLORS.length];
              const routeDeliveries = route.sequence
                .map((deliveryId) => deliveries.find((d) => d.id === deliveryId))
                .filter((d) => d !== undefined);

              return (
                <React.Fragment key={idx}>
                  {/* Route path */}
                  <Polyline
                    positions={routeDeliveries.map((d) => [d!.lat, d!.lng])}
                    pathOptions={{
                      color: routeColor,
                      weight: 3,
                      opacity: 0.7,
                    }}
                  />

                  {/* Delivery markers */}
                  {routeDeliveries.map((delivery, seqIdx) => (
                    <React.Fragment key={delivery!.id}>
                      <Circle
                        center={[delivery!.lat, delivery!.lng]}
                        radius={100}
                        pathOptions={{
                          color: routeColor,
                          fillColor: routeColor,
                          fillOpacity: 0.3,
                        }}
                      />
                      <Marker position={[delivery!.lat, delivery!.lng]}>
                        <Popup>
                          <div className="p-2">
                            <p className="font-semibold text-sm">
                              {route.vehicleId} - Parada #{seqIdx + 1}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {delivery!.address}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={getPriorityColor(delivery!.priority) as any}>
                                {delivery!.priority}
                              </Badge>
                              <span className="text-xs">{delivery!.weight} kg</span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  ))}
                </React.Fragment>
              );
            })}

            {/* Unassigned deliveries (red markers) */}
            {result.unassignedDeliveries.map((delivery) => (
              <Marker
                key={delivery.id}
                position={[delivery.lat, delivery.lng]}
              >
                <Popup>
                  <div className="p-2">
                    <p className="font-semibold text-sm text-red-600">
                      Sin Asignar
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {delivery.address}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="destructive">
                        {delivery.priority}
                      </Badge>
                      <span className="text-xs">{delivery.weight} kg</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Map Legend */}
        <div className="mt-4 flex flex-wrap gap-3">
          {result.routes.map((route, idx) => {
            const routeColor = ROUTE_COLORS[idx % ROUTE_COLORS.length];
            return (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: routeColor }}
                />
                <span className="text-sm">{route.vehicleId}</span>
                <span className="text-xs text-muted-foreground">
                  ({route.deliveries.length} entregas)
                </span>
              </div>
            );
          })}
          {result.unassignedDeliveries.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-sm text-red-600">Sin Asignar</span>
              <span className="text-xs text-muted-foreground">
                ({result.unassignedDeliveries.length})
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

RouteMap.displayName = 'RouteMap';

export default React.memo(RouteMap);
