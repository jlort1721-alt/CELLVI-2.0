import {
  ChevronLeft, LayoutDashboard, Route, MapPin, Fuel, FileText, Map,
  Thermometer, Shield, Zap, User, Bell, Radio, Settings, Satellite, Scale, Signal,
  Sparkles, Navigation, Eye, Bot,
} from "lucide-react";
import { useUIStore, type ActiveModule } from "@/stores/uiStore";
import { usePermissions } from "@/hooks/usePermissions";
import type { LucideIcon } from "lucide-react";

interface MenuItem {
  id: ActiveModule;
  label: string;
  icon: LucideIcon;
  permission: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Monitoreo",
    items: [
      { id: "overview", label: "Vista General", icon: LayoutDashboard, permission: "monitoring.read" },
      { id: "map", label: "Mapa en Tiempo Real", icon: Map, permission: "monitoring.read" },
      { id: "alerts", label: "Centro de Alertas", icon: Bell, permission: "monitoring.alerts" },
    ],
  },
  {
    title: "Flota",
    items: [
      { id: "routes", label: "Rutas", icon: Route, permission: "fleet.read" },
      { id: "geofences", label: "Geocercas", icon: MapPin, permission: "fleet.read" },
      { id: "drivers", label: "Conductores", icon: User, permission: "fleet.read" },
    ],
  },
  {
    title: "Operación",
    items: [
      { id: "fuel", label: "Combustible", icon: Fuel, permission: "operations.read" },
      { id: "predictive", label: "Inteligencia Predictiva", icon: Zap, permission: "operations.read" },
      { id: "cold-chain", label: "Cadena de Frío", icon: Thermometer, permission: "operations.read" },
      { id: "connectivity", label: "Conectividad", icon: Radio, permission: "operations.read" },
    ],
  },
  {
    title: "Activos",
    items: [
      { id: "asset-detail", label: "Detalle de Activo", icon: Signal, permission: "fleet.read" },
    ],
  },
  {
    title: "Control",
    items: [
      { id: "policy-engine", label: "Policy Engine", icon: Zap, permission: "control.read" },
      { id: "rndc", label: "RNDC (MinTransporte)", icon: FileText, permission: "control.read" },
      { id: "gnss-security", label: "Seguridad GNSS", icon: Satellite, permission: "control.read" },
      { id: "evidence", label: "Evidence Layer", icon: Shield, permission: "control.evidence" },
      { id: "evidence-verifier", label: "Verificador Offline", icon: Shield, permission: "control.evidence" },
      { id: "audit-log", label: "Auditoría Inmutable", icon: FileText, permission: "control.audit" },
      { id: "reports", label: "Reportes", icon: FileText, permission: "reports.read" },
      { id: "compliance", label: "Cumplimiento", icon: Scale, permission: "compliance.read" },
    ],
  },
  {
    title: "Admin",
    items: [
      { id: "billing", label: "Billing & Uso", icon: Settings, permission: "admin.billing" },
      { id: "gateway-monitor", label: "Device Gateway", icon: Radio, permission: "admin.billing" },
      { id: "admin", label: "Administración", icon: Settings, permission: "admin.users" },
    ],
  },
  {
    title: "Organización",
    items: [
      { id: "asegurar-ia", label: "Asegurar IA", icon: Sparkles, permission: "asegurar_ia.view" },
    ],
  },
  {
    title: "Inteligencia Artificial",
    items: [
      { id: "route-genius", label: "Route Genius", icon: Navigation, permission: "ai.route_optimizer" },
      { id: "vision-guard", label: "Vision Guard", icon: Eye, permission: "ai.fatigue_detection" },
      { id: "neuro-core", label: "Neuro-Core", icon: Bot, permission: "ai.chatbot" },
    ],
  },
];

const PlatformSidebar = ({ id }: { id?: string }) => {
  const { sidebarOpen, activeModule, setActiveModule, setSidebarOpen } = useUIStore();
  const { can } = usePermissions();

  return (
    <aside
      id={id}
      className={`${sidebarOpen ? "w-52" : "w-0"} transition-all duration-300 overflow-y-auto overflow-x-hidden flex flex-col flex-shrink-0 z-10 bg-sidebar border-r border-sidebar-border`}
    >
      <nav className="flex-1 py-2" aria-label="Platform navigation">
        {menuSections.map((section) => {
          const visibleItems = section.items.filter((item) => can(item.permission));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title} role="group" aria-label={section.title}>
              <div className="px-4 py-2 text-[9px] font-bold text-sidebar-foreground/30 uppercase tracking-wider" aria-hidden="true">
                {section.title}
              </div>
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveModule(item.id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  aria-current={activeModule === item.id ? "page" : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors border-l-2 ${activeModule === item.id
                      ? "bg-sidebar-accent text-sidebar-primary border-sidebar-primary"
                      : "text-sidebar-foreground/50 border-transparent hover:text-sidebar-foreground/70"
                    }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <a
          href="/"
          className="flex items-center gap-2 text-xs text-sidebar-foreground/40 hover:text-sidebar-foreground/60 py-2"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Sitio principal
        </a>
      </div>
    </aside>
  );
};

export default PlatformSidebar;
