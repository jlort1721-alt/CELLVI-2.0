import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Briefcase, Users, Target, TrendingUp, AlertCircle,
  CheckCircle, Calendar, DollarSign, BarChart2
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Dashboard de Gerencia General - Deyanira López
export default function GerenciaGeneralView() {
  // OKRs por Área
  const okrsByArea = [
    {
      area: 'CCO - RACK',
      objectives: 3,
      completed: 2,
      progress: 78,
      health: 'good'
    },
    {
      area: 'Desarrollo',
      objectives: 4,
      completed: 3,
      progress: 72,
      health: 'warning'
    },
    {
      area: 'Comercial',
      objectives: 3,
      completed: 3,
      progress: 95,
      health: 'good'
    },
    {
      area: 'CRM',
      objectives: 2,
      completed: 2,
      progress: 100,
      health: 'good'
    },
    {
      area: 'Jefe Red',
      objectives: 3,
      completed: 2,
      progress: 68,
      health: 'warning'
    }
  ];

  // Control de Presupuestos
  const budgetControl = [
    { area: 'Desarrollo', allocated: 180, spent: 142, percentage: 79 },
    { area: 'Marketing', allocated: 85, spent: 72, percentage: 85 },
    { area: 'Infraestructura', allocated: 120, spent: 98, percentage: 82 },
    { area: 'Operaciones', allocated: 95, spent: 88, percentage: 93 },
    { area: 'CRM', allocated: 45, spent: 38, percentage: 84 }
  ];

  // Reuniones Programadas
  const upcomingMeetings = [
    {
      id: 1,
      title: 'Revisión OKRs Trimestre 1',
      attendees: ['Presidencia', 'Todas las áreas'],
      date: '2026-02-15',
      time: '09:00',
      duration: '2h',
      priority: 'high'
    },
    {
      id: 2,
      title: 'Planning Fase 3 - IA',
      attendees: ['Desarrollo', 'CCO'],
      date: '2026-02-16',
      time: '14:00',
      duration: '1h',
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Revisión Presupuesto Q1',
      attendees: ['Contabilidad', 'Presidencia'],
      date: '2026-02-18',
      time: '10:00',
      duration: '1.5h',
      priority: 'high'
    }
  ];

  // Salud de Equipos
  const teamHealth = [
    { category: 'Productividad', score: 8.4 },
    { category: 'Satisfacción', score: 7.8 },
    { category: 'Colaboración', score: 8.9 },
    { category: 'Innovación', score: 7.5 },
    { category: 'Cumplimiento', score: 8.2 }
  ];

  // Tareas Críticas
  const criticalTasks = [
    {
      id: 1,
      task: 'Finalizar implementación Asegurar IA',
      owner: 'Desarrollo',
      deadline: '2026-02-20',
      status: 'in_progress',
      priority: 'high',
      progress: 85
    },
    {
      id: 2,
      task: 'Certificación ISO 27001 - Documentación',
      owner: 'Múltiples áreas',
      deadline: '2026-03-15',
      status: 'in_progress',
      priority: 'high',
      progress: 65
    },
    {
      id: 3,
      task: 'Expansión Cauca - Due Diligence',
      owner: 'Comercial',
      deadline: '2026-02-28',
      status: 'pending',
      priority: 'medium',
      progress: 30
    }
  ];

  // Datos de eficiencia
  const efficiencyData = [
    { month: 'Ago', efficiency: 82 },
    { month: 'Sep', efficiency: 84 },
    { month: 'Oct', efficiency: 83 },
    { month: 'Nov', efficiency: 86 },
    { month: 'Dic', efficiency: 85 },
    { month: 'Ene', efficiency: 87 },
    { month: 'Feb', efficiency: 87 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Dashboard de Gerencia General</h1>
          </div>
          <p className="text-muted-foreground">Centro de Control Operativo - Deyanira López</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Agendar Reunión
          </Button>
          <Button size="sm">
            <BarChart2 className="w-4 h-4 mr-2" />
            Reporte Semanal
          </Button>
        </div>
      </div>

      {/* Métricas Clave */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Eficiencia Operativa</CardDescription>
            <CardTitle className="text-3xl">87%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-500">+4.2% vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cumplimiento OKRs</CardDescription>
            <CardTitle className="text-3xl">78%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              12/15 objetivos en track
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Salud de Equipos</CardDescription>
            <CardTitle className="text-3xl">8.4<span className="text-lg text-muted-foreground">/10</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-500">+2.1% mejora</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reuniones Esta Semana</CardDescription>
            <CardTitle className="text-3xl">{upcomingMeetings.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {upcomingMeetings.filter(m => m.priority === 'high').length} alta prioridad
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="okrs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="okrs">OKRs</TabsTrigger>
          <TabsTrigger value="budget">Presupuestos</TabsTrigger>
          <TabsTrigger value="meetings">Reuniones</TabsTrigger>
          <TabsTrigger value="tasks">Tareas Críticas</TabsTrigger>
        </TabsList>

        <TabsContent value="okrs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* OKRs por Área */}
            <Card>
              <CardHeader>
                <CardTitle>OKRs por Área</CardTitle>
                <CardDescription>Progreso de objetivos trimestrales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {okrsByArea.map((okr) => (
                    <div key={okr.area}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{okr.area}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={okr.health === 'good' ? 'default' : 'secondary'}>
                            {okr.completed}/{okr.objectives}
                          </Badge>
                          <span className="text-sm font-semibold">{okr.progress}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${okr.health === 'good' ? 'bg-green-500' : 'bg-yellow-500'}`}
                          style={{ width: `${okr.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Salud de Equipos (Radar) */}
            <Card>
              <CardHeader>
                <CardTitle>Salud de Equipos</CardTitle>
                <CardDescription>Evaluación de 5 dimensiones</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={teamHealth}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis domain={[0, 10]} />
                    <Radar name="Score" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Eficiencia Operativa (Trend) */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Eficiencia Operativa - Trend</CardTitle>
                <CardDescription>Últimos 7 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[75, 95]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="efficiency" stroke="#3B82F6" strokeWidth={3} dot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Control de Presupuestos por Área</CardTitle>
              <CardDescription>Asignado vs Gastado (Millones COP)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgetControl.map((budget) => (
                  <div key={budget.area} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{budget.area}</span>
                      <div className="text-sm">
                        <span className="font-semibold">${budget.spent}M</span>
                        <span className="text-muted-foreground"> / ${budget.allocated}M</span>
                        <span className={`ml-2 ${budget.percentage > 90 ? 'text-yellow-500' : 'text-green-500'}`}>
                          ({budget.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${budget.percentage > 90 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${budget.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Próximas Reuniones</CardTitle>
              <CardDescription>{upcomingMeetings.length} reuniones programadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{meeting.title}</h4>
                        <Badge variant={meeting.priority === 'high' ? 'destructive' : 'secondary'}>
                          {meeting.priority === 'high' ? 'Alta' : 'Media'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {meeting.date} - {meeting.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {meeting.attendees.join(', ')}
                        </div>
                        <div>
                          Duración: {meeting.duration}
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

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tareas Críticas</CardTitle>
              <CardDescription>Seguimiento de iniciativas estratégicas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {criticalTasks.map((task) => (
                  <div key={task.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{task.task}</h4>
                          <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                            {task.priority === 'high' ? 'Alta Prioridad' : 'Media Prioridad'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span><strong>Owner:</strong> {task.owner}</span>
                          <span><strong>Deadline:</strong> {task.deadline}</span>
                          <Badge variant={task.status === 'in_progress' ? 'default' : 'secondary'}>
                            {task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-lg font-bold">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${task.progress}%` }}
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
