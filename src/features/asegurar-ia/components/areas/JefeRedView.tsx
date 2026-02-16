import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Network, Server, Wifi, Activity, AlertTriangle,
  CheckCircle2, Settings, Wrench, MapPin
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Dashboard de Jefe de Red - Gestión de Infraestructura
export default function JefeRedView() {
  // Estado de Dispositivos
  const deviceStatus = [
    { name: 'Online', value: 234, color: '#10B981' },
    { name: 'Offline', value: 8, color: '#EF4444' },
    { name: 'Maintenance', value: 5, color: '#F59E0B' }
  ];

  // Uptime por Región
  const uptimeByRegion = [
    { region: 'Pasto', uptime: 99.95, devices: 85 },
    { region: 'Popayán', uptime: 99.88, devices: 62 },
    { region: 'Cali', uptime: 99.92, devices: 48 },
    { region: 'Ipiales', uptime: 99.78, devices: 32 },
    { region: 'Tumaco', uptime: 99.85, devices: 20 }
  ];

  // Incidentes Recientes
  const recentIncidents = [
    {
      id: 1,
      device: 'Gateway-PST-042',
      location: 'Pasto Centro',
      issue: 'Pérdida temporal de señal',
      severity: 'medium',
      status: 'resolved',
      time: '2h ago',
      downtime: '15min'
    },
    {
      id: 2,
      device: 'Sensor-CAL-018',
      location: 'Cali Norte',
      issue: 'Batería baja (<10%)',
      severity: 'low',
      status: 'in_progress',
      time: '4h ago',
      downtime: '-'
    },
    {
      id: 3,
      device: 'Gateway-IPI-007',
      location: 'Ipiales',
      issue: 'Falla de conectividad',
      severity: 'high',
      status: 'resolved',
      time: '1d ago',
      downtime: '2h 30min'
    }
  ];

  // Mantenimientos Programados
  const scheduledMaintenance = [
    {
      id: 1,
      task: 'Actualización firmware gateways - Lote 1',
      devices: 45,
      date: '2026-02-16',
      duration: '2h',
      impact: 'low',
      responsible: 'Técnico A'
    },
    {
      id: 2,
      task: 'Reemplazo baterías - Sensores zona Tumaco',
      devices: 12,
      date: '2026-02-18',
      duration: '1 día',
      impact: 'medium',
      responsible: 'Técnico B + Técnico C'
    },
    {
      id: 3,
      task: 'Instalación nuevos dispositivos - Cauca',
      devices: 25,
      date: '2026-02-25',
      duration: '3 días',
      impact: 'none',
      responsible: 'Equipo completo'
    }
  ];

  // Inventario Técnico
  const technicalInventory = [
    { item: 'Gateways GPS', stock: 247, min: 200, max: 300, status: 'ok' },
    { item: 'Sensores Temperatura', stock: 156, min: 150, max: 200, status: 'ok' },
    { item: 'Baterías Repuesto', stock: 45, min: 50, max: 100, status: 'low' },
    { item: 'Antenas 4G', stock: 28, min: 25, max: 50, status: 'ok' },
    { item: 'Cables y Conectores', stock: 180, min: 100, max: 200, status: 'ok' }
  ];

  // Datos de uptime (histórico)
  const uptimeHistory = [
    { week: 'S-8', uptime: 99.87 },
    { week: 'S-7', uptime: 99.91 },
    { week: 'S-6', uptime: 99.85 },
    { week: 'S-5', uptime: 99.93 },
    { week: 'S-4', uptime: 99.88 },
    { week: 'S-3', uptime: 99.95 },
    { week: 'S-2', uptime: 99.92 },
    { week: 'S-1', uptime: 99.92 }
  ];

  // Tráfico de Red
  const networkTraffic = [
    { hour: '00:00', packets: 1200 },
    { hour: '04:00', packets: 980 },
    { hour: '08:00', packets: 2100 },
    { hour: '12:00', packets: 2800 },
    { hour: '16:00', packets: 2650 },
    { hour: '20:00', packets: 2200 },
    { hour: '23:59', packets: 1500 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Network className="w-8 h-8 text-green-500" />
            <h1 className="text-3xl font-bold">Dashboard de Jefe de Red</h1>
          </div>
          <p className="text-muted-foreground">Infraestructura Técnica y Operaciones de Red</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Wrench className="w-4 h-4 mr-2" />
            Nuevo Mantenimiento
          </Button>
          <Button size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </Button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Uptime Global</CardDescription>
            <CardTitle className="text-3xl text-green-500">99.92%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-muted-foreground">Target: 99.9%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Dispositivos Activos</CardDescription>
            <CardTitle className="text-3xl">234<span className="text-lg text-muted-foreground">/247</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-500">
              94.7% online
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Incidentes Este Mes</CardDescription>
            <CardTitle className="text-3xl">28</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Avg resolución: 45min
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mantenimientos Programados</CardDescription>
            <CardTitle className="text-3xl">{scheduledMaintenance.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Próximo: {scheduledMaintenance[0].date}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
          <TabsTrigger value="incidents">Incidentes</TabsTrigger>
          <TabsTrigger value="maintenance">Mantenimientos</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Estado de Dispositivos */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de Dispositivos</CardTitle>
                <CardDescription>247 dispositivos totales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={deviceStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, value, percent}) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {deviceStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Uptime por Región */}
            <Card>
              <CardHeader>
                <CardTitle>Uptime por Región</CardTitle>
                <CardDescription>5 regiones principales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uptimeByRegion.map((region) => (
                    <div key={region.region}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{region.region}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{region.devices} devices</Badge>
                          <span className="text-sm font-semibold text-green-500">{region.uptime}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${(region.uptime - 99) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Historial de Uptime */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Uptime Histórico</CardTitle>
                <CardDescription>Últimas 8 semanas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={uptimeHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[99.7, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="uptime" stroke="#10B981" strokeWidth={3} dot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incidentes Recientes</CardTitle>
              <CardDescription>Últimas 24 horas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentIncidents.map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`w-5 h-5 ${
                          incident.severity === 'high' ? 'text-red-500' :
                          incident.severity === 'medium' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`} />
                        <h4 className="font-semibold">{incident.device}</h4>
                        <Badge variant={incident.status === 'resolved' ? 'default' : 'secondary'}>
                          {incident.status === 'resolved' ? 'Resuelto' : 'En Progreso'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <strong>Ubicación:</strong> {incident.location}
                        </div>
                        <div>
                          <strong>Problema:</strong> {incident.issue}
                        </div>
                        <div>
                          <strong>Downtime:</strong> {incident.downtime}
                        </div>
                        <div>
                          <strong>Hace:</strong> {incident.time}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Ver Detalles</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mantenimientos Programados</CardTitle>
              <CardDescription>Próximas intervenciones técnicas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledMaintenance.map((maintenance) => (
                  <div key={maintenance.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="w-5 h-5 text-blue-500" />
                          <h4 className="font-semibold">{maintenance.task}</h4>
                          <Badge variant={
                            maintenance.impact === 'none' ? 'default' :
                            maintenance.impact === 'low' ? 'secondary' :
                            'destructive'
                          }>
                            Impacto: {maintenance.impact === 'none' ? 'Ninguno' : maintenance.impact === 'low' ? 'Bajo' : 'Medio'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <strong>Dispositivos:</strong> {maintenance.devices}
                          </div>
                          <div>
                            <strong>Fecha:</strong> {maintenance.date}
                          </div>
                          <div>
                            <strong>Duración:</strong> {maintenance.duration}
                          </div>
                          <div>
                            <strong>Responsable:</strong> {maintenance.responsible}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Editar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventario Técnico</CardTitle>
              <CardDescription>Control de stock de componentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {technicalInventory.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.item}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.status === 'ok' ? 'default' : 'destructive'}>
                          {item.status === 'ok' ? 'OK' : 'Bajo'}
                        </Badge>
                        <span className="text-sm">
                          <span className="font-semibold">{item.stock}</span>
                          <span className="text-muted-foreground"> / {item.max} máx</span>
                        </span>
                      </div>
                    </div>
                    <div className="relative w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${(item.stock / item.max) * 100}%` }}
                      />
                      <div
                        className="absolute top-0 left-0 h-2 border-l-2 border-yellow-500"
                        style={{ left: `${(item.min / item.max) * 100}%` }}
                        title="Stock mínimo"
                      />
                    </div>
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
