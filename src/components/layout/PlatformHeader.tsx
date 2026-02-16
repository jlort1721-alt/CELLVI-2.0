import { memo, useState, useEffect, useRef, useCallback } from "react";
import {
  Menu, X, Clock, Signal, SignalZero, LogOut, Bell, Search,
  ChevronRight, RefreshCw, User, Settings, Building2,
} from "lucide-react";
import { useUIStore, type ActiveModule } from "@/stores/uiStore";
import { useSyncStatusStore } from "@/stores/syncStatusStore";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { NotificationCenter, getInitialUnreadCount } from "@/features/notifications/NotificationCenter";
import ThemeToggle from "@/components/ThemeToggle";

/* ── Module label map for breadcrumbs ─────────────────── */
const MODULE_LABELS: Record<string, { section: string; label: string }> = {
  overview: { section: "Monitoreo", label: "Vista General" },
  map: { section: "Monitoreo", label: "Mapa en Tiempo Real" },
  alerts: { section: "Monitoreo", label: "Centro de Alertas" },
  routes: { section: "Flota", label: "Rutas" },
  geofences: { section: "Flota", label: "Geocercas" },
  drivers: { section: "Flota", label: "Conductores" },
  fuel: { section: "Operación", label: "Combustible" },
  predictive: { section: "Operación", label: "Inteligencia Predictiva" },
  "cold-chain": { section: "Operación", label: "Cadena de Frío" },
  connectivity: { section: "Operación", label: "Conectividad" },
  "asset-detail": { section: "Activos", label: "Detalle de Activo" },
  "policy-engine": { section: "Control", label: "Policy Engine" },
  rndc: { section: "Control", label: "RNDC" },
  "gnss-security": { section: "Control", label: "Seguridad GNSS" },
  evidence: { section: "Control", label: "Evidence Layer" },
  "evidence-verifier": { section: "Control", label: "Verificador Offline" },
  "audit-log": { section: "Control", label: "Auditoría" },
  reports: { section: "Control", label: "Reportes" },
  compliance: { section: "Control", label: "Cumplimiento" },
  billing: { section: "Admin", label: "Billing & Uso" },
  "gateway-monitor": { section: "Admin", label: "Device Gateway" },
  admin: { section: "Admin", label: "Administración" },
  "asegurar-ia": { section: "Organización", label: "Asegurar IA" },
  "route-genius": { section: "IA", label: "Route Genius" },
  "vision-guard": { section: "IA", label: "Vision Guard" },
  "neuro-core": { section: "IA", label: "Neuro-Core" },
};

/* ── Breadcrumbs ──────────────────────────────────────── */
const Breadcrumbs = memo(({ activeModule }: { activeModule: ActiveModule }) => {
  const info = MODULE_LABELS[activeModule];
  if (!info) return null;

  return (
    <div className="hidden md:flex items-center gap-1 text-[10px] text-primary-foreground/40">
      <span className="text-gold/60">{info.section}</span>
      <ChevronRight className="w-3 h-3" />
      <span className="text-primary-foreground/70 font-medium">{info.label}</span>
    </div>
  );
});
Breadcrumbs.displayName = "Breadcrumbs";

/* ── Sync Status Indicator ────────────────────────────── */
const SyncIndicator = memo(() => {
  const { isOnline, isSyncing, pendingOperations } = useSyncStatusStore();
  const pendingCount = pendingOperations.filter((op) => op.status === "pending").length;

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 text-yellow-400" title="Sincronizando...">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span className="hidden lg:inline text-[10px]">Sincronizando</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-red-400" title="Sin conexión">
        <SignalZero className="w-3.5 h-3.5" />
        <span className="hidden lg:inline text-[10px]">Offline</span>
        {pendingCount > 0 && (
          <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-green-500" title="Sistema Online">
      <Signal className="w-3.5 h-3.5" />
      <span className="hidden lg:inline text-[10px]">Online</span>
    </div>
  );
});
SyncIndicator.displayName = "SyncIndicator";

/* ── Role labels (static, outside component to avoid re-creation) ── */
const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  manager: "Gerente",
  operator: "Operador",
  driver: "Conductor",
  client: "Cliente",
  auditor: "Auditor",
};

/* ── User Menu Dropdown ───────────────────────────────── */
const UserMenu = memo(({ onSignOut }: { onSignOut: () => void }) => {
  const { profile, role, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-gold text-[10px] font-bold">
          {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-primary-foreground text-[10px] font-medium leading-tight">
            {profile?.display_name || "Usuario"}
          </div>
          <div className="text-gold text-[9px] leading-tight">
            {ROLE_LABELS[role || "operator"] || role}
          </div>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-sidebar border border-sidebar-border rounded-lg shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info */}
          <div className="px-3 py-2.5 border-b border-gold/10">
            <div className="text-primary-foreground text-xs font-semibold">{profile?.display_name || "Usuario"}</div>
            <div className="text-primary-foreground/40 text-[10px]">{profile?.email}</div>
            {profile?.company && (
              <div className="flex items-center gap-1 mt-1 text-gold/60 text-[10px]">
                <Building2 className="w-3 h-3" />
                {profile.company}
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/5 transition-colors"
              onClick={() => setOpen(false)}
            >
              <User className="w-3.5 h-3.5" /> Mi Perfil
            </button>
            {isAdmin && (
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/5 transition-colors"
                onClick={() => setOpen(false)}
              >
                <Settings className="w-3.5 h-3.5" /> Configuración
              </button>
            )}
          </div>

          {/* Sign Out */}
          <div className="border-t border-gold/10 py-1">
            <button
              type="button"
              onClick={() => { setOpen(false); onSignOut(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
UserMenu.displayName = "UserMenu";

/* ── Main Header ──────────────────────────────────────── */
const PlatformHeader = memo(() => {
  const { sidebarOpen, activeModule, toggleSidebar } = useUIStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationCount = getInitialUnreadCount();

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/");
  }, [signOut, navigate]);

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b flex-shrink-0 z-20 bg-sidebar border-sidebar-border">
      {/* Left: Logo + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button type="button" className="lg:hidden text-primary-foreground" onClick={toggleSidebar} aria-label="Toggle menu">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <img src="/logo.png" alt="ASEGURAR" className="h-10 w-auto object-contain" />
        <div className="hidden sm:block">
          <div className="text-primary-foreground font-bold text-sm font-heading">ASEGURAR LTDA</div>
          <Breadcrumbs activeModule={activeModule} />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 lg:gap-3 text-xs text-primary-foreground/60">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gold/10 hover:border-gold/30 text-primary-foreground/30 hover:text-primary-foreground/60 transition-colors"
          title="Buscar (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-[10px]">Buscar</span>
          <kbd className="ml-1 px-1 py-0.5 rounded bg-white/5 text-[9px] font-mono">⌘K</kbd>
        </button>

        {/* Sync Status */}
        <SyncIndicator />

        {/* Clock */}
        <div className="hidden md:flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[10px] font-mono">{now.toLocaleTimeString("es-CO")}</span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => setNotificationsOpen((v) => !v)}
          className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          title="Notificaciones"
          aria-label="Notificaciones"
        >
          <Bell className="w-4 h-4 text-primary-foreground/50" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>
        <NotificationCenter open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Separator */}
        <div className="hidden md:block w-px h-6 bg-gold/15" />

        {/* User Menu */}
        <UserMenu onSignOut={handleSignOut} />
      </div>
    </header>
  );
});
PlatformHeader.displayName = "PlatformHeader";

export default PlatformHeader;
