import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Megaphone, TrendingUp, Target, Eye, MousePointer,
  Users, BarChart3, Globe, Zap, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  AreaHeader, ExecutiveKPI, ProgressRing, AIInsight,
  MetricRow, SectionDivider
} from '../shared/ExecutiveWidgets';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const campaigns = [
  { name: 'Campaña Digital Q1 2026', status: 'active', reach: 125000, conversions: 2500, roi: 3.2, budget: 15000000, spent: 12000000, channel: 'Google Ads' },
  { name: 'Email Marketing Febrero', status: 'active', reach: 45000, conversions: 890, roi: 2.8, budget: 5000000, spent: 3800000, channel: 'SendGrid' },
  { name: 'Social Media Orgánico', status: 'active', reach: 89000, conversions: 1200, roi: 4.1, budget: 8000000, spent: 6200000, channel: 'Meta + LinkedIn' },
  { name: 'Webinar Cadena de Frío', status: 'completed', reach: 3200, conversions: 180, roi: 5.6, budget: 2000000, spent: 1800000, channel: 'Zoom' },
];

const monthlyPerformance = [
  { month: 'Sep', leads: 320, conversions: 48, revenue: 180 },
  { month: 'Oct', leads: 380, conversions: 55, revenue: 210 },
  { month: 'Nov', leads: 420, conversions: 62, revenue: 245 },
  { month: 'Dic', leads: 390, conversions: 58, revenue: 230 },
  { month: 'Ene', leads: 450, conversions: 68, revenue: 275 },
  { month: 'Feb', leads: 480, conversions: 75, revenue: 310 },
];

const channelDistribution = [
  { name: 'Google Ads', value: 35, color: '#4285F4' },
  { name: 'LinkedIn', value: 25, color: '#0077B5' },
  { name: 'Email', value: 20, color: '#10B981' },
  { name: 'Social Media', value: 15, color: '#E91E63' },
  { name: 'Referidos', value: 5, color: '#F59E0B' },
];

const funnelData = [
  { stage: 'Visitantes', value: 125000, color: '#94A3B8' },
  { stage: 'Leads', value: 4590, color: '#3B82F6' },
  { stage: 'MQLs', value: 1200, color: '#8B5CF6' },
  { stage: 'SQLs', value: 450, color: '#F59E0B' },
  { stage: 'Clientes', value: 75, color: '#10B981' },
];

export default memo(function ComercialMarketingView() {
  const totalReach = useMemo(() => campaigns.reduce((s, c) => s + c.reach, 0), []);
  const totalConversions = useMemo(() => campaigns.reduce((s, c) => s + c.conversions, 0), []);
  const avgROI = useMemo(() => {
    const active = campaigns.filter(c => c.status === 'active');
    return (active.reduce((s, c) => s + c.roi, 0) / active.length).toFixed(1);
  }, []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <AreaHeader
          icon={Megaphone}
          iconColor="#EC4899"
          title="Dashboard Comercial & Marketing"
          subtitle="Estrategia Digital, Campañas y Generación de Demanda"
          status="operational"
        />
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ExecutiveKPI
          title="Leads Generados"
          value="4,590"
          subtitle="Meta: 5,000 este mes"
          trend={12}
          icon={Users}
          accentColor="#EC4899"
          sparklineData={[320, 380, 420, 390, 450, 480]}
          delay={0}
        />
        <ExecutiveKPI
          title="Tasa de Conversión"
          value="5.8%"
          subtitle="Meta: 6.0%"
          trend={8}
          icon={Target}
          accentColor="#3B82F6"
          sparklineData={[4.5, 4.8, 5.0, 5.2, 5.5, 5.8]}
          delay={0.1}
        />
        <ExecutiveKPI
          title="ROI Promedio"
          value={`${avgROI}x`}
          subtitle="Campañas activas"
          trend={15}
          icon={TrendingUp}
          accentColor="#10B981"
          sparklineData={[2.1, 2.3, 2.5, 2.6, 2.8, 3.0]}
          delay={0.2}
        />
        <ExecutiveKPI
          title="Alcance Total"
          value={`${(totalReach / 1000).toFixed(0)}K`}
          subtitle={`${totalConversions.toLocaleString()} conversiones`}
          trend={22}
          icon={Globe}
          accentColor="#F59E0B"
          sparklineData={[180, 200, 220, 235, 250, 262]}
          delay={0.3}
        />
      </div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="campaigns">
          <TabsList>
            <TabsTrigger value="campaigns">Campañas</TabsTrigger>
            <TabsTrigger value="funnel">Embudo</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4 mt-4">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Campañas en Curso</CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {campaigns.filter(c => c.status === 'active').length} activas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.map((campaign, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 border border-border/50 rounded-lg hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Target className="w-4 h-4 text-pink-500" />
                          <div>
                            <p className="font-medium text-sm">{campaign.name}</p>
                            <p className="text-[11px] text-muted-foreground">{campaign.channel}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">ROI: {campaign.roi}x</span>
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                            {campaign.status === 'active' ? 'Activa' : 'Completada'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {campaign.reach.toLocaleString()} alcance
                        </div>
                        <div className="flex items-center gap-1">
                          <MousePointer className="w-3 h-3" />
                          {campaign.conversions} conversiones
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span>Presupuesto</span>
                            <span className="font-semibold">{Math.round(campaign.spent / campaign.budget * 100)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-1.5">
                            <div
                              className="bg-pink-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funnel" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Embudo de Conversión</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={funnelData} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                      <YAxis dataKey="stage" type="category" tick={{ fontSize: 10 }} width={80} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                        formatter={(value: number) => [value.toLocaleString(), 'Cantidad']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                        {funnelData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Distribución por Canal</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={channelDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {channelDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Conversion Rates */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <SectionDivider title="Tasas de Conversión por Etapa" />
              </CardHeader>
              <CardContent>
                <MetricRow label="Visitante → Lead" value="3.67%" change={8} target="4%" color="#3B82F6" />
                <MetricRow label="Lead → MQL" value="26.1%" change={5} target="30%" color="#8B5CF6" />
                <MetricRow label="MQL → SQL" value="37.5%" change={12} target="40%" color="#F59E0B" />
                <MetricRow label="SQL → Cliente" value="16.7%" change={3} target="20%" color="#10B981" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Leads vs Conversiones (Mensual)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={monthlyPerformance} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="leads" stroke="#EC4899" fill="#EC4899" fillOpacity={0.1} strokeWidth={2} name="Leads" />
                      <Area type="monotone" dataKey="conversions" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} name="Conversiones" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Revenue por Marketing (M COP)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={monthlyPerformance} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} name="Revenue" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <SectionDivider title="Insights IA - Marketing" />
              </CardHeader>
              <CardContent className="space-y-3">
                <AIInsight
                  type="prediction"
                  title="Proyección Q2: +34% Leads"
                  description="Basado en tendencia actual, se proyectan 6,200 leads para Q2 2026. Aumentar inversión en LinkedIn puede acelerar esto."
                  confidence={82}
                  timestamp="Hace 20 minutos"
                />
                <AIInsight
                  type="recommendation"
                  title="Optimizar Canal Email"
                  description="Email marketing tiene el mejor ROI (4.1x). Incrementar frecuencia de nurture sequences puede mejorar conversiones 15%."
                  confidence={88}
                  timestamp="Hace 1 hora"
                />
                <AIInsight
                  type="achievement"
                  title="Webinar: ROI Excepcional"
                  description="El webinar 'Cadena de Frío' alcanzó ROI de 5.6x, el más alto del trimestre. Planificar serie mensual."
                  confidence={99}
                  timestamp="Hace 3 horas"
                />
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <SectionDivider title="Métricas Clave Marketing" />
              </CardHeader>
              <CardContent>
                <MetricRow label="Costo por Lead (CPL)" value="$6,520" change={-12} target="$5,000" color="#EC4899" />
                <MetricRow label="Customer Acquisition Cost" value="$398K" change={-5} target="$350K" color="#3B82F6" />
                <MetricRow label="Engagement Rate" value="4.2%" change={6} target="4.5%" color="#10B981" />
                <MetricRow label="Email Open Rate" value="28.5%" change={4} target="30%" color="#F59E0B" />
                <MetricRow label="Audiencia Total" value="259K" change={12} color="#8B5CF6" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
});
