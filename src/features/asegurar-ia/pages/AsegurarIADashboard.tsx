import { useState, lazy, Suspense } from 'react';
import { organizationalAreas, type OrganizationalArea } from '../lib/orgData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Crown, Briefcase, Network, Shield, ClipboardList,
  Monitor, DollarSign, Users, TrendingUp, Code,
  ArrowUpRight, ArrowDownRight, Minus, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

// Lazy load de dashboards específicos
const PresidenciaView = lazy(() => import('../components/areas/PresidenciaView'));
const GerenciaGeneralView = lazy(() => import('../components/areas/GerenciaGeneralView'));
const JefeRedView = lazy(() => import('../components/areas/JefeRedView'));

const iconMap = {
  Crown, Briefcase, Network, Shield, ClipboardList,
  Monitor, DollarSign, Users, TrendingUp, Code
};

interface AreaCardProps {
  area: OrganizationalArea;
  onSelect: (area: OrganizationalArea) => void;
}

const AreaCard = ({ area, onSelect }: AreaCardProps) => {
  const Icon = iconMap[area.icon as keyof typeof iconMap] || Briefcase;

  const statusColors = {
    green: 'bg-green-500/10 text-green-600 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card
        className="cursor-pointer hover:shadow-lg transition-all border-2"
        onClick={() => onSelect(area)}
        style={{ borderColor: `${area.color}30` }}
      >
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${area.color}20` }}
            >
              <Icon className="w-6 h-6" style={{ color: area.color }} />
            </div>
            <Badge className={statusColors[area.status]} variant="outline">
              {area.status === 'green' ? '✓ Óptimo' :
               area.status === 'yellow' ? '⚠ Atención' :
               '⚠ Crítico'}
            </Badge>
          </div>
          <CardTitle className="text-lg">
            {area.code}. {area.name}
          </CardTitle>
          <CardDescription>{area.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Líder del área */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold/50 flex items-center justify-center text-white font-semibold">
                {area.leader.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{area.leader.name}</p>
                <p className="text-xs text-muted-foreground">{area.leader.title}</p>
              </div>
            </div>

            {/* KPIs principales */}
            <div className="space-y-2">
              {area.kpis.slice(0, 2).map((kpi) => (
                <div key={kpi.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{kpi.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {kpi.unit === 'COP' ?
                        `$${(kpi.value / 1000000).toFixed(1)}M` :
                        `${kpi.value}${kpi.unit !== '/mes' && kpi.unit !== '/día' && kpi.unit !== '/semana' && kpi.unit !== 'activos' && kpi.unit !== 'oportunidades' && kpi.unit !== '/sprint' && kpi.unit !== 'críticos' && kpi.unit !== 'unidades' ? kpi.unit : ''}`
                      }
                    </span>
                    {kpi.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-green-500" />}
                    {kpi.trend === 'down' && <ArrowDownRight className="w-3 h-3 text-red-500" />}
                    {kpi.trend === 'stable' && <Minus className="w-3 h-3 text-gray-500" />}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              style={{ borderColor: area.color, color: area.color }}
            >
              Ver Dashboard →
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const OrganizationalChart = () => {
  return (
    <div className="relative p-8">
      {/* Nivel 1: Presidencia */}
      <div className="flex justify-center mb-12">
        <div className="text-center">
          <div className="w-40 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg flex items-center justify-center mb-2">
            <div className="text-white">
              <Crown className="w-6 h-6 mx-auto mb-1" />
              <p className="font-semibold text-sm">Presidencia</p>
              <p className="text-xs opacity-90">Mayor Rómulo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Línea vertical */}
      <div className="flex justify-center">
        <div className="w-px h-8 bg-border" />
      </div>

      {/* Nivel 2: Gerencia General */}
      <div className="flex justify-center mb-12">
        <div className="text-center">
          <div className="w-40 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg flex items-center justify-center mb-2">
            <div className="text-white">
              <Briefcase className="w-6 h-6 mx-auto mb-1" />
              <p className="font-semibold text-sm">Gerencia General</p>
              <p className="text-xs opacity-90">Deyanira López</p>
            </div>
          </div>
        </div>
      </div>

      {/* Líneas horizontales */}
      <div className="flex justify-center mb-4">
        <div className="w-full max-w-4xl h-px bg-border" />
      </div>

      {/* Nivel 3: Áreas Operativas (Grid 4x2) */}
      <div className="grid grid-cols-4 gap-4 max-w-5xl mx-auto">
        {organizationalAreas.slice(2).map((area) => {
          const Icon = iconMap[area.icon as keyof typeof iconMap] || Briefcase;
          return (
            <div key={area.id} className="text-center">
              <div
                className="w-full h-16 rounded-lg shadow flex items-center justify-center text-white text-xs p-2"
                style={{ backgroundColor: area.color }}
              >
                <div>
                  <Icon className="w-4 h-4 mx-auto mb-1" />
                  <p className="font-semibold leading-tight">{area.name}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function AsegurarIADashboard() {
  const [selectedArea, setSelectedArea] = useState<OrganizationalArea | null>(null);
  const [view, setView] = useState<'grid' | 'chart'>('grid');

  const totalKPIs = organizationalAreas.reduce((acc, area) => acc + area.kpis.length, 0);
  const avgPerformance = organizationalAreas.reduce((acc, area) => {
    const areaPerf = area.kpis.reduce((sum, kpi) => sum + (kpi.value / kpi.target * 100), 0) / area.kpis.length;
    return acc + areaPerf;
  }, 0) / organizationalAreas.length;

  if (selectedArea) {
    // Renderizar dashboard específico si existe
    const renderSpecificDashboard = () => {
      switch (selectedArea.id) {
        case 'presidencia':
          return <PresidenciaView />;
        case 'gerencia-general':
          return <GerenciaGeneralView />;
        case 'jefe-red':
          return <JefeRedView />;
        default:
          return (
            <Card>
              <CardHeader>
                <CardTitle>Dashboard de {selectedArea.name}</CardTitle>
                <CardDescription>
                  Vista detallada del área operativa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-gold" />
                  <p className="text-lg font-semibold mb-2">Dashboard en Construcción</p>
                  <p className="text-sm">
                    El dashboard específico para {selectedArea.name} está siendo desarrollado.
                  </p>
                  <p className="text-sm mt-2">
                    Incluirá: KPIs detallados, gestión de equipo, tareas, y herramientas específicas del área.
                  </p>
                </div>
              </CardContent>
            </Card>
          );
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setSelectedArea(null)}>
            ← Volver a Vista General
          </Button>
          <Badge className="text-lg px-4 py-2" style={{ backgroundColor: selectedArea.color }}>
            {selectedArea.code}. {selectedArea.name}
          </Badge>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          {renderSpecificDashboard()}
        </Suspense>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-8 h-8 text-gold" />
          <h1 className="text-3xl font-bold">Asegurar IA</h1>
        </div>
        <p className="text-muted-foreground">
          Dashboard Organizacional Inteligente - Gestión de las 10 Áreas Operativas
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Áreas Operativas</CardDescription>
            <CardTitle className="text-3xl">{organizationalAreas.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1">
              {organizationalAreas.map(area => (
                <div
                  key={area.id}
                  className="h-2 flex-1 rounded"
                  style={{ backgroundColor: area.color }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>KPIs Totales</CardDescription>
            <CardTitle className="text-3xl">{totalKPIs}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {Math.round(totalKPIs / organizationalAreas.length)} por área en promedio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Performance Global</CardDescription>
            <CardTitle className="text-3xl">{avgPerformance.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-500">+5.2% vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Estado General</CardDescription>
            <CardTitle className="text-3xl text-green-500">✓ Óptimo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {organizationalAreas.filter(a => a.status === 'green').length}/{organizationalAreas.length} áreas en verde
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'grid' | 'chart')}>
        <TabsList>
          <TabsTrigger value="grid">Vista de Tarjetas</TabsTrigger>
          <TabsTrigger value="chart">Organigrama</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-6">
          {/* Grid de áreas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {organizationalAreas.map((area) => (
              <AreaCard key={area.id} area={area} onSelect={setSelectedArea} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Organigrama de ASEGURAR LTDA</CardTitle>
              <CardDescription>
                Estructura organizacional jerárquica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationalChart />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <CardTitle>Insights de IA</CardTitle>
          </div>
          <CardDescription>
            Análisis predictivo y recomendaciones inteligentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 border-l-4 border-gold bg-gold/5 rounded">
              <p className="font-semibold text-sm mb-1">📈 Predicción de Crecimiento</p>
              <p className="text-sm text-muted-foreground">
                Basado en las tendencias actuales, se proyecta un crecimiento del 22% en el próximo trimestre.
                Áreas de mayor impacto: CRM (+28%) y Marketing (+34%).
              </p>
            </div>
            <div className="p-4 border-l-4 border-blue-500 bg-blue-500/5 rounded">
              <p className="font-semibold text-sm mb-1">🎯 Recomendación Operativa</p>
              <p className="text-sm text-muted-foreground">
                Se detecta oportunidad de mejora en el área de Desarrollo (cobertura de tests: 78%).
                Asignar recursos para alcanzar 85% en las próximas 2 semanas.
              </p>
            </div>
            <div className="p-4 border-l-4 border-green-500 bg-green-500/5 rounded">
              <p className="font-semibold text-sm mb-1">✅ Logro Destacado</p>
              <p className="text-sm text-muted-foreground">
                El área de CCO-RACK ha reducido el tiempo de respuesta en 8.7% este mes,
                superando la meta establecida. Felicitaciones al equipo!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
