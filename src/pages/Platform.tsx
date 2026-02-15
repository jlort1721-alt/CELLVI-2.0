import { Suspense, lazy, memo } from "react";
import WhatsAppButton from "@/components/WhatsAppButton";
import PlatformHeader from "@/components/layout/PlatformHeader";
import PlatformSidebar from "@/components/layout/PlatformSidebar";
import { useUIStore } from "@/stores/uiStore";
import { useRealtimeAlerts, useRealtimeTelemetry, useRealtimeGnss } from "@/hooks/useRealtime";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { usePWAStatus } from "@/hooks/usePWAStatus";
import { announce } from "@/components/accessibility/LiveRegion";
import { useEffect } from "react";

// Lazy-loaded feature modules
const DashboardOverview = lazy(() => import("@/features/monitoring/components/DashboardOverview"));
const DashboardAlerts = lazy(() => import("@/features/monitoring/components/DashboardAlerts"));
const FleetMap = lazy(() => import("@/features/monitoring/components/FleetMap"));
const DashboardRoutes = lazy(() => import("@/features/fleet/components/DashboardRoutes"));
const DashboardGeofences = lazy(() => import("@/features/fleet/components/DashboardGeofences"));
const DashboardDrivers = lazy(() => import("@/features/fleet/components/DashboardDrivers"));
const DashboardAssetDetail = lazy(() => import("@/features/fleet/components/DashboardAssetDetail"));
const DashboardFuel = lazy(() => import("@/features/operations/components/DashboardFuel"));
const DashboardColdChain = lazy(() => import("@/features/operations/components/DashboardColdChain"));
const DashboardConnectivity = lazy(() => import("@/features/operations/components/DashboardConnectivity"));
const DashboardPolicyEngine = lazy(() => import("@/features/control/components/DashboardPolicyEngine"));
const DashboardGnssSecurity = lazy(() => import("@/features/control/components/DashboardGnssSecurity"));
const DashboardEvidence = lazy(() => import("@/features/control/components/DashboardEvidence"));
const DashboardAuditLog = lazy(() => import("@/features/control/components/DashboardAuditLog"));
const DashboardReports = lazy(() => import("@/features/control/components/DashboardReports"));
const DashboardCompliance = lazy(() => import("@/features/compliance/components/DashboardCompliance"));
const DashboardBilling = lazy(() => import("@/features/admin/components/DashboardBilling"));
const DashboardAdmin = lazy(() => import("@/features/admin/components/DashboardAdmin"));
const EvidenceVerifier = lazy(() => import("@/features/monitoring/components/EvidenceVerifier"));
const GatewayMonitor = lazy(() => import("@/features/monitoring/components/GatewayMonitor"));
const DashboardPredictive = lazy(() => import("@/features/fleet/components/DashboardPredictive"));
const DashboardRNDC = lazy(() => import("@/features/fleet/components/DashboardRNDC"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando módulo">
    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    <span className="sr-only">Cargando...</span>
  </div>
);

// Offline status indicator
const OfflineIndicator = memo(() => {
  const { isOnline } = usePWAStatus();

  useEffect(() => {
    if (!isOnline) {
      announce('Modo offline activado - Los cambios se sincronizarán cuando vuelva la conexión', 'assertive');
    } else {
      announce('Conexión restaurada', 'polite');
    }
  }, [isOnline]);

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top-2">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      Modo Offline - Los cambios se sincronizarán automáticamente
    </div>
  );
});

OfflineIndicator.displayName = 'OfflineIndicator';

const Platform = () => {
  const { activeModule } = useUIStore();

  // Realtime subscriptions
  useRealtimeAlerts();
  useRealtimeTelemetry();
  useRealtimeGnss();
  useKeyboardNav();

  // Performance monitoring
  usePerformanceMonitor({
    enabled: true,
    trackWebVitals: true,
    trackQueryMetrics: true,
  });

  const renderContent = () => {
    switch (activeModule) {
      case "overview": return <DashboardOverview />;
      case "map": return <FleetMap />;
      case "alerts": return <DashboardAlerts />;
      case "routes": return <DashboardRoutes />;
      case "geofences": return <DashboardGeofences />;
      case "drivers": return <DashboardDrivers />;
      case "asset-detail": return <DashboardAssetDetail />;
      case "fuel": return <DashboardFuel />;
      case "cold-chain": return <DashboardColdChain />;
      case "connectivity": return <DashboardConnectivity />;
      case "policy-engine": return <DashboardPolicyEngine />;
      case "gnss-security": return <DashboardGnssSecurity />;
      case "evidence": return <DashboardEvidence />;
      case "audit-log": return <DashboardAuditLog />;
      case "reports": return <DashboardReports />;
      case "compliance": return <DashboardCompliance />;
      case "billing": return <DashboardBilling />;
      case "admin": return <DashboardAdmin />;
      case "evidence-verifier": return <EvidenceVerifier />;
      case "gateway-monitor": return <GatewayMonitor />;
      case "predictive": return <DashboardPredictive />;
      case "rndc": return <DashboardRNDC />;
      default: return <DashboardOverview />;
    }
  };

  // Announce module changes to screen readers
  useEffect(() => {
    const moduleNames: Record<string, string> = {
      overview: 'Vista General',
      map: 'Mapa de Flota',
      alerts: 'Alertas',
      routes: 'Rutas',
      geofences: 'Geocercas',
      drivers: 'Conductores',
      'asset-detail': 'Detalle de Activo',
      fuel: 'Combustible',
      'cold-chain': 'Cadena de Frío',
      connectivity: 'Conectividad',
      'policy-engine': 'Motor de Políticas',
      'gnss-security': 'Seguridad GNSS',
      evidence: 'Evidencias',
      'audit-log': 'Registro de Auditoría',
      reports: 'Reportes',
      compliance: 'Cumplimiento',
      billing: 'Facturación',
      admin: 'Administración',
      'evidence-verifier': 'Verificador de Evidencias',
      'gateway-monitor': 'Monitor de Gateway',
      predictive: 'Predictivo',
      rndc: 'RNDC',
    };

    const moduleName = moduleNames[activeModule] || 'Vista General';
    announce(`Navegando a ${moduleName}`, 'polite');
  }, [activeModule]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-sidebar">
      <PlatformHeader />
      <OfflineIndicator />
      <div className="flex flex-1 overflow-hidden">
        <PlatformSidebar id="main-navigation" />
        <main
          id="main-content"
          className="flex-1 overflow-auto p-4 lg:p-6"
          role="main"
          tabIndex={-1}
          aria-label="Contenido principal de la plataforma"
        >
          <Suspense fallback={<LoadingFallback />}>
            {renderContent()}
          </Suspense>
        </main>
      </div>
      <WhatsAppButton />
    </div>
  );
};

Platform.displayName = 'Platform';

export default Platform;
