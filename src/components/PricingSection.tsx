
import { useState } from "react";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pricingPlans, formatCurrency } from "@/lib/demoData";

const PricingSection = () => {
  const [activePlan, setActivePlan] = useState("professional");
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-primary rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-64 h-64 bg-gold rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase mb-2 block animate-in fade-in slide-in-from-bottom-4 duration-700">
            Planes Flexibles
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-foreground mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            Invierte en Seguridad, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-600">
              Ahorra en Operación
            </span>
          </h2>
          <p className="text-muted-foreground text-lg animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            Planes diseñados para empresas colombianas. Sin costos ocultos, todo incluido.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              !isAnnual
                ? 'bg-gold text-white shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pago Mensual
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all relative ${
              isAnnual
                ? 'bg-gold text-white shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pago Anual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-full uppercase font-bold animate-pulse flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Ahorra 17%
            </span>
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, i) => {
            const price = isAnnual ? plan.priceYearly : plan.priceMonthly;
            const isActive = activePlan === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setActivePlan(plan.id)}
                className={`relative rounded-2xl p-8 border transition-all duration-300 cursor-pointer group ${
                  isActive
                    ? 'border-gold bg-card shadow-[0_0_30px_rgba(212,175,55,0.1)] scale-105 z-10 ring-2 ring-gold/20'
                    : 'border-border bg-card/50 hover:bg-card hover:border-foreground/20 hover:scale-[1.02]'
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute top-0 inset-x-0 -translate-y-1/2 flex justify-center">
                    <span className="bg-gold text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                      Más Popular
                    </span>
                  </div>
                )}

                <div className="text-gold font-bold uppercase tracking-widest text-xs mb-2">
                  {plan.name}
                </div>

                <div className="mb-2">
                  <span className="text-4xl font-heading font-extrabold text-foreground">
                    {formatCurrency(price, plan.currency)}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1 font-medium">
                    /{isAnnual ? 'año' : 'mes'}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  {typeof plan.maxVehicles === 'number'
                    ? `Hasta ${plan.maxVehicles} vehículos`
                    : 'Vehículos ilimitados'}
                </p>

                <p className="text-xs text-muted-foreground mb-6 min-h-[40px]">
                  {plan.description}
                </p>

                <Button
                  className={`w-full font-bold mb-8 ${
                    isActive
                      ? 'bg-gold hover:bg-gold/90 text-white shadow-lg'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  Elegir {plan.name}
                </Button>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors"
                    >
                      <div
                        className={`mt-0.5 rounded-full p-0.5 ${
                          isActive
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="flex-1 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500">
          <p className="text-muted-foreground text-sm mb-4">
            ¿Necesitas una solución a medida para más de 100 vehículos?
          </p>
          <Button variant="link" className="text-gold font-bold text-lg hover:no-underline group">
            Contactar a Ventas Enterprise{' '}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
