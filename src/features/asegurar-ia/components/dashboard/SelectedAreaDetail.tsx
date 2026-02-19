import { memo, Suspense, lazy, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AreaHeader } from '../shared/ExecutiveWidgets';
import { Briefcase, Building2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { OrganizationalArea } from '../../lib/orgData';

// Lazy load area dashboards
const PresidenciaView = lazy(() => import('../areas/PresidenciaView'));
const GerenciaGeneralView = lazy(() => import('../areas/GerenciaGeneralView'));
const JefeRedView = lazy(() => import('../areas/JefeRedView'));
const CCORackView = lazy(() => import('../areas/CCORackView'));
const AsistenteGerenciaView = lazy(() => import('../areas/AsistenteGerenciaView'));
const OperadorCELLVIView = lazy(() => import('../areas/OperadorCELLVIView'));
const ContabilidadView = lazy(() => import('../areas/ContabilidadView'));
const CRMView = lazy(() => import('../areas/CRMView'));
const ComercialMarketingView = lazy(() => import('../areas/ComercialMarketingView'));
const DesarrolloView = lazy(() => import('../areas/DesarrolloView'));

export interface SelectedAreaDetailProps {
  selectedArea: OrganizationalArea;
  onBack: () => void;
  iconMap: Record<string, React.ElementType>;
}

const mapStatus = (s: string): 'operational' | 'warning' | 'critical' =>
  s === 'green' ? 'operational' : s === 'yellow' ? 'warning' : 'critical';

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-3">
    <div className="relative">
      <div className="w-10 h-10 border-2 border-amber-500/20 rounded-full" />
      <div className="absolute inset-0 w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
    <p className="text-xs text-muted-foreground animate-pulse">Cargando dashboard...</p>
  </div>
);

function renderDashboard(areaId: string) {
  switch (areaId) {
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
}

const SelectedAreaDetail = memo(({ selectedArea, onBack, iconMap }: SelectedAreaDetailProps) => {
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
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
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
          <Button variant="outline" size="sm" onClick={onBack} className="border-border/50">
            Volver a Vista General
          </Button>
        }
      />

      <Suspense fallback={<LoadingSpinner />}>
        {renderDashboard(selectedArea.id)}
      </Suspense>
    </motion.div>
  );
});

SelectedAreaDetail.displayName = 'SelectedAreaDetail';

export default SelectedAreaDetail;
