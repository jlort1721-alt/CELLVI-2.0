import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign, TrendingUp, TrendingDown, FileText,
  CreditCard, AlertTriangle, CheckCircle2, Clock, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
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

const financialData = [
  { name: 'Ingresos', value: 2850000000, color: '#10B981' },
  { name: 'Costos Operativos', value: 1950000000, color: '#EF4444' },
  { name: 'Gastos Admin.', value: 420000000, color: '#F59E0B' },
  { name: 'Utilidad Neta', value: 480000000, color: '#3B82F6' },
];

const monthlyRevenue = [
  { month: 'Sep', ingresos: 2200, gastos: 1850, utilidad: 350 },
  { month: 'Oct', ingresos: 2400, gastos: 1920, utilidad: 380 },
  { month: 'Nov', ingresos: 2550, gastos: 1980, utilidad: 420 },
  { month: 'Dic', ingresos: 2700, gastos: 2050, utilidad: 450 },
  { month: 'Ene', ingresos: 2780, gastos: 2100, utilidad: 460 },
  { month: 'Feb', ingresos: 2850, gastos: 2370, utilidad: 480 },
];

const pendingInvoices = [
  { id: 'FV-2026-001', client: 'TransNariño SAS', amount: 15000000, due: '2026-02-20', status: 'pending', daysLeft: 4 },
  { id: 'FV-2026-002', client: 'FrioExpress Cauca', amount: 8500000, due: '2026-02-18', status: 'overdue', daysLeft: -2 },
  { id: 'FV-2026-003', client: 'LogiCold Pasto', amount: 12000000, due: '2026-02-25', status: 'pending', daysLeft: 9 },
  { id: 'FV-2026-004', client: 'TempControl Cali', amount: 6800000, due: '2026-02-28', status: 'pending', daysLeft: 12 },
  { id: 'FV-2026-005', client: 'Carga Segura SAS', amount: 22000000, due: '2026-02-15', status: 'overdue', daysLeft: -1 },
];

const expenseCategories = [
  { category: 'Nómina', value: 850, color: '#3B82F6' },
  { category: 'Infraestructura', value: 420, color: '#8B5CF6' },
  { category: 'Marketing', value: 180, color: '#EC4899' },
  { category: 'Operaciones', value: 320, color: '#10B981' },
  { category: 'Tecnología', value: 280, color: '#F59E0B' },
  { category: 'Otros', value: 120, color: '#94A3B8' },
];

const cashFlowData = [
  { month: 'Sep', inflow: 2300, outflow: 1900 },
  { month: 'Oct', inflow: 2500, outflow: 2000 },
  { month: 'Nov', inflow: 2600, outflow: 2100 },
  { month: 'Dic', inflow: 2800, outflow: 2150 },
  { month: 'Ene', inflow: 2900, outflow: 2200 },
  { month: 'Feb', inflow: 2950, outflow: 2400 },
];

export default memo(function ContabilidadView() {
  const totalInvoicesPending = useMemo(() =>
    pendingInvoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0), []);
  const totalOverdue = useMemo(() =>
    pendingInvoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0), []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <AreaHeader
          icon={DollarSign}
          iconColor="#10B981"
          title="Dashboard de Contabilidad"
          subtitle="Control Financiero, Facturación y Flujo de Caja"
          status="operational"
        />
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ExecutiveKPI
          title="Ingresos del Mes"
          value="$2,850M"
          subtitle="Meta: $3,000M"
          trend={18.5}
          icon={TrendingUp}
          accentColor="#10B981"
          sparklineData={[2200, 2400, 2550, 2700, 2780, 2850]}
          delay={0}
        />
        <ExecutiveKPI
          title="Cuentas por Cobrar"
          value={`$${((totalInvoicesPending + totalOverdue) / 1000000).toFixed(1)}M`}
          subtitle={`${pendingInvoices.length} facturas pendientes`}
          trend={-5}
          icon={FileText}
          accentColor="#3B82F6"
          sparklineData={[42, 38, 40, 36, 35, 33]}
          delay={0.1}
        />
        <ExecutiveKPI
          title="Utilidad Neta"
          value="$480M"
          subtitle="Margen: 16.8%"
          trend={12}
          icon={DollarSign}
          accentColor="#8B5CF6"
          sparklineData={[350, 380, 420, 450, 460, 480]}
          delay={0.2}
        />
        <ExecutiveKPI
          title="Facturas Vencidas"
          value={`$${(totalOverdue / 1000000).toFixed(1)}M`}
          subtitle={`${pendingInvoices.filter(i => i.status === 'overdue').length} facturas`}
          trend={-8}
          icon={AlertTriangle}
          accentColor="#EF4444"
          sparklineData={[45, 38, 42, 35, 32, 30]}
          status="warning"
          delay={0.3}
        />
      </div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Resumen Financiero</TabsTrigger>
            <TabsTrigger value="invoices">Facturación</TabsTrigger>
            <TabsTrigger value="cashflow">Flujo de Caja</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Distribución Financiera</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={financialData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {financialData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                        formatter={(value: number) => [`$${(value / 1000000).toFixed(0)}M`, 'Monto']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Ingresos vs Utilidad (M COP)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={monthlyRevenue} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="ingresos" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} name="Ingresos" />
                      <Area type="monotone" dataKey="utilidad" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} strokeWidth={2} name="Utilidad" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Expense Breakdown */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Desglose de Gastos por Categoría (M COP)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={expenseCategories} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}M`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      formatter={(value: number) => [`$${value}M`, 'Gasto']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {expenseCategories.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Metrics Summary */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <SectionDivider title="Indicadores Financieros" />
              </CardHeader>
              <CardContent>
                <MetricRow label="Margen Bruto" value="31.6%" change={2.5} target="35%" color="#10B981" />
                <MetricRow label="Margen Neto" value="16.8%" change={3.2} target="18%" color="#3B82F6" />
                <MetricRow label="EBITDA" value="$620M" change={8} target="$700M" color="#8B5CF6" />
                <MetricRow label="Ratio de Liquidez" value="1.85" change={5} target="2.0" color="#F59E0B" />
                <MetricRow label="Rotación de Cartera" value="32 días" change={-4} target="30 días" color="#EF4444" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4 mt-4">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Facturas Pendientes</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {pendingInvoices.filter(i => i.status === 'pending').length} pendientes
                    </Badge>
                    <Badge variant="destructive" className="text-[10px]">
                      {pendingInvoices.filter(i => i.status === 'overdue').length} vencidas
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingInvoices.map((invoice, idx) => (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className={`w-5 h-5 ${invoice.status === 'overdue' ? 'text-red-500' : 'text-green-500'}`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{invoice.id} - {invoice.client}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence: {new Date(invoice.due).toLocaleDateString('es-CO')}
                            {invoice.status === 'overdue' && (
                              <span className="text-red-500 ml-2">({Math.abs(invoice.daysLeft)} días vencida)</span>
                            )}
                            {invoice.status === 'pending' && (
                              <span className="text-muted-foreground ml-2">({invoice.daysLeft} días restantes)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm tabular-nums">
                          ${(invoice.amount / 1000000).toFixed(1)}M
                        </span>
                        <Badge variant={invoice.status === 'overdue' ? 'destructive' : 'default'} className="text-[10px]">
                          {invoice.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <SectionDivider title="Insights IA - Contabilidad" />
              </CardHeader>
              <CardContent className="space-y-3">
                <AIInsight
                  type="warning"
                  title="Cartera Vencida Creciente"
                  description="2 facturas vencidas suman $30.5M COP. FrioExpress y Carga Segura requieren gestión de cobro inmediata."
                  confidence={95}
                  timestamp="Hace 10 minutos"
                />
                <AIInsight
                  type="prediction"
                  title="Proyección Cierre Q1"
                  description="Utilidad neta proyectada para Q1: $1,420M COP. 94.7% de probabilidad de cumplir meta trimestral."
                  confidence={87}
                  timestamp="Hace 45 minutos"
                />
                <AIInsight
                  type="recommendation"
                  title="Optimizar Flujo de Caja"
                  description="Reducir rotación de cartera de 32 a 28 días liberaría ~$180M en capital de trabajo. Implementar descuento por pronto pago."
                  confidence={82}
                  timestamp="Hace 2 horas"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow" className="space-y-4 mt-4">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Flujo de Caja - Ingresos vs Egresos (M COP)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={cashFlowData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}M`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      formatter={(value: number) => [`$${value}M`, '']}
                    />
                    <Bar dataKey="inflow" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} name="Ingresos" />
                    <Bar dataKey="outflow" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={32} name="Egresos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <SectionDivider title="Resumen de Caja" />
              </CardHeader>
              <CardContent>
                <MetricRow label="Saldo Disponible" value="$1,250M" change={8} color="#10B981" />
                <MetricRow label="Compromisos Pendientes" value="$680M" change={-3} color="#EF4444" />
                <MetricRow label="Flujo Neto del Mes" value="$550M" change={12} color="#3B82F6" />
                <MetricRow label="Días de Caja" value="45 días" change={5} target="60 días" color="#F59E0B" />
                <MetricRow label="Cobertura de Deuda" value="2.4x" change={3} target="2.5x" color="#8B5CF6" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
});
