import { Suspense, lazy } from "react";
import WhatsAppButton from "@/components/WhatsAppButton";
import PlatformHeader from "@/components/layout/PlatformHeader";
import PlatformSidebar from "@/components/layout/PlatformSidebar";
import { useUIStore } from "@/stores/uiStore";
import { useRealtimeAlerts, useRealtimeTelemetry, useRealtimeGnss } from "@/hooks/useRealtime";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";

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
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
  </div>
);

const Platform = () => {
  const { activeModule } = useUIStore();

  // Realtime subscriptions
  useRealtimeAlerts();
  useRealtimeTelemetry();
  useRealtimeGnss();
  useKeyboardNav();

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

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-sidebar">
      <PlatformHeader />
      <div className="flex flex-1 overflow-hidden">
        <PlatformSidebar />
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <Suspense fallback={<LoadingFallback />}>
            {renderContent()}
          </Suspense>
        </div>
      </div>
      <WhatsAppButton />
    </div>
  );
};

export default Platform;
