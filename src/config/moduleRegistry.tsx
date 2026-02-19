import { lazy, type ComponentType } from 'react';

/**
 * Describes a lazily-loaded platform module for routing and navigation.
 */
export interface ModuleDefinition {
  /** React lazy component resolved from a dynamic import. */
  component: React.LazyExoticComponent<ComponentType<unknown>>;
  /** Human-readable display label shown in the sidebar and breadcrumbs. */
  label: string;
}

/**
 * Central registry of all platform modules.
 * Single source of truth for module routing, labels, and lazy imports.
 */
export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  // ── Monitoring & Overview ──
  overview: {
    component: lazy(() => import('@/features/monitoring/components/DashboardOverview')),
    label: 'Vista General',
  },
  map: {
    component: lazy(() => import('@/features/monitoring/components/FleetMap')),
    label: 'Mapa de Flota',
  },
  alerts: {
    component: lazy(() => import('@/features/monitoring/components/DashboardAlerts')),
    label: 'Alertas',
  },
  'evidence-verifier': {
    component: lazy(() => import('@/features/monitoring/components/EvidenceVerifier')),
    label: 'Verificador de Evidencias',
  },
  'gateway-monitor': {
    component: lazy(() => import('@/features/monitoring/components/GatewayMonitor')),
    label: 'Monitor de Gateway',
  },

  // ── Fleet Management ──
  routes: {
    component: lazy(() => import('@/features/fleet/components/DashboardRoutes')),
    label: 'Rutas',
  },
  geofences: {
    component: lazy(() => import('@/features/fleet/components/DashboardGeofences')),
    label: 'Geocercas',
  },
  drivers: {
    component: lazy(() => import('@/features/fleet/components/DashboardDrivers')),
    label: 'Conductores',
  },
  'asset-detail': {
    component: lazy(() => import('@/features/fleet/components/DashboardAssetDetail')),
    label: 'Detalle de Activo',
  },
  predictive: {
    component: lazy(() => import('@/features/fleet/components/DashboardPredictive')),
    label: 'Predictivo',
  },
  rndc: {
    component: lazy(() => import('@/features/fleet/components/DashboardRNDC')),
    label: 'RNDC',
  },

  // ── Operations ──
  fuel: {
    component: lazy(() => import('@/features/operations/components/DashboardFuel')),
    label: 'Combustible',
  },
  'cold-chain': {
    component: lazy(() => import('@/features/operations/components/DashboardColdChain')),
    label: 'Cadena de Frío',
  },
  connectivity: {
    component: lazy(() => import('@/features/operations/components/DashboardConnectivity')),
    label: 'Conectividad',
  },

  // ── Control & Security ──
  'policy-engine': {
    component: lazy(() => import('@/features/control/components/DashboardPolicyEngine')),
    label: 'Motor de Políticas',
  },
  'gnss-security': {
    component: lazy(() => import('@/features/control/components/DashboardGnssSecurity')),
    label: 'Seguridad GNSS',
  },
  evidence: {
    component: lazy(() => import('@/features/control/components/DashboardEvidence')),
    label: 'Evidencias',
  },
  'audit-log': {
    component: lazy(() => import('@/features/control/components/DashboardAuditLog')),
    label: 'Registro de Auditoría',
  },
  reports: {
    component: lazy(() => import('@/features/control/components/DashboardReports')),
    label: 'Reportes',
  },

  // ── Compliance & Admin ──
  compliance: {
    component: lazy(() => import('@/features/compliance/components/DashboardCompliance')),
    label: 'Cumplimiento',
  },
  billing: {
    component: lazy(() => import('@/features/admin/components/DashboardBilling')),
    label: 'Facturación',
  },
  admin: {
    component: lazy(() => import('@/features/admin/components/DashboardAdmin')),
    label: 'Administración',
  },

  // ── AI Features (Asegurar IA) ──
  'asegurar-ia': {
    component: lazy(() => import('@/features/asegurar-ia/pages/AsegurarIADashboard')),
    label: 'Asegurar IA',
  },
  'route-genius': {
    component: lazy(() => import('@/features/ai/components/RouteOptimizerPanel')),
    label: 'Route Genius',
  },
  'vision-guard': {
    component: lazy(() => import('@/features/ai/components/FatigueMonitor')),
    label: 'Vision Guard',
  },
  'neuro-core': {
    component: lazy(() => import('@/features/ai/components/ChatbotInterface')),
    label: 'Neuro-Core',
  },
  'ai-command-center': {
    component: lazy(() => import('@/features/ai/components/AICommandCenter')),
    label: 'Centro de Comando IA',
  },
};

/**
 * Get the human-readable label for a module by its registry key.
 * @param moduleKey - Key from `MODULE_REGISTRY` (e.g. `'cold-chain'`).
 * @returns The module label, or `'Vista General'` if the key is not found.
 */
export function getModuleLabel(moduleKey: string): string {
  return MODULE_REGISTRY[moduleKey]?.label ?? 'Vista General';
}
