import { memo } from "react";
import { Building2, AlertCircle } from "lucide-react";

interface TenantLimits {
  events_per_day?: number;
  retention_days?: number;
  max_vehicles?: number;
  max_users?: number;
}

interface TenantFeatures {
  [key: string]: boolean;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
  limits?: TenantLimits;
  features?: TenantFeatures;
  created_at: string;
}

interface TenantSettingsPanelProps {
  tenant: Tenant | null | undefined;
  isLoading?: boolean;
}

const StatCard = memo(({ label, value, color = "text-sidebar-foreground" }: {
  label: string;
  value: string | number | boolean;
  color?: string;
}) => (
  <div>
    <div className="text-[10px] text-sidebar-foreground/40 uppercase tracking-wide mb-1">{label}</div>
    <div className={`text-sm font-bold ${color}`}>
      {typeof value === 'boolean' ? (value ? 'Activo' : 'Inactivo') : value}
    </div>
  </div>
));
StatCard.displayName = "StatCard";

const FeatureItem = memo(({ name, enabled }: { name: string; enabled: boolean }) => (
  <div className="flex items-center gap-2">
    <span className={`w-2 h-2 rounded-full ${enabled ? "bg-green-500" : "bg-red-500"}`} />
    <span className="text-sidebar-foreground/60 text-xs capitalize">
      {name.replace(/_/g, " ")}
    </span>
  </div>
));
FeatureItem.displayName = "FeatureItem";

export const TenantSettingsPanel = memo(({ tenant, isLoading }: TenantSettingsPanelProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-sidebar border-sidebar-border p-6">
        <div className="text-center py-12 text-sidebar-foreground/30 text-sm">
          Cargando información de la organización...
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="rounded-xl border bg-sidebar border-sidebar-border p-6">
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <AlertCircle className="w-12 h-12 text-sidebar-foreground/20" />
          <div className="text-center text-sidebar-foreground/30 text-sm">
            No tienes una organización asignada
          </div>
          <div className="text-center text-sidebar-foreground/20 text-xs">
            Contacta a un administrador para obtener acceso
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
        <Building2 className="w-4 h-4 text-gold" />
        <span className="text-xs text-sidebar-foreground/70">
          Información de tu organización y límites del plan actual. Contacta soporte para cambios.
        </span>
      </div>

      {/* Main Info */}
      <div className="rounded-xl border bg-sidebar border-sidebar-border p-6 space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-bold text-sidebar-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gold" />
            Información General
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Nombre" value={tenant.name} />
            <StatCard 
              label="Plan" 
              value={tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)} 
            />
            <StatCard label="Slug" value={tenant.slug} />
            <StatCard 
              label="Estado" 
              value={tenant.active ? "Activo" : "Inactivo"}
              color={tenant.active ? "text-green-500" : "text-red-500"}
            />
          </div>
        </div>

        {/* Limits & Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Limits */}
          <div>
            <h4 className="text-xs font-bold text-sidebar-foreground/70 uppercase tracking-wide mb-3">
              Límites del Plan
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50">
                <span className="text-xs text-sidebar-foreground/60">Eventos por día</span>
                <span className="text-sm font-bold text-sidebar-foreground">
                  {tenant.limits?.events_per_day?.toLocaleString() || '∞'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50">
                <span className="text-xs text-sidebar-foreground/60">Retención de datos</span>
                <span className="text-sm font-bold text-sidebar-foreground">
                  {tenant.limits?.retention_days ? `${tenant.limits.retention_days} días` : '∞'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50">
                <span className="text-xs text-sidebar-foreground/60">Máximo de vehículos</span>
                <span className="text-sm font-bold text-sidebar-foreground">
                  {tenant.limits?.max_vehicles || '∞'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50">
                <span className="text-xs text-sidebar-foreground/60">Máximo de usuarios</span>
                <span className="text-sm font-bold text-sidebar-foreground">
                  {tenant.limits?.max_users || '∞'}
                </span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-xs font-bold text-sidebar-foreground/70 uppercase tracking-wide mb-3">
              Características Habilitadas
            </h4>
            <div className="space-y-2">
              {Object.entries(tenant.features || {}).length > 0 ? (
                Object.entries(tenant.features || {}).map(([key, value]) => (
                  <FeatureItem key={key} name={key} enabled={value} />
                ))
              ) : (
                <div className="text-xs text-sidebar-foreground/30 italic">
                  No hay características configuradas
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-sidebar-border/30">
          <div className="text-[10px] text-sidebar-foreground/30">
            Organización creada el {new Date(tenant.created_at).toLocaleDateString("es-CO", {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
TenantSettingsPanel.displayName = "TenantSettingsPanel";
