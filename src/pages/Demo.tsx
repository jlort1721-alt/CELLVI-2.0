import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense, memo } from "react";
import { Menu, X, Clock, Signal, ChevronLeft, LayoutDashboard, Route, MapPin, Fuel, FileText, Map, Bell, Users, Thermometer, Wifi, Shield, Fingerprint, Satellite, ClipboardList, Scale, Brain, Loader2 } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useTranslation } from "react-i18next";
import { vehicles as mockVehicles } from "@/lib/demoData";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { announce } from "@/components/accessibility/LiveRegion";

/* ── Lazy-loaded modules (code splitting) ── */
const DashboardOverview = lazy(() => import("@/features/monitoring/components/DashboardOverview"));
const DashboardAlerts = lazy(() => import("@/features/monitoring/components/DashboardAlerts"));
const DashboardRoutes = lazy(() => import("@/features/fleet/components/DashboardRoutes"));
const DashboardGeofences = lazy(() => import("@/features/fleet/components/DashboardGeofences"));
const DashboardDrivers = lazy(() => import("@/features/fleet/components/DashboardDrivers"));
const DashboardFuel = lazy(() => import("@/features/operations/components/DashboardFuel"));
const DashboardColdChain = lazy(() => import("@/features/operations/components/DashboardColdChain"));
const DashboardConnectivity = lazy(() => import("@/features/operations/components/DashboardConnectivity"));
const DashboardReports = lazy(() => import("@/features/control/components/DashboardReports"));
const DashboardEvidence = lazy(() => import("@/features/control/components/DashboardEvidence"));
const DashboardPolicyEngine = lazy(() => import("@/features/control/components/DashboardPolicyEngine"));
const DashboardGnssSecurity = lazy(() => import("@/features/control/components/DashboardGnssSecurity"));
const DashboardAuditLog = lazy(() => import("@/features/control/components/DashboardAuditLog"));
const DashboardCompliance = lazy(() => import("@/features/compliance/components/DashboardCompliance"));
const DashboardPredictive = lazy(() => import("@/features/analytics/components/DashboardPredictive"));

/* ── Loading Fallback ── */
const ModuleLoader = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
        <span className="text-xs text-primary-foreground/40">{t("common.loadingModule")}</span>
      </div>
    </div>
  );
};

const statusColors: Record<string, string> = { activo: "#22c55e", detenido: "#3b82f6", alerta: "#ef4444", apagado: "#6b7280" };

const Demo = memo(() => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [now, setNow] = useState(new Date());
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<ReturnType<NonNullable<typeof window.L>["map"]> | null>(null);
  const markersRef = useRef<{ remove(): void }[]>([]);

  // Track performance metrics
  usePerformanceMonitor({
    enabled: true,
    trackWebVitals: true,
    trackQueryMetrics: true,
    onReport: (metrics) => {
      if (metrics.LCP && metrics.LCP > 2500) {
        console.warn('[Demo] LCP is high:', metrics.LCP);
      }
    },
  });

  const statusLabels = useMemo<Record<string, string>>(() => ({
    activo: t("dashboard.statusMoving", "En Movimiento"),
    detenido: t("dashboard.statusStopped", "Detenido"),
    alerta: t("dashboard.statusAlert", "¡Alerta!"),
    apagado: t("dashboard.statusOff", "Motor Apagado"),
  }), [t]);

  const tabs = [
    // Monitoreo
    { id: "overview", label: t("dashboard.overview"), icon: LayoutDashboard, group: "monitor" },
    { id: "map", label: t("dashboard.map", "Mapa"), icon: Map, group: "monitor" },
    { id: "alerts", label: t("dashboard.alerts", "Alertas"), icon: Bell, group: "monitor" },
    // Flota
    { id: "routes", label: t("dashboard.routes"), icon: Route, group: "fleet" },
    { id: "geofences", label: t("dashboard.geofences"), icon: MapPin, group: "fleet" },
    { id: "drivers", label: t("dashboard.drivers", "Conductores"), icon: Users, group: "fleet" },
    // Operaciones
    { id: "fuel", label: t("dashboard.fuel"), icon: Fuel, group: "ops" },
    { id: "coldchain", label: t("dashboard.coldChain", "Cadena de Frío"), icon: Thermometer, group: "ops" },
    { id: "connectivity", label: t("dashboard.connectivity", "Conectividad"), icon: Wifi, group: "ops" },
    // Control & Seguridad
    { id: "evidence", label: t("dashboard.evidence", "Evidencia"), icon: Fingerprint, group: "control" },
    { id: "policy", label: t("dashboard.policyEngine", "Motor de Reglas"), icon: Shield, group: "control" },
    { id: "gnss", label: t("dashboard.gnssSecurity", "GNSS Security"), icon: Satellite, group: "control" },
    { id: "audit", label: t("dashboard.auditLog", "Auditoría"), icon: ClipboardList, group: "control" },
    { id: "compliance", label: t("dashboard.compliance", "Cumplimiento"), icon: Scale, group: "control" },
    { id: "reports", label: t("dashboard.reports"), icon: FileText, group: "control" },
    // Analytics (NEW)
    { id: "predictive", label: t("dashboard.predictive", "Análisis Predictivo"), icon: Brain, group: "analytics" },
  ];

  const groupLabels: Record<string, string> = {
    monitor: t("dashboard.groupMonitor", "MONITOREO"),
    fleet: t("dashboard.groupFleet", "FLOTA"),
    ops: t("dashboard.groupOps", "OPERACIONES"),
    control: t("dashboard.groupControl", "CONTROL"),
    analytics: t("dashboard.groupAnalytics", "ANALYTICS"),
  };

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const addMarkers = useCallback((vehicles: typeof mockVehicles) => {
    const L = window.L;
    if (!L || !mapInstanceRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    vehicles.forEach((v) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${statusColors[v.status]};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:pointer;">
          <span style="color:white;font-size:10px;font-weight:bold;">${v.plate.split("-")[1]}</span>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([v.lat, v.lng], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>${v.plate}</b><br/>${v.driver}<br/>${statusLabels[v.status] || v.status} • ${v.speed} km/h`);
      markersRef.current.push(marker);
    });
  }, [statusLabels]);

  useEffect(() => {
    if (activeTab !== "map") return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      if (mapRef.current && !mapInstanceRef.current) {
        const L = window.L;
        const map = L.map(mapRef.current).setView([1.8, -76.8], 7);
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        }).addTo(map);
        mapInstanceRef.current = map;
        addMarkers(mockVehicles);
      }
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab, addMarkers]);

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return <DashboardOverview />;
      case "alerts": return <DashboardAlerts />;
      case "routes": return <DashboardRoutes />;
      case "geofences": return <DashboardGeofences />;
      case "drivers": return <DashboardDrivers />;
      case "fuel": return <DashboardFuel />;
      case "coldchain": return <DashboardColdChain />;
      case "connectivity": return <DashboardConnectivity />;
      case "evidence": return <DashboardEvidence />;
      case "policy": return <DashboardPolicyEngine />;
      case "gnss": return <DashboardGnssSecurity />;
      case "audit": return <DashboardAuditLog />;
      case "compliance": return <DashboardCompliance />;
      case "reports": return <DashboardReports />;
      case "predictive": return <DashboardPredictive />;
      case "map": return (
        <div className="h-full relative">
          <div ref={mapRef} className="absolute inset-0" />
          <div className="absolute bottom-4 right-4 rounded-lg p-3 text-[10px] z-[1000] bg-navy/90 backdrop-blur-sm border border-gold/20 text-primary-foreground/60">
            <div className="font-bold text-primary-foreground text-xs mb-2 font-heading">{t("dashboard.status")}</div>
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColors[key] }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      );
      default: return <DashboardOverview />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-sidebar">
      {/* Top Bar */}
      <header className="h-14 flex items-center justify-between px-4 border-b flex-shrink-0 z-20 bg-navy border-gold/20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="lg:hidden text-primary-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            aria-expanded={sidebarOpen ? "true" : "false"}
            aria-controls="demo-sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
          <img src="/logo.png" alt="ASEGURAR" className="h-10 w-auto object-contain" />
          <div className="hidden sm:block">
            <div className="text-primary-foreground font-bold text-sm font-heading">CELLVI 2.0</div>
            <div className="text-gold text-[10px] tracking-[0.15em]">{t("dashboard.monitorPlatform")}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-primary-foreground/60">
          <div className="hidden md:flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5 text-green-500" />
            <span>{t("dashboard.systemOnline")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{now.toLocaleTimeString("es-CO")}</span>
          </div>
          <a href="/" className="text-xs font-medium flex items-center gap-1 text-gold">
            <ChevronLeft className="w-3.5 h-3.5" /> {t("dashboard.exit")}
          </a>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar nav — overlay on mobile, static on desktop */}
        <aside
          id="demo-sidebar"
          className={`
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            fixed lg:static top-14 bottom-0 left-0 w-52 lg:w-52
            transition-transform duration-300 ease-in-out
            flex flex-col flex-shrink-0 z-30 lg:z-10
            bg-sidebar border-r border-sidebar-border
          `}
          aria-label="Navegación del demo"
        >
          <nav className="flex-1 py-2 overflow-y-auto" aria-label="Módulos de CELLVI 2.0">
            {Object.entries(groupLabels).map(([groupKey, groupLabel]) => (
              <div key={groupKey}>
                <div className="px-4 py-1.5 text-[9px] font-bold tracking-[0.2em] text-sidebar-foreground/30 uppercase">
                  {groupLabel}
                </div>
                <div>
                  {tabs.filter((tab) => tab.group === groupKey).map((tab) => {
                    const isSelected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          if (window.innerWidth < 1024) setSidebarOpen(false);
                          announce(`Navegando a ${tab.label}`, 'polite');
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors border-l-2 ${isSelected
                          ? "bg-sidebar-accent text-sidebar-primary border-sidebar-primary"
                          : "text-sidebar-foreground/50 border-transparent hover:text-sidebar-foreground/70"
                          }`}
                        aria-current={isSelected ? "page" : undefined}
                        aria-label={`${tab.label} - ${groupLabel}`}
                      >
                        <tab.icon className="w-4 h-4" aria-hidden="true" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          className="flex-1 overflow-auto p-4 lg:p-6"
          aria-label="Contenido del módulo"
        >
          <Suspense fallback={<ModuleLoader />}>
            {renderContent()}
          </Suspense>
        </main>
      </div>
      <WhatsAppButton />
    </div>
  );
});

Demo.displayName = 'Demo';

export default Demo;
