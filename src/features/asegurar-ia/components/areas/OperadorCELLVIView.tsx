import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, MapPin, AlertTriangle, CheckCircle2, Clock, Fuel } from 'lucide-react';

export default function OperadorCELLVIView() {
  const activeRoutes = [
    { id: 'R-001', driver: 'Juan Pérez', vehicle: 'NAR-123', status: 'in_transit', eta: '14:30', progress: 65 },
    { id: 'R-002', driver: 'María García', vehicle: 'NAR-456', status: 'loading', eta: '15:00', progress: 20 },
    { id: 'R-003', driver: 'Carlos López', vehicle: 'NAR-789', status: 'completed', eta: 'Completado', progress: 100 }
  ];

  const activeAlerts = [
    { route: 'R-001', type: 'speed_limit', severity: 'medium', message: 'Velocidad superior al límite' },
    { route: 'R-004', type: 'geofence', severity: 'low', message: 'Salida de geocerca programada' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Truck className="w-8 h-8 text-indigo-500" />
        <h1 className="text-3xl font-bold">Dashboard de Operador CELLVI</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rutas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Vehículos en Ruta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Alertas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{activeAlerts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Entregas Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="routes">
        <TabsList>
          <TabsTrigger value="routes">Rutas Activas</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <CardTitle>Rutas en Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeRoutes.map((route) => (
                  <div key={route.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Truck className="w-5 h-5 text-indigo-500" />
                      <div className="flex-1">
                        <p className="font-medium">{route.id} - {route.driver}</p>
                        <p className="text-sm text-muted-foreground">Vehículo: {route.vehicle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{route.eta}</span>
                      <Badge variant={route.status === 'completed' ? 'default' : 'outline'}>
                        {route.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertas del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeAlerts.map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 border rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Ruta {alert.route}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'default'}>
                      {alert.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
