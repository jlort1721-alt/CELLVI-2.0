import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  Truck,
  TrendingDown,
  Fuel,
  DollarSign,
  Leaf,
  Navigation,
  Clock,
  Package,
  AlertCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import {
  optimizeRoutes,
  generateDemoData,
  type OptimizedRoute,
  type OptimizationResult,
  type Delivery,
  type Vehicle,
} from '../lib/routeOptimizer';

export default function RouteOptimizerPanel() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<number>(0);

  // Demo data
  const demoData = generateDemoData();
  const [vehicles] = useState<Vehicle[]>(demoData.vehicles);
  const [deliveries] = useState<Delivery[]>(demoData.deliveries);

  const handleOptimize = () => {
    setIsOptimizing(true);

    // Simulate optimization delay
    setTimeout(() => {
      const optimizationResult = optimizeRoutes(vehicles, deliveries);
      setResult(optimizationResult);
      setIsOptimizing(false);
    }, 1500);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDistance = (km: number) => {
    return `${km.toFixed(2)} km`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Navigation className="h-8 w-8 text-primary" />
            Route Genius
          </h1>
          <p className="text-muted-foreground mt-1">
            Optimización inteligente de rutas con algoritmo VRP
          </p>
        </div>
        <Button
          onClick={handleOptimize}
          disabled={isOptimizing}
          size="lg"
          className="gap-2"
        >
          {isOptimizing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Optimizando...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Optimizar Rutas
            </>
          )}
        </Button>
      </div>

      {/* Input Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehículos Disponibles</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Capacidad total: {vehicles.reduce((sum, v) => sum + v.capacity.weight, 0)} kg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Pendientes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Peso total: {deliveries.reduce((sum, d) => sum + d.weight, 0)} kg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Prioritarias</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliveries.filter((d) => d.priority === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Alta prioridad
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Optimization Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-green-500 bg-green-50 dark:bg-green-950">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Distancia Total</CardTitle>
                <TrendingDown className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDistance(result.metrics.totalDistance)}</div>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  {result.metrics.efficiencyGain.toFixed(1)}% más eficiente
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
                  {result.metrics.fuelConsumption.toFixed(1)} L
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
                  {formatCurrency(result.metrics.totalCost)}
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
                  {result.metrics.co2Reduction.toFixed(1)} kg
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Reducción de emisiones
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Routes Detail */}
          <Card>
            <CardHeader>
              <CardTitle>Rutas Optimizadas</CardTitle>
              <CardDescription>
                {result.routes.length} rutas generadas • {result.unassignedDeliveries.length} entregas sin asignar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedRoute.toString()} onValueChange={(v) => setSelectedRoute(Number(v))}>
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
                              <Badge variant={getPriorityColor(delivery.priority)}>
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

          {/* Unassigned Deliveries */}
          {result.unassignedDeliveries.length > 0 && (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Entregas Sin Asignar
                </CardTitle>
                <CardDescription>
                  {result.unassignedDeliveries.length} entregas no pudieron ser asignadas por restricciones de capacidad o ventana de tiempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.unassignedDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="flex items-center gap-3 p-3 border border-yellow-300 bg-yellow-50 dark:bg-yellow-950 rounded-lg"
                    >
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <div className="flex-1">
                        <p className="font-medium">{delivery.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {delivery.weight} kg • {delivery.timeWindow.start} - {delivery.timeWindow.end}
                        </p>
                      </div>
                      <Badge variant={getPriorityColor(delivery.priority)}>
                        {delivery.priority === 'high' ? 'Alta' : delivery.priority === 'medium' ? 'Media' : 'Baja'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!result && !isOptimizing && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Navigation className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Listo para Optimizar</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Haz clic en "Optimizar Rutas" para generar las rutas más eficientes
              usando el algoritmo VRP con {vehicles.length} vehículos y {deliveries.length} entregas.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Reducción esperada: 15-25% en distancia
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
