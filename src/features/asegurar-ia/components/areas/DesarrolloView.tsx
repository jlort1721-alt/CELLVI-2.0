import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code, GitBranch, Bug, CheckCircle2, Clock, Zap,
  AlertTriangle, Shield, Cpu, Rocket
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  AreaHeader, ExecutiveKPI, ProgressRing, AIInsight,
  MetricRow, SectionDivider, PriorityBadge
} from '../shared/ExecutiveWidgets';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const projects = [
  { name: 'CELLVI 2.0 - Suite IA', status: 'in_progress', progress: 75, sprints: 8, tasks: { completed: 42, total: 56 }, priority: 'high', lead: 'Dev Lead' },
  { name: 'Mobile App v3.0', status: 'in_progress', progress: 45, sprints: 4, tasks: { completed: 18, total: 40 }, priority: 'high', lead: 'Mobile Lead' },
  { name: 'API Gateway Refactor', status: 'planning', progress: 10, sprints: 2, tasks: { completed: 2, total: 20 }, priority: 'medium', lead: 'Backend Lead' },
  { name: 'Dashboard Analytics', status: 'in_progress', progress: 88, sprints: 6, tasks: { completed: 35, total: 40 }, priority: 'medium', lead: 'Frontend Lead' },
];

const bugs = [
  { id: 'BUG-001', severity: 'high' as const, title: 'Error en sincronización de datos en tiempo real', assignee: 'Dev 1', status: 'in_progress', age: '3d' },
  { id: 'BUG-002', severity: 'medium' as const, title: 'Lag en carga de mapas con +200 dispositivos', assignee: 'Dev 2', status: 'pending', age: '5d' },
  { id: 'BUG-003', severity: 'low' as const, title: 'Typo en labels del dashboard de CCO', assignee: 'Dev 3', status: 'resolved', age: '1d' },
  { id: 'BUG-004', severity: 'high' as const, title: 'Memory leak en WebSocket reconnection', assignee: 'Dev 1', status: 'in_progress', age: '2d' },
  { id: 'BUG-005', severity: 'medium' as const, title: 'Notificaciones duplicadas en mobile', assignee: 'Dev 4', status: 'pending', age: '4d' },
];

const deployments = [
  { version: 'v2.5.3', environment: 'production', status: 'success', date: '2026-02-14', duration: '4m 22s' },
  { version: 'v2.5.4-beta', environment: 'staging', status: 'success', date: '2026-02-15', duration: '3m 45s' },
  { version: 'v2.5.4-rc1', environment: 'staging', status: 'success', date: '2026-02-16', duration: '3m 58s' },
];

const velocityData = [
  { sprint: 'S3', planned: 32, completed: 28 },
  { sprint: 'S4', planned: 35, completed: 33 },
  { sprint: 'S5', planned: 38, completed: 36 },
  { sprint: 'S6', planned: 40, completed: 38 },
  { sprint: 'S7', planned: 42, completed: 40 },
  { sprint: 'S8', planned: 45, completed: 42 },
];

const codeQuality = [
  { metric: 'Cobertura Tests', value: 78, target: 90, color: '#3B82F6' },
  { metric: 'Code Smells', value: 12, target: 5, color: '#F59E0B' },
  { metric: 'Deuda Técnica', value: 15, target: 10, color: '#EF4444' },
  { metric: 'Duplicación', value: 3.2, target: 3, color: '#8B5CF6' },
];

const techStackHealth = [
  { name: 'React 18', status: 'current', color: '#61DAFB' },
  { name: 'TypeScript 5', status: 'current', color: '#3178C6' },
  { name: 'Vite 6', status: 'current', color: '#646CFF' },
  { name: 'Supabase', status: 'current', color: '#3ECF8E' },
  { name: 'Tailwind CSS', status: 'current', color: '#06B6D4' },
];

export default memo(function DesarrolloView() {
  const totalTasks = useMemo(() => projects.reduce((s, p) => s + p.tasks.total, 0), []);
  const completedTasks = useMemo(() => projects.reduce((s, p) => s + p.tasks.completed, 0), []);
  const openBugs = useMemo(() => bugs.filter(b => b.status !== 'resolved').length, []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <AreaHeader
          icon={Code}
          iconColor="#06B6D4"
          title="Dashboard de Desarrollo"
          subtitle="Ingeniería de Software, CI/CD y Calidad de Código"
          status="operational"
        />
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ExecutiveKPI
          title="Proyectos Activos"
          value={projects.filter(p => p.status === 'in_progress').length}
          subtitle={`${projects.length} totales en pipeline`}
          trend={5}
          icon={Rocket}
          accentColor="#06B6D4"
          sparklineData={[2, 2, 3, 3, 3, 3]}
          delay={0}
        />
        <ExecutiveKPI
          title="Tareas Completadas"
          value={`${completedTasks}/${totalTasks}`}
          subtitle={`${Math.round(completedTasks / totalTasks * 100)}% completado`}
          trend={8}
          icon={CheckCircle2}
          accentColor="#10B981"
          sparklineData={[65, 72, 78, 82, 88, 97]}
          delay={0.1}
        />
        <ExecutiveKPI
          title="Bugs Abiertos"
          value={openBugs}
          subtitle={`${bugs.filter(b => b.severity === 'high').length} de alta prioridad`}
          trend={-15}
          icon={Bug}
          accentColor="#F59E0B"
          sparklineData={[8, 7, 6, 5, 5, 4]}
          status={openBugs > 5 ? 'warning' : 'good'}
          delay={0.2}
        />
        <ExecutiveKPI
          title="Deploys Este Mes"
          value={12}
          subtitle="100% exitosos"
          trend={20}
          icon={Zap}
          accentColor="#8B5CF6"
          sparklineData={[8, 9, 10, 10, 11, 12]}
          delay={0.3}
        />
      </div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="projects">
          <TabsList>
            <TabsTrigger value="projects">Proyectos</TabsTrigger>
            <TabsTrigger value="bugs">Bugs</TabsTrigger>
            <TabsTrigger value="velocity">Velocity</TabsTrigger>
            <TabsTrigger value="quality">Calidad</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4 mt-4">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Proyectos en Desarrollo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 border border-border/50 rounded-lg hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <GitBranch className="w-4 h-4 text-cyan-500" />
                          <div>
                            <p className="font-medium text-sm">{project.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Sprint {project.sprints} · {project.lead} · {project.tasks.completed}/{project.tasks.total} tareas
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={project.priority as 'high' | 'medium'} />
                          <Badge variant={project.status === 'in_progress' ? 'default' : 'secondary'} className="text-[10px]">
                            {project.status === 'in_progress' ? 'En Progreso' : 'Planificación'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progreso</span>
                            <span className="font-semibold">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-cyan-500 h-2 rounded-full transition-all"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                        <ProgressRing value={project.progress} size={36} strokeWidth={3} color="#06B6D4" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Deployments */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <SectionDivider title="Deployments Recientes" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deployments.map((deploy, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-cyan-500" />
                        <div>
                          <p className="font-medium text-sm">{deploy.version}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {deploy.environment} · {deploy.date} · {deploy.duration}
                          </p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bugs" className="space-y-4 mt-4">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Registro de Bugs</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="destructive" className="text-[10px]">
                      {bugs.filter(b => b.severity === 'high' && b.status !== 'resolved').length} críticos
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{openBugs} abiertos</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bugs.map((bug, idx) => (
                    <motion.div
                      key={bug.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Bug className={`w-4 h-4 ${bug.severity === 'high' ? 'text-red-500' : bug.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'}`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{bug.id}: {bug.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Asignado: {bug.assignee} · Edad: {bug.age}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={bug.severity as 'high' | 'medium' | 'low'} />
                        {bug.status === 'resolved' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Badge variant={bug.status === 'in_progress' ? 'default' : 'secondary'} className="text-[10px]">
                            {bug.status === 'in_progress' ? 'En curso' : 'Pendiente'}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <SectionDivider title="Insights IA - Desarrollo" />
              </CardHeader>
              <CardContent className="space-y-3">
                <AIInsight
                  type="warning"
                  title="Memory Leak Detectado"
                  description="BUG-004 afecta reconexiones WebSocket. Impacto estimado: 15% de usuarios en mobile. Priorizar fix para v2.5.4."
                  confidence={92}
                  timestamp="Hace 30 minutos"
                />
                <AIInsight
                  type="recommendation"
                  title="Cobertura de Tests Baja"
                  description="78% de cobertura, meta 90%. Módulos más críticos sin cubrir: auth, realtime, notifications. Asignar 2 sprints."
                  confidence={88}
                  timestamp="Hace 1 hora"
                />
                <AIInsight
                  type="achievement"
                  title="Dashboard Analytics: 88% Completado"
                  description="Proyecto adelantado 1 sprint. Estimado de entrega: 20 Feb 2026. Calidad de código excepcional."
                  confidence={95}
                  timestamp="Hace 2 horas"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="velocity" className="space-y-4 mt-4">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Velocidad del Equipo (Story Points por Sprint)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={velocityData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                    <XAxis dataKey="sprint" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="planned" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={28} name="Planificado" />
                    <Bar dataKey="completed" fill="#06B6D4" radius={[4, 4, 0, 0]} maxBarSize={28} name="Completado" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <SectionDivider title="Métricas de Productividad" />
              </CardHeader>
              <CardContent>
                <MetricRow label="Velocidad Promedio" value="39.5 pts" change={8} target="45 pts" color="#06B6D4" />
                <MetricRow label="Predictibilidad" value="93%" change={3} target="95%" color="#10B981" />
                <MetricRow label="Lead Time" value="4.2 días" change={-12} target="3 días" color="#3B82F6" />
                <MetricRow label="Cycle Time" value="2.8 días" change={-8} target="2 días" color="#8B5CF6" />
                <MetricRow label="Throughput" value="12 items/sprint" change={10} color="#F59E0B" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Métricas de Calidad de Código</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {codeQuality.map((item) => (
                      <div key={item.metric}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-muted-foreground">{item.metric}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">meta: {item.target}{item.metric.includes('Cobertura') ? '%' : ''}</span>
                            <span className="text-sm font-bold">{item.value}{item.metric.includes('Cobertura') || item.metric.includes('Duplicación') ? '%' : ''}</span>
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((item.metric.includes('Cobertura') ? item.value / item.target : item.target / item.value) * 100, 100)}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Stack Tecnológico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {techStackHealth.map((tech) => (
                      <div key={tech.name} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tech.color }} />
                          <span className="text-sm font-medium">{tech.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Actualizado
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
});
