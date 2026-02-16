import { memo } from "react";
import { CreditCard, TrendingUp, Calendar, AlertCircle, CheckCircle2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BillingPanelProps {
  tenantPlan?: string;
  tenantActive?: boolean;
}

const PLANS = {
  free: {
    name: "Plan Gratuito",
    price: 0,
    color: "text-gray-500",
    features: ["Hasta 5 vehículos", "Datos básicos de telemetría", "Soporte por email", "1 usuario"]
  },
  starter: {
    name: "Plan Starter",
    price: 199000,
    color: "text-blue-500",
    features: ["Hasta 25 vehículos", "Telemetría completa", "Alertas en tiempo real", "Hasta 5 usuarios", "Soporte prioritario"]
  },
  professional: {
    name: "Plan Professional",
    price: 499000,
    color: "text-purple-500",
    features: ["Hasta 100 vehículos", "IA predictiva", "Reportes avanzados", "Usuarios ilimitados", "Soporte 24/7", "API access"]
  },
  enterprise: {
    name: "Plan Enterprise",
    price: null,
    color: "text-gold",
    features: ["Vehículos ilimitados", "IA avanzada", "Personalización completa", "SLA garantizado", "Account manager dedicado", "Integraciones custom"]
  }
};

const PlanCard = memo(({ planKey, plan, current }: {
  planKey: string;
  plan: typeof PLANS[keyof typeof PLANS];
  current: boolean;
}) => (
  <div className={`rounded-xl border p-6 transition-all ${
    current 
      ? "bg-gold/5 border-gold shadow-lg" 
      : "bg-sidebar border-sidebar-border hover:border-sidebar-foreground/20"
  }`}>
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className={`text-lg font-bold ${current ? 'text-gold' : 'text-sidebar-foreground'}`}>
          {plan.name}
        </h3>
        <div className="mt-1">
          {plan.price === null ? (
            <span className="text-sm text-sidebar-foreground/60">Contactar ventas</span>
          ) : plan.price === 0 ? (
            <span className="text-2xl font-bold text-sidebar-foreground">Gratis</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-sidebar-foreground">
                ${(plan.price / 1000).toFixed(0)}K
              </span>
              <span className="text-xs text-sidebar-foreground/60">COP/mes</span>
            </div>
          )}
        </div>
      </div>
      {current && (
        <div className="px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold">
          Plan Actual
        </div>
      )}
    </div>

    <ul className="space-y-2 mb-6">
      {plan.features.map((feature, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-sidebar-foreground/70">
          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          {feature}
        </li>
      ))}
    </ul>

    {!current && (
      <Button 
        size="sm" 
        variant={planKey === 'enterprise' ? 'default' : 'outline'}
        className={`w-full ${planKey === 'enterprise' ? 'bg-gold-gradient text-navy font-bold' : ''}`}
      >
        {planKey === 'enterprise' ? 'Contactar Ventas' : 'Actualizar Plan'}
      </Button>
    )}
  </div>
));
PlanCard.displayName = "PlanCard";

export const BillingPanel = memo(({ tenantPlan = 'free', tenantActive = true }: BillingPanelProps) => {
  const currentPlan = PLANS[tenantPlan as keyof typeof PLANS] || PLANS.free;
  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  return (
    <div className="space-y-6">
      {/* Header Alert */}
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${
        tenantActive 
          ? 'bg-green-500/5 border-green-500/20' 
          : 'bg-red-500/5 border-red-500/20'
      }`}>
        {tenantActive ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-500/90">
              Tu suscripción está activa y al día
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-500/90">
              Tu suscripción está inactiva. Contacta soporte para reactivarla.
            </span>
          </>
        )}
      </div>

      {/* Current Subscription Info */}
      <div className="rounded-xl border bg-sidebar border-sidebar-border p-6">
        <h3 className="text-sm font-bold text-sidebar-foreground mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-gold" />
          Suscripción Actual
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-gold" />
              <span className="text-[10px] text-sidebar-foreground/40 uppercase">Plan Activo</span>
            </div>
            <div className="text-lg font-bold text-sidebar-foreground">{currentPlan.name}</div>
          </div>

          <div className="p-4 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] text-sidebar-foreground/40 uppercase">Próximo Cobro</span>
            </div>
            <div className="text-lg font-bold text-sidebar-foreground">
              {nextBillingDate.toLocaleDateString("es-CO", { day: 'numeric', month: 'short' })}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-[10px] text-sidebar-foreground/40 uppercase">Monto Mensual</span>
            </div>
            <div className="text-lg font-bold text-sidebar-foreground">
              {currentPlan.price === null ? 'Custom' : currentPlan.price === 0 ? 'Gratis' : `$${(currentPlan.price / 1000).toFixed(0)}K COP`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-sidebar-border/30">
          <Button size="sm" variant="outline" className="flex-1">
            Ver Historial de Pagos
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            Descargar Facturas
          </Button>
          <Button size="sm" className="flex-1 bg-gold-gradient text-navy font-bold">
            Métodos de Pago
          </Button>
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <h3 className="text-sm font-bold text-sidebar-foreground mb-4">Planes Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(PLANS).map(([key, plan]) => (
            <PlanCard 
              key={key} 
              planKey={key} 
              plan={plan} 
              current={key === tenantPlan} 
            />
          ))}
        </div>
      </div>

      {/* Upgrade CTA */}
      {tenantPlan === 'free' || tenantPlan === 'starter' ? (
        <div className="rounded-xl border border-gold/20 bg-gold/5 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-gold" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-sidebar-foreground mb-1">
                Desbloquea todo el potencial de CELLVI
              </h3>
              <p className="text-xs text-sidebar-foreground/60 mb-4">
                Actualiza a Professional o Enterprise para acceder a IA predictiva, reportes avanzados, 
                usuarios ilimitados y soporte prioritario 24/7.
              </p>
              <Button size="sm" className="bg-gold-gradient text-navy font-bold">
                Ver Planes Premium →
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
});
BillingPanel.displayName = "BillingPanel";
