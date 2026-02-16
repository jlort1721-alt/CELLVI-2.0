import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, UserPlus, Phone, Mail, TrendingUp, Star,
  DollarSign, Target, CheckCircle2, Clock, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
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

const clients = [
  { name: 'TransNariño SAS', contact: 'Juan Pérez', status: 'active', revenue: 45000000, satisfaction: 4.5, since: '2023-06' },
  { name: 'FrioExpress Cauca', contact: 'María López', status: 'active', revenue: 32000000, satisfaction: 4.8, since: '2024-01' },
  { name: 'LogiCold Pasto', contact: 'Carlos Gómez', status: 'active', revenue: 28000000, satisfaction: 4.2, since: '2023-11' },
  { name: 'Carga Segura SAS', contact: 'Ana Torres', status: 'pending', revenue: 0, satisfaction: 0, since: '' },
  { name: 'TempControl Cali', contact: 'Roberto Díaz', status: 'active', revenue: 18500000, satisfaction: 4.6, since: '2024-03' },
];

const leads = [
  { name: 'Farma Express', source: 'Web', probability: 75, value: 25000000, stage: 'negotiation', daysInStage: 8 },
  { name: 'AgroFrío Nariño', source: 'Referido', probability: 50, value: 18000000, stage: 'proposal', daysInStage: 12 },
  { name: 'Vacunas del Sur', source: 'Evento', probability: 85, value: 35000000, stage: 'closing', daysInStage: 3 },
  { name: 'PescaFresh', source: 'LinkedIn', probability: 30, value: 12000000, stage: 'qualification', daysInStage: 20 },
];

const satisfactionTrend = [
  { month: 'Sep', score: 4.1 }, { month: 'Oct', score: 4.2 },
  { month: 'Nov', score: 4.3 }, { month: 'Dic', score: 4.4 },
  { month: 'Ene', score: 4.5 }, { month: 'Feb', score: 4.6 },
];

const pipelineByStage = [
  { stage: 'Calificación', value: 12000000, count: 3, color: '#94A3B8' },
  { stage: 'Propuesta', value: 18000000, count: 2, color: '#3B82F6' },
  { stage: 'Negociación', value: 25000000, count: 2, color: '#8B5CF6' },
  { stage: 'Cierre', value: 35000000, count: 1, color: '#10B981' },
];

const revenueByClient = [
  { name: 'TransNariño', revenue: 45, color: '#8B5CF6' },
  { name: 'FrioExpress', revenue: 32, color: '#3B82F6' },
  { name: 'LogiCold', revenue: 28, color: '#10B981' },
  { name: 'TempControl', revenue: 18.5, color: '#F59E0B' },
  { name: 'Otros', revenue: 12, color: '#94A3B8' },
];

const stageColors: Record<string, string> = {
  qualification: 'bg-slate-500/10 text-slate-600',
  proposal: 'bg-blue-500/10 text-blue-600',
  negotiation: 'bg-purple-500/10 text-purple-600',
  closing: 'bg-emerald-500/10 text-emerald-600',
};
const stageLabels: Record<string, string> = {
  qualification: 'Calificación',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  closing: 'Cierre',
};

export default memo(function CRMView() {
  const totalRevenue = useMemo(() => clients.reduce((s, c) => s + c.revenue, 0), []);
  const pipelineTotal = useMemo(() => leads.reduce((s, l) => s + l.value, 0), []);
  const activeClients = useMemo(() => clients.filter(c => c.status === 'active').length, []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <AreaHeader
          icon={Users}
          iconColor="#8B5CF6"
          title="Dashboard CRM"
          subtitle="Gestión de Relaciones con Clientes - CELLVI Cold Chain"
          status="operational"
        />
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ExecutiveKPI
          title="Clientes Activos"
          value={activeClients}
          subtitle="+3 este trimestre"
          trend={12}
          icon={Users}
          accentColor="#8B5CF6"
          sparklineData={[120, 125, 130, 135, 138, 140, 142]}
          delay={0}
        />
        <ExecutiveKPI
          title="Pipeline Activo"
          value={`$${(pipelineTotal / 1000000).toFixed(0)}M`}
          subtitle={`${leads.length} leads en proceso`}
          trend={18}
          icon={Target}
          accentColor="#3B82F6"
          sparklineData={[55, 62, 68, 72, 78, 85, 90]}
          delay={0.1}
        />
        <ExecutiveKPI
          title="Satisfacción"
          value="4.6/5.0"
          subtitle="Promedio global clientes"
          trend={5}
          icon={Star}
          accentColor="#F59E0B"
          sparklineData={[4.1, 4.2, 4.3, 4.3, 4.4, 4.5, 4.6]}
          delay={0.2}
        />
        <ExecutiveKPI
          title="Revenue Mensual"
          value={`$${(totalRevenue / 1000000).toFixed(0)}M`}
          subtitle="Ingresos por clientes activos"
          trend={15}
          icon={DollarSign}
          accentColor="#10B981"
          sparklineData={[62, 65, 68, 71, 73, 75, 77]}
          delay={0.3}
        />
      </div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="clients">
          <TabsList>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-4 mt-4">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Cartera de Clientes</CardTitle>
                  <Badge variant="outline" className="text-[10px]">{clients.length} registros</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clients.map((client, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{client.name}</p>
                          <p className="text-xs text-muted-foreground">Contacto: {client.contact}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {client.status === 'active' && (
                          <>
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                              <span className="text-xs font-semibold">{client.satisfaction}</span>
                            </div>
                            <span className="text-sm font-bold tabular-nums">
                              ${(client.revenue / 1000000).toFixed(0)}M
                            </span>
                          </>
                        )}
                        <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                          {client.status === 'active' ? 'Activo' : 'Pendiente'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pipeline de Ventas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leads.map((lead, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <UserPlus className="w-4 h-4 text-purple-500" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{lead.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Fuente: {lead.source} · {lead.daysInStage}d en etapa
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ProgressRing value={lead.probability} size={32} strokeWidth={3} color="#8B5CF6" />
                          <span className="text-xs font-bold tabular-nums w-12 text-right">
                            ${(lead.value / 1000000).toFixed(0)}M
                          </span>
                          <Badge className={`text-[10px] ${stageColors[lead.stage]}`}>
                            {stageLabels[lead.stage]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pipeline por Etapa</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={pipelineByStage} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                      <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v / 1000000}M`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                        formatter={(value: number) => [`$${(value / 1000000).toFixed(1)}M`, 'Valor']}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {pipelineByStage.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tendencia de Satisfacción</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={satisfactionTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis domain={[3.5, 5]} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="score" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Revenue por Cliente (M COP)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={revenueByClient}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="revenue"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {revenueByClient.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <SectionDivider title="Insights IA - CRM" />
              </CardHeader>
              <CardContent className="space-y-3">
                <AIInsight
                  type="prediction"
                  title="Cierre Probable: Vacunas del Sur"
                  description="85% de probabilidad de cierre esta semana. Valor estimado $35M COP. Recomendar follow-up inmediato."
                  confidence={85}
                  timestamp="Hace 15 minutos"
                />
                <AIInsight
                  type="recommendation"
                  title="Retención Preventiva"
                  description="LogiCold Pasto muestra actividad decreciente. Programar visita ejecutiva para reforzar relación."
                  confidence={78}
                  timestamp="Hace 1 hora"
                />
                <AIInsight
                  type="achievement"
                  title="Satisfacción en Máximo Histórico"
                  description="El índice de satisfacción alcanzó 4.6/5.0, el más alto registrado. FrioExpress lidera con 4.8."
                  confidence={99}
                  timestamp="Hace 2 horas"
                />
              </CardContent>
            </Card>

            {/* Metrics Summary */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <SectionDivider title="Métricas Clave CRM" />
              </CardHeader>
              <CardContent>
                <MetricRow label="Tasa de Retención" value="94%" change={3} target="95%" color="#8B5CF6" />
                <MetricRow label="Tiempo Promedio de Cierre" value="28 días" change={-8} target="25 días" color="#3B82F6" />
                <MetricRow label="Valor Promedio por Cliente" value="$30.8M" change={12} target="$35M" color="#10B981" />
                <MetricRow label="NPS Score" value="72" change={5} target="75" color="#F59E0B" />
                <MetricRow label="Tasa de Conversión" value="32%" change={6} target="35%" color="#EF4444" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
});
