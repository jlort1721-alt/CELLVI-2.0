
import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: 25000,
    color: "blue",
    features: [
      "Rastreo GPS en vivo (30s)",
      "Alertas Básicas (Geocercas, Velocidad)",
      "App Móvil para Conductores",
      "Histórico de Rutas (30 días)"
    ],
    idealFor: "Motos y Vehículos Particulares"
  },
  {
    name: "Professional",
    price: 45000,
    color: "gold",
    features: [
      "Todo en Starter",
      "Telemetría Avanzada (CAN Bus)",
      "Control de Combustible",
      "API Access & Webhooks",
      "Soporte Prioritario 24/7",
      "Histórico de Rutas (1 año)"
    ],
    popular: true,
    idealFor: "Flotas de Carga y Logística"
  },
  {
    name: "Enterprise",
    price: 75000,
    color: "purple",
    features: [
      "Todo en Pro",
      "Video IA en Cabina (DMS)",
      "Satélite Backup (Iridium)",
      "Auditoría Inmutable (Blockchain)",
      "Manager de Cuenta Dedicado",
      "Histórico Ilimitado"
    ],
    idealFor: "Operaciones Críticas y Valores"
  },
];

const PricingSection = () => {
  const { t } = useTranslation();
  const [activePlan, setActivePlan] = useState("Professional");
  const [deviceCount, setDeviceCount] = useState(10);
  const [isAnnual, setIsAnnual] = useState(true);

  const calculateTotal = () => {
    const plan = plans.find(p => p.name === activePlan);
    const basePrice = plan?.price || 0;
    const multiplier = isAnnual ? 10 : 1; // 2 months free
    return basePrice * deviceCount * multiplier;
  };

  return (
    <section id="pricing" className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-primary rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-64 h-64 bg-gold rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase mb-2 block animate-in fade-in slide-in-from-bottom-4 duration-700">Planes Flexibles</span>
          <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-foreground mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            Invierte en Seguridad, <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-600">Ahorra en Operación</span>
          </h2>
          <p className="text-muted-foreground text-lg animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            Diseñados para escalar contigo. Desde un solo vehículo hasta flotas multinacionales.
          </p>
        </div>

        {/* Pricing Calculator Control */}
        <div className="bg-card border border-border rounded-xl p-6 max-w-4xl mx-auto mb-12 shadow-lg animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:w-1/2">
              <label className="text-sm font-bold text-foreground block mb-2 flex justify-between">
                <span>Tamaño de tu Flota</span>
                <span className="text-gold">{deviceCount} activos</span>
              </label>
              <input
                type="range"
                min="1" max="100"
                value={deviceCount}
                onChange={(e) => setDeviceCount(parseInt(e.target.value))}
                className="w-full accent-gold h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
                <span>1</span>
                <span>50</span>
                <span>100+</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${!isAnnual ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Mensual
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all relative ${isAnnual ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Anual
                <span className="absolute -top-3 -right-3 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold animate-pulse">
                  -17% OFF
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              onClick={() => setActivePlan(plan.name)}
              className={`relative rounded-2xl p-8 border transition-all duration-300 cursor-pointer group ${activePlan === plan.name
                  ? `border-${plan.color}-500 bg-card shadow-[0_0_30px_rgba(var(--${plan.color}-rgb),0.1)] scale-105 z-10 ring-2 ring-${plan.color}-500/20`
                  : "border-border bg-card/50 hover:bg-card hover:border-foreground/20 hover:scale-[1.02]"
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

              <div className={`text-${plan.color === 'gold' ? 'yellow-500' : plan.color === 'purple' ? 'purple-500' : 'blue-500'} font-bold uppercase tracking-widest text-xs mb-2`}>
                {plan.name}
              </div>

              <div className="mb-4">
                <span className="text-4xl font-heading font-extrabold text-foreground">
                  ${(plan.price * (isAnnual ? 10 : 1) * deviceCount).toLocaleString()}
                </span>
                <span className="text-muted-foreground text-sm ml-1 font-medium">/{isAnnual ? 'año' : 'mes'}</span>
              </div>

              <p className="text-xs text-muted-foreground mb-6 h-5">{plan.idealFor}</p>

              <Button
                className={`w-full font-bold mb-8 ${activePlan === plan.name
                    ? "bg-gold hover:bg-gold/90 text-white shadow-lg"
                    : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
              >
                Elegir {plan.name}
              </Button>

              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    <div className={`mt-0.5 rounded-full p-0.5 ${activePlan === plan.name ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}>
                      <Check className="w-3 h-3" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500">
          <p className="text-muted-foreground text-sm mb-4">¿Necesitas una solución a medida para más de 100 activos?</p>
          <Button variant="link" className="text-gold font-bold text-lg hover:no-underline group">
            Contactar a Ventas Enterprise <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
