import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Radio, Shield, Activity, AlertTriangle, CheckCircle2,
  Clock, MapPin, Truck, Zap, TrendingUp
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Dashboard de CCO-RACK - Centro de Control Operacional
export default function CCORackView() {
  // KPIs Principales
  const mainKPIs = [
    { id: 'uptime', name: 'Uptime RACK', value: 99.97, target: 99.9, unit: '%', trend: 'up' },
    { id: 'devices', name: 'Dispositivos Activos', value: 247, target: 250, unit: '', trend: 'stable' },
    { id: 'alerts', name: 'Alertas Activas', value: 12, target: 10, unit: '', trend: 'up' },
    { id: 'latency', name: 'Latencia Promedio', value: 45, target: 50, unit: 'ms', trend: 'down' }
  ];

  // Estado de Servicios RACK
  const rackServices = [
    { service: 'GNSS Tracking', status: 'online', uptime: 99.99, alerts: 0 },
    { service: 'Evidence Layer', status: 'online', uptime: 99.95, alerts: 1 },
    { service: 'Alert Engine', status: 'online', uptime: 99.98, alerts: 0 },
    { service: 'Data Pipeline', status: 'degraded', uptime: 99.82, alerts: 3 },
    { service: 'API Gateway', status: 'online', uptime: 99.97, alerts: 0 }
  ];

  // Flujo de Datos (últimas 24h)
  const dataFlow = [
    { hour: '00:00', events: 12500, packets: 25000 },
    { hour: '04:00', events: 8200, packets: 16400 },
    { hour: '08:00', events: 18500, packets: 37000 },
    { hour: '12:00', events: 22000, packets: 44000 },
    { hour: '16:00', events: 20500, packets: 41000 },
    { hour: '20:00', events: 15000, packets: 30000 }
  ];

  // Distribución de Eventos por Tipo
  const eventDistribution = [
    { name: 'Telemetría', value: 45000, color: '#10B981' },
    { name: 'Alertas', value: 8500, color: '#F59E0B' },
    { name: 'GNSS', value: 62000, color: '#3B82F6' },
    { name: 'Comandos', value: 1200, color: '#8B5CF6' }
  ];

  // Incidentes Recientes
  const recentIncidents = [
    { id: 'INC-001', service: 'Data Pipeline', severity: 'medium', description: 'Alta latencia en procesamiento', time: 'Hace 2h', resolved: false },
    { id: 'INC-002', service: 'Evidence Layer', severity: 'low', description: 'Almacenamiento al 85%', time: 'Hace 5h', resolved: false },
    { id: 'INC-003', service: 'Alert Engine', severity: 'high', description: 'Pico de carga inusual', time: 'Hace 8h', resolved: true }
  ];

  // Métricas de Performance
  const performanceMetrics = [
    { metric: 'Throughput', value: '25K req/s', status: 'good' },
    { metric: 'Error Rate', value: '0.03%', status: 'good' },
    { metric: 'CPU Usage', value: '62%', status: 'good' },
    { metric: 'Memory Usage', value: '78%', status: 'warning' },
    { metric: 'Disk I/O', value: '45%', status: 'good' },
    { metric: 'Network', value: '320 Mbps', status: 'good' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'degraded': return 'warning';
      case 'offline': return 'destructive';
      default: return 'secondary';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl font-bold">Dashboard CCO - RACK</h1>
          </div>
          <p className="text-muted-foreground">
            Centro de Control Operacional - Real-time Architecture Control Kit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="w-3 h-3 mr-1 animate-pulse" />
            Sistema Operacional
          </Badge>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-4">
        {mainKPIs.map((kpi) => {
          const percentage = (kpi.value / kpi.target) * 100;
          const isGood = kpi.id === 'latency' ? kpi.value <= kpi.target : percentage >= 95;

          return (
            <Card key={kpi.id} className={isGood ? 'border-green-500' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
                {isGood ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpi.value}{kpi.unit}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: {kpi.target}{kpi.unit}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : kpi.trend === 'down' ? (
                    <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                  ) : (
                    <Activity className="h-3 w-3 text-gray-400" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {kpi.trend === 'up' ? 'Mejorando' : kpi.trend === 'down' ? 'Decreciendo' : 'Estable'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Servicios RACK</TabsTrigger>
          <TabsTrigger value="dataflow">Flujo de Datos</TabsTrigger>
          <TabsTrigger value="incidents">Incidentes</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Tab: Servicios RACK */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Servicios</CardTitle>
              <CardDescription>
                Monitoreo en tiempo real de componentes RACK
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rackServices.map((service) => (
                  <div key={service.service} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Shield className="w-5 h-5 text-amber-500" />
                      <div className="flex-1">
                        <p className="font-medium">{service.service}</p>
                        <p className="text-sm text-muted-foreground">
                          Uptime: {service.uptime}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {service.alerts > 0 && (
                        <Badge variant="destructive">
                          {service.alerts} {service.alerts === 1 ? 'alerta' : 'alertas'}
                        </Badge>
                      )}
                      <Badge variant={getStatusColor(service.status)}>
                        {service.status === 'online' ? 'En Línea' : service.status === 'degraded' ? 'Degradado' : 'Fuera de Línea'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Distribución de Eventos */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Eventos (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={eventDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {eventDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen de Eventos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {eventDistribution.map((event) => (
                  <div key={event.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color }} />
                      <span className="text-sm">{event.name}</span>
                    </div>
                    <span className="font-semibold">{event.value.toLocaleString('es-CO')}</span>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total</span>
                    <span className="text-lg font-bold">
                      {eventDistribution.reduce((sum, e) => sum + e.value, 0).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Flujo de Datos */}
        <TabsContent value="dataflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flujo de Datos (Últimas 24 Horas)</CardTitle>
              <CardDescription>
                Eventos procesados y paquetes transmitidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dataFlow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="events" stroke="#10B981" strokeWidth={2} name="Eventos" />
                  <Line type="monotone" dataKey="packets" stroke="#3B82F6" strokeWidth={2} name="Paquetes" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Incidentes */}
        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incidentes Recientes</CardTitle>
              <CardDescription>
                {recentIncidents.filter(i => !i.resolved).length} incidentes activos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentIncidents.map((incident) => (
                  <div key={incident.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    {incident.resolved ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{incident.id}</span>
                        <Badge variant={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        {incident.resolved && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">Resuelto</Badge>
                        )}
                      </div>
                      <p className="text-sm">{incident.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {incident.service}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {incident.time}
                        </span>
                      </div>
                    </div>
                    {!incident.resolved && (
                      <Button size="sm" variant="outline">
                        Resolver
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Performance */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {performanceMetrics.map((metric) => (
              <Card key={metric.metric}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.metric}</CardTitle>
                  {metric.status === 'good' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.status === 'good' ? 'Normal' : 'Requiere atención'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
