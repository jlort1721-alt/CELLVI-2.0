import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Crown, TrendingUp, DollarSign, Users, AlertTriangle,
  CheckCircle2, Clock, FileText, BarChart3, Target
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Dashboard Ejecutivo de Alto Nivel para Presidencia
export default function PresidenciaView() {
  // KPIs Ejecutivos
  const executiveKPIs = [
    {
      id: 'revenue',
      name: 'Ingresos Totales',
      value: 2850000000,
      target: 3000000000,
      unit: 'COP',
      icon: DollarSign,
      trend: 15.3,
      color: 'green'
    },
    {
      id: 'growth',
      name: 'Crecimiento YoY',
      value: 18.5,
      target: 20,
      unit: '%',
      icon: TrendingUp,
      trend: 3.2,
      color: 'blue'
    },
    {
      id: 'clients',
      name: 'Clientes Activos',
      value: 247,
      target: 300,
      unit: 'empresas',
      icon: Users,
      trend: 12.1,
      color: 'purple'
    },
    {
      id: 'satisfaction',
      name: 'Satisfacción Global',
      value: 92,
      target: 90,
      unit: '%',
      icon: CheckCircle2,
      trend: 5.1,
      color: 'green'
    }
  ];

  // Aprobaciones Pendientes
  const pendingApprovals = [
    {
      id: 1,
      title: 'Expansión a Cauca - Inversión $450M',
      area: 'Comercial',
      amount: 450000000,
      submittedBy: 'Deyanira López',
      date: '2026-02-10',
      priority: 'high',
      status: 'pending'
    },
    {
      id: 2,
      title: 'Contratación 5 nuevos desarrolladores',
      area: 'Desarrollo',
      amount: 180000000,
      submittedBy: 'Lead Developer',
      date: '2026-02-12',
      priority: 'medium',
      status: 'pending'
    },
    {
      id: 3,
      title: 'Adquisición de 50 nuevos dispositivos GPS',
      area: 'Jefe Red',
      amount: 125000000,
      submittedBy: 'Ingeniero de Red',
      date: '2026-02-13',
      priority: 'medium',
      status: 'pending'
    }
  ];

  // Riesgos Corporativos
  const corporateRisks = [
    {
      id: 1,
      risk: 'Concentración de clientes (top 5 = 65% ingresos)',
      impact: 'high',
      probability: 'medium',
      mitigation: 'Diversificación de cartera en proceso',
      owner: 'CRM'
    },
    {
      id: 2,
      risk: 'Dependencia de un solo proveedor de hardware',
      impact: 'medium',
      probability: 'low',
      mitigation: 'Evaluando proveedores alternativos',
      owner: 'Jefe Red'
    }
  ];

  // Datos para gráficos
  const revenueData = [
    { month: 'Ago', revenue: 215, target: 220 },
    { month: 'Sep', revenue: 228, target: 230 },
    { month: 'Oct', revenue: 242, target: 245 },
    { month: 'Nov', revenue: 255, target: 260 },
    { month: 'Dic', revenue: 278, target: 275 },
    { month: 'Ene', revenue: 285, target: 290 },
    { month: 'Feb', revenue: 285, target: 300 }
  ];

  const areaPerformance = [
    { area: 'Comercial', performance: 95 },
    { area: 'Operaciones', performance: 87 },
    { area: 'CCO', performance: 92 },
    { area: 'Desarrollo', performance: 88 },
    { area: 'CRM', performance: 90 }
  ];

  const strategicGoals = [
    { goal: 'Expansión Regional', progress: 65, deadline: 'Q2 2026' },
    { goal: 'Certificación ISO 27001', progress: 78, deadline: 'Q3 2026' },
    { goal: 'Plataforma IA Completa', progress: 45, deadline: 'Q4 2026' },
    { goal: 'Internacionalización', progress: 25, deadline: 'Q1 2027' }
  ];

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold">Dashboard de Presidencia</h1>
          </div>
          <p className="text-muted-foreground">Vista Ejecutiva - Mayor Rómulo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Generar Reporte
          </Button>
          <Button size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Board Meeting
          </Button>
        </div>
      </div>

      {/* KPIs Ejecutivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {executiveKPIs.map((kpi) => {
          const Icon = kpi.icon;
          const percentage = (kpi.value / kpi.target) * 100;
          return (
            <Card key={kpi.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className={`w-5 h-5 text-${kpi.color}-500`} />
                  <Badge variant={percentage >= 95 ? 'default' : 'secondary'}>
                    {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{kpi.name}</p>
                  <p className="text-2xl font-bold">
                    {kpi.unit === 'COP' ?
                      `$${(kpi.value / 1000000000).toFixed(1)}B` :
                      `${kpi.value}${kpi.unit === '%' ? '%' : ''}`
                    }
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex-1 bg-secondary rounded-full h-1.5">
                      <div
                        className={`bg-${kpi.color}-500 h-1.5 rounded-full`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <span>{percentage.toFixed(0)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="approvals">Aprobaciones</TabsTrigger>
          <TabsTrigger value="risks">Riesgos</TabsTrigger>
          <TabsTrigger value="goals">Metas Estratégicas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Ingresos Mensuales */}
            <Card>
              <CardHeader>
                <CardTitle>Ingresos Mensuales vs Target</CardTitle>
                <CardDescription>Últimos 7 meses (Millones COP)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Real" />
                    <Area type="monotone" dataKey="target" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.2} name="Target" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance por Área */}
            <Card>
              <CardHeader>
                <CardTitle>Performance por Área</CardTitle>
                <CardDescription>Top 5 áreas operativas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={areaPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="area" type="category" />
                    <Tooltip />
                    <Bar dataKey="performance" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aprobaciones Pendientes</CardTitle>
              <CardDescription>
                {pendingApprovals.length} solicitudes requieren su aprobación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{approval.title}</h4>
                        <Badge variant={approval.priority === 'high' ? 'destructive' : 'secondary'}>
                          {approval.priority === 'high' ? 'Alta Prioridad' : 'Media Prioridad'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Área:</span> {approval.area}
                        </div>
                        <div>
                          <span className="font-medium">Solicitado por:</span> {approval.submittedBy}
                        </div>
                        <div>
                          <span className="font-medium">Monto:</span> ${(approval.amount / 1000000).toFixed(0)}M
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Revisar</Button>
                      <Button size="sm">Aprobar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riesgos Corporativos</CardTitle>
              <CardDescription>Principales riesgos identificados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {corporateRisks.map((risk) => (
                  <div key={risk.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-5 h-5 ${risk.impact === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                        <h4 className="font-semibold">{risk.risk}</h4>
                      </div>
                      <Badge>{risk.owner}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Impacto:</span>
                        <span className={`ml-2 font-medium ${risk.impact === 'high' ? 'text-red-500' : 'text-yellow-500'}`}>
                          {risk.impact === 'high' ? 'Alto' : 'Medio'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Probabilidad:</span>
                        <span className="ml-2 font-medium">{risk.probability === 'medium' ? 'Media' : 'Baja'}</span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-muted-foreground">Mitigación:</span>
                        <p className="mt-1">{risk.mitigation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metas Estratégicas 2026</CardTitle>
              <CardDescription>Progreso de objetivos corporativos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {strategicGoals.map((goal, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">{goal.goal}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {goal.deadline}
                        </Badge>
                        <span className="text-sm font-semibold">{goal.progress}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
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
