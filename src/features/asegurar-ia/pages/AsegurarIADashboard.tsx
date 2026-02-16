import { useState, lazy, Suspense, useMemo, useCallback, memo } from 'react';
import { organizationalAreas, type OrganizationalArea } from '../lib/orgData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  StatusPulse, ExecutiveKPI, ProgressRing, AIInsight,
  AreaHeader, MetricRow, SectionDivider, PriorityBadge
} from '../components/shared/ExecutiveWidgets';
import {
  Crown, Briefcase, Network, Shield, ClipboardList,
  Monitor, DollarSign, Users, TrendingUp, Code,
  Sparkles, Search, Filter, LayoutGrid, List, GitBranch,
  ChevronRight, Building2, Activity, Cpu, BarChart3, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell
} from 'recharts';

// Lazy load area dashboards
const PresidenciaView = lazy(() => import('../components/areas/PresidenciaView'));
const GerenciaGeneralView = lazy(() => import('../components/areas/GerenciaGeneralView'));
const JefeRedView = lazy(() => import('../components/areas/JefeRedView'));
const CCORackView = lazy(() => import('../components/areas/CCORackView'));
const AsistenteGerenciaView = lazy(() => import('../components/areas/AsistenteGerenciaView'));
const OperadorCELLVIView = lazy(() => import('../components/areas/OperadorCELLVIView'));
const ContabilidadView = lazy(() => import('../components/areas/ContabilidadView'));
const CRMView = lazy(() => import('../components/areas/CRMView'));
const ComercialMarketingView = lazy(() => import('../components/areas/ComercialMarketingView'));
const DesarrolloView = lazy(() => import('../components/areas/DesarrolloView'));

const iconMap: Record<string, React.ElementType> = {
  Crown, Briefcase, Network, Shield, ClipboardList,
  Monitor, DollarSign, Users, TrendingUp, Code
};

type ViewMode = 'grid' | 'list' | 'orgchart';
type StatusFilter = 'all' | 'green' | 'yellow' | 'red';

const mapStatus = (s: string): 'operational' | 'warning' | 'critical' =>
  s === 'green' ? 'operational' : s === 'yellow' ? 'warning' : 'critical';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ─── Area Grid Card ─────────────────────────────────────
const AreaGridCard = memo(({ area, onSelect }: { area: OrganizationalArea; onSelect: (a: OrganizationalArea) => void; index: number }) => {
  const Icon = iconMap[area.icon] || Briefcase;
  const perf = useMemo(() => {
    if (area.kpis.length === 0) return 0;
    return Math.round(area.kpis.reduce((s, k) => s + (k.value / k.target) * 100, 0) / area.kpis.length);
  }, [area.kpis]);

  return (
    <motion.div variants={itemVariants}>
      <Card
        className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
        onClick={() => onSelect(area)}
      >
        <div
          className="absolute top-0 left-0 w-1 h-full group-hover:w-1.5 transition-all duration-300"
          style={{ backgroundColor: area.color }}
        />
        <CardContent className="p-4 pl-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${area.color}15` }}>
              <Icon className="w-5 h-5" style={{ color: area.color }} />
            </div>
            <StatusPulse status={mapStatus(area.status)} size="sm" />
          </div>

          <h3 className="font-bold text-sm mb-0.5">{area.code}. {area.name}</h3>
          <p className="text-[11px] text-muted-foreground mb-3 line-clamp-1">{area.description}</p>

          {/* Leader */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: `linear-gradient(135deg, ${area.color}, ${area.color}99)` }}
            >
              {area.leader.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="text-xs font-medium leading-tight">{area.leader.name}</p>
              <p className="text-[10px] text-muted-foreground">{area.leader.title}</p>
            </div>
          </div>

          {/* Top 2 KPIs */}
          <div className="space-y-1.5 mb-3">
            {area.kpis.slice(0, 2).map(kpi => (
              <div key={kpi.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate mr-2">{kpi.name}</span>
                <span className="font-semibold tabular-nums whitespace-nowrap">
                  {kpi.unit === 'COP' ? `$${(kpi.value / 1000000).toFixed(0)}M` :
                   kpi.unit === '%' ? `${kpi.value}%` : kpi.value}
                </span>
              </div>
            ))}
          </div>

          {/* Footer with ProgressRing */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <ProgressRing value={perf} size={36} strokeWidth={3} color={area.color} />
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: area.color }}
            >
              Abrir <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
AreaGridCard.displayName = 'AreaGridCard';

// ─── Area List Row ──────────────────────────────────────
const AreaListRow = memo(({ area, onSelect }: { area: OrganizationalArea; onSelect: (a: OrganizationalArea) => void }) => {
  const Icon = iconMap[area.icon] || Briefcase;
  const perf = useMemo(() => {
    if (area.kpis.length === 0) return 0;
    return Math.round(area.kpis.reduce((s, k) => s + (k.value / k.target) * 100, 0) / area.kpis.length);
  }, [area.kpis]);

  return (
    <motion.div variants={itemVariants}>
      <Card
        className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-all cursor-pointer"
        onClick={() => onSelect(area)}
      >
        <CardContent className="p-3 flex items-center gap-4">
          <div className="w-1 h-12 rounded-full" style={{ backgroundColor: area.color }} />
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${area.color}15` }}>
            <Icon className="w-4 h-4" style={{ color: area.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{area.code}. {area.name}</p>
            <p className="text-xs text-muted-foreground">{area.leader.name} - {area.leader.title}</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {area.kpis.slice(0, 2).map(kpi => (
              <div key={kpi.id} className="text-right">
                <p className="text-xs text-muted-foreground">{kpi.name}</p>
                <p className="text-sm font-semibold tabular-nums">
                  {kpi.unit === 'COP' ? `$${(kpi.value / 1000000).toFixed(0)}M` :
                   kpi.unit === '%' ? `${kpi.value}%` : kpi.value}
                </p>
              </div>
            ))}
          </div>
          <ProgressRing value={perf} size={40} strokeWidth={3} color={area.color} />
          <StatusPulse status={mapStatus(area.status)} size="sm" />
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </motion.div>
  );
});
AreaListRow.displayName = 'AreaListRow';

// ─── Org Chart SVG ──────────────────────────────────────
const OrgChartSVG = memo(({ onSelect }: { onSelect: (a: OrganizationalArea) => void }) => {
  const presidency = organizationalAreas.find(a => a.id === 'presidencia')!;
  const management = organizationalAreas.find(a => a.id === 'gerencia-general')!;
  const operational = organizationalAreas.filter(a => a.id !== 'presidencia' && a.id !== 'gerencia-general');
  const w = 880, nodeW = 100, nodeH = 50;
  const cols = 4;
  const rows = Math.ceil(operational.length / cols);

  return (
    <div className="overflow-x-auto py-4">
      <svg width={w} height={220 + rows * 70} viewBox={`0 0 ${w} ${220 + rows * 70}`} className="mx-auto">
        {/* Presidency */}
        <g onClick={() => onSelect(presidency)} className="cursor-pointer">
          <rect x={w / 2 - nodeW / 2} y={10} width={nodeW} height={nodeH} rx={8} fill={presidency.color} />
          <text x={w / 2} y={32} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">Presidencia</text>
          <text x={w / 2} y={47} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9">M. Romulo</text>
        </g>
        {/* Line P -> G */}
        <line x1={w / 2} y1={60} x2={w / 2} y2={80} stroke="currentColor" strokeWidth="1.5" className="text-border" />
        {/* Management */}
        <g onClick={() => onSelect(management)} className="cursor-pointer">
          <rect x={w / 2 - nodeW / 2} y={80} width={nodeW} height={nodeH} rx={8} fill={management.color} />
          <text x={w / 2} y={102} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">Ger. General</text>
          <text x={w / 2} y={117} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9">D. Lopez</text>
        </g>
        {/* Line G -> horizontal */}
        <line x1={w / 2} y1={130} x2={w / 2} y2={150} stroke="currentColor" strokeWidth="1.5" className="text-border" />
        {/* Horizontal bar */}
        {operational.length > 0 && (
          <line
            x1={w / 2 - ((Math.min(cols, operational.length) - 1) * (nodeW + 10)) / 2}
            y1={150}
            x2={w / 2 + ((Math.min(cols, operational.length) - 1) * (nodeW + 10)) / 2}
            y2={150}
            stroke="currentColor" strokeWidth="1.5" className="text-border"
          />
        )}
        {/* Operational area nodes */}
        {operational.map((area, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const colsInRow = Math.min(cols, operational.length - row * cols);
          const rowW = (colsInRow - 1) * (nodeW + 10);
          const sx = w / 2 - rowW / 2;
          const x = sx + col * (nodeW + 10) - nodeW / 2;
          const y = 160 + row * 70;
          const cx = x + nodeW / 2;

          return (
            <g key={area.id} onClick={() => onSelect(area)} className="cursor-pointer">
              {row === 0 && <line x1={cx} y1={150} x2={cx} y2={y} stroke="currentColor" strokeWidth="1" className="text-border" />}
              {row > 0 && <line x1={w / 2} y1={150} x2={cx} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" className="text-border" opacity={0.5} />}
              <rect x={x} y={y} width={nodeW} height={nodeH} rx={6} fill={area.color} opacity={0.9} />
              <circle cx={x + nodeW - 8} cy={y + 8} r={3} fill={area.status === 'green' ? '#10B981' : area.status === 'yellow' ? '#F59E0B' : '#EF4444'} />
              <text x={cx} y={y + 22} textAnchor="middle" fill="white" fontSize="9" fontWeight="600">
                {area.name.length > 14 ? area.name.slice(0, 12) + '..' : area.name}
              </text>
              <text x={cx} y={y + 37} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8">
                {area.leader.name.split(' ')[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});
OrgChartSVG.displayName = 'OrgChartSVG';

// ─── Performance Chart ──────────────────────────────────
const PerformanceChart = memo(() => {
  const chartData = useMemo(() =>
    organizationalAreas
      .map(area => ({
        name: area.name.length > 12 ? area.name.slice(0, 10) + '..' : area.name,
        perf: area.kpis.length > 0
          ? Math.round(area.kpis.reduce((s, k) => s + (k.value / k.target) * 100, 0) / area.kpis.length)
          : 0,
        color: area.color,
      }))
      .sort((a, b) => b.perf - a.perf),
    []
  );

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Rendimiento Comparativo por Area</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px]">Tiempo real</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 32 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10 }} domain={[0, 130]} tickFormatter={(v) => `${v}%`} />
            <RechartsTooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              formatter={(value: number) => [`${value}%`, 'Rendimiento']}
            />
            <Bar dataKey="perf" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
PerformanceChart.displayName = 'PerformanceChart';

// ─── AI Command Panel ───────────────────────────────────
const aiInsights = [
  { type: 'prediction' as const, title: 'Proyeccion Crecimiento Q2', description: 'Se proyecta crecimiento del 22% para el proximo trimestre. Areas de mayor impacto: CRM (+28%) y Comercial (+34%).', confidence: 87, timestamp: 'Hace 12 minutos' },
  { type: 'recommendation' as const, title: 'Optimizar Cobertura Tests', description: 'Desarrollo tiene cobertura al 78%. Asignar 2 sprints podria llevarla al 90%, reduciendo bugs criticos en 35%.', confidence: 92, timestamp: 'Hace 28 minutos' },
  { type: 'achievement' as const, title: 'CCO-RACK: Meta Superada', description: 'Centro de Control redujo tiempo de respuesta en 8.7%, superando la meta con promedio de 4.2 min.', confidence: 99, timestamp: 'Hace 1 hora' },
  { type: 'warning' as const, title: 'Cartera por Vencer', description: '3 cuentas con saldo significativo por vencer esta semana. Accion inmediata recomendada en Contabilidad.', confidence: 94, timestamp: 'Hace 2 horas' },
  { type: 'recommendation' as const, title: 'Expansion Sector Salud', description: 'Oportunidad en cadena de frio para sector salud. ROI estimado 340% con inversion moderada.', confidence: 78, timestamp: 'Hace 3 horas' },
  { type: 'prediction' as const, title: 'Pico de Carga Operativa', description: 'Aumento del 40% en monitoreo la proxima semana por temporada alta. Reforzar turnos en CCO.', confidence: 83, timestamp: 'Hace 4 horas' },
];

// ─── Loading Spinner ────────────────────────────────────
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-3">
    <div className="relative">
      <div className="w-10 h-10 border-2 border-amber-500/20 rounded-full" />
      <div className="absolute inset-0 w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
    <p className="text-xs text-muted-foreground animate-pulse">Cargando dashboard...</p>
  </div>
);

// ─── MAIN DASHBOARD ─────────────────────────────────────
export default function AsegurarIADashboard() {
  const [selectedArea, setSelectedArea] = useState<OrganizationalArea | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredAreas = useMemo(() => {
    let areas = organizationalAreas;
    if (statusFilter !== 'all') areas = areas.filter(a => a.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      areas = areas.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.leader.name.toLowerCase().includes(q) ||
        a.code.toString().includes(q)
      );
    }
    return areas;
  }, [searchQuery, statusFilter]);

  const totalKPIs = useMemo(() => organizationalAreas.reduce((acc, a) => acc + a.kpis.length, 0), []);
  const avgPerformance = useMemo(() => {
    const total = organizationalAreas.reduce((acc, area) => {
      const p = area.kpis.length > 0 ? area.kpis.reduce((s, k) => s + (k.value / k.target) * 100, 0) / area.kpis.length : 0;
      return acc + p;
    }, 0);
    return Math.round((total / organizationalAreas.length) * 10) / 10;
  }, []);
  const healthyAreas = useMemo(() => organizationalAreas.filter(a => a.status === 'green').length, []);

  const handleSelectArea = useCallback((area: OrganizationalArea) => setSelectedArea(area), []);
  const handleBack = useCallback(() => setSelectedArea(null), []);

  const renderDashboard = useCallback(() => {
    if (!selectedArea) return null;
    switch (selectedArea.id) {
      case 'presidencia': return <PresidenciaView />;
      case 'gerencia-general': return <GerenciaGeneralView />;
      case 'jefe-red': return <JefeRedView />;
      case 'cco-rack': return <CCORackView />;
      case 'asistente-gerencia': return <AsistenteGerenciaView />;
      case 'operador-cellvi': return <OperadorCELLVIView />;
      case 'contabilidad': return <ContabilidadView />;
      case 'crm': return <CRMView />;
      case 'comercial-marketing': return <ComercialMarketingView />;
      case 'desarrollo': return <DesarrolloView />;
      default: return null;
    }
  }, [selectedArea]);

  // ═══ SELECTED AREA DETAIL VIEW ═══════════════════════
  if (selectedArea) {
    const SelectedIcon = iconMap[selectedArea.icon] || Briefcase;
    return (
      <motion.div
        key="detail"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-2 text-sm">
          <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Asegurar IA</span>
          </button>
          <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
          <span className="font-semibold" style={{ color: selectedArea.color }}>{selectedArea.name}</span>
        </div>

        <AreaHeader
          icon={SelectedIcon}
          iconColor={selectedArea.color}
          title={`${selectedArea.code}. ${selectedArea.name}`}
          subtitle={selectedArea.description}
          status={mapStatus(selectedArea.status)}
          actions={
            <Button variant="outline" size="sm" onClick={handleBack} className="border-border/50">
              Volver a Vista General
            </Button>
          }
        />

        <Suspense fallback={<LoadingSpinner />}>
          {renderDashboard()}
        </Suspense>
      </motion.div>
    );
  }

  // ═══ MAIN EXECUTIVE DASHBOARD ════════════════════════
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="main"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 shadow-sm">
                <Sparkles className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Asegurar IA</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Dashboard Ejecutivo Organizacional - Control Integral de Operaciones
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {([
              { mode: 'grid' as ViewMode, icon: LayoutGrid, label: 'Tarjetas' },
              { mode: 'list' as ViewMode, icon: List, label: 'Lista' },
              { mode: 'orgchart' as ViewMode, icon: GitBranch, label: 'Organigrama' },
            ]).map(({ mode, icon: ModeIcon, label }) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode(mode)}
                className={viewMode === mode ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'border-border/50'}
              >
                <ModeIcon className="w-4 h-4" />
                <span className="hidden sm:inline ml-1.5 text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </motion.div>

        {/* 4 Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ExecutiveKPI
            title="Areas Operativas"
            value={organizationalAreas.length}
            subtitle={`${healthyAreas} en estado optimo`}
            trend={5.2}
            icon={Building2}
            accentColor="#8B5CF6"
            sparklineData={[7, 8, 8, 9, 9, 10, 10]}
            status="good"
            delay={0}
          />
          <ExecutiveKPI
            title="KPIs Monitoreados"
            value={totalKPIs}
            subtitle={`${Math.round(totalKPIs / organizationalAreas.length)} por area`}
            trend={8.3}
            icon={Activity}
            accentColor="#3B82F6"
            sparklineData={[22, 24, 25, 27, 28, 29, 30]}
            status="good"
            delay={0.1}
          />
          <ExecutiveKPI
            title="Rendimiento Global"
            value={`${avgPerformance}%`}
            subtitle="Promedio todas las areas"
            trend={5.2}
            icon={TrendingUp}
            accentColor="#10B981"
            sparklineData={[88, 90, 91, 93, 94, 96, avgPerformance]}
            status={avgPerformance >= 95 ? 'good' : avgPerformance >= 85 ? 'warning' : 'critical'}
            delay={0.2}
          />
          <ExecutiveKPI
            title="Salud IA"
            value={`${Math.round((healthyAreas / organizationalAreas.length) * 100)}%`}
            subtitle={`${healthyAreas}/${organizationalAreas.length} areas saludables`}
            trend={3.1}
            icon={Cpu}
            accentColor="#d4af37"
            sparklineData={[82, 85, 87, 89, 91, 93, 95]}
            status="good"
            delay={0.3}
          />
        </div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar area por nombre, lider o codigo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-card/60 border-border/50 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
            {(['all', 'green', 'yellow', 'red'] as const).map(f => (
              <Button
                key={f}
                variant={statusFilter === f ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(f)}
                className="text-xs h-7"
              >
                {f === 'all' ? 'Todos' : f === 'green' ? 'Optimo' : f === 'yellow' ? 'Atencion' : 'Critico'}
              </Button>
            ))}
          </div>
          <Badge variant="outline" className="text-[10px] h-7 px-2 self-center whitespace-nowrap">
            {filteredAreas.length} de {organizationalAreas.length} areas
          </Badge>
        </motion.div>

        {/* Area Views */}
        <AnimatePresence mode="wait">
          {viewMode === 'grid' && (
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
            >
              {filteredAreas.map((area, i) => (
                <AreaGridCard key={area.id} area={area} onSelect={handleSelectArea} index={i} />
              ))}
              {filteredAreas.length === 0 && (
                <motion.div variants={itemVariants} className="col-span-full flex flex-col items-center py-16 text-muted-foreground">
                  <Search className="w-10 h-10 mb-3 opacity-30" />
                  <p className="font-semibold">No se encontraron areas</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {viewMode === 'list' && (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-2"
            >
              {filteredAreas.map(area => (
                <AreaListRow key={area.id} area={area} onSelect={handleSelectArea} />
              ))}
            </motion.div>
          )}

          {viewMode === 'orgchart' && (
            <motion.div
              key="orgchart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <SectionDivider
                    title="Organigrama de ASEGURAR LTDA"
                    action={<Badge variant="outline" className="text-[10px]">Estructura jerarquica</Badge>}
                  />
                </CardHeader>
                <CardContent>
                  <OrgChartSVG onSelect={handleSelectArea} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Performance Comparison */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <PerformanceChart />
        </motion.div>

        {/* AI Command Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <Brain className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-sm">Centro de Comando IA</CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Analisis predictivo y recomendaciones inteligentes
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiInsights.map((insight, i) => (
                  <AIInsight key={i} {...insight} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Metrics Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <SectionDivider
                title="Resumen Ejecutivo por Area"
                action={<Badge variant="outline" className="text-[10px]">{organizationalAreas.length} areas activas</Badge>}
              />
            </CardHeader>
            <CardContent>
              {organizationalAreas.map(area => {
                const perf = area.kpis.length > 0
                  ? Math.round(area.kpis.reduce((s, k) => s + (k.value / k.target) * 100, 0) / area.kpis.length)
                  : 0;
                const avgChange = area.kpis.length > 0
                  ? Math.round(area.kpis.reduce((s, k) => s + k.change, 0) / area.kpis.length * 10) / 10
                  : 0;
                return (
                  <MetricRow
                    key={area.id}
                    label={`${area.code}. ${area.name}`}
                    value={`${perf}%`}
                    change={avgChange}
                    target="100%"
                    color={area.color}
                  />
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
