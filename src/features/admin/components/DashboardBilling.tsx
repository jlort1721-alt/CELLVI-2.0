
import { useState } from "react";
import { CreditCard, DollarSign, PieChart, Users, Package, ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  { name: "Starter", price: 25000, color: "blue", features: ["Rastreo GPS 30s", "Alertas Básicas", "App Conductor"] },
  { name: "Professional", price: 45000, color: "gold", features: ["Todo en Starter", "Telemetría CAN", "Control Combustible", "API Access"], popular: true },
  { name: "Enterprise", price: 75000, color: "purple", features: ["Todo en Pro", "Video IA", "Satélite Backup", "Auditoría Inmutable"] },
];

const DashboardBilling = () => {
  const [activePlan, setActivePlan] = useState("Professional");
  const [deviceCount, setDeviceCount] = useState(50);
  const [addOns, setAddOns] = useState({ satellite: false, video: true, evidence: false });

  const calculateTotal = () => {
    const basePrice = plans.find(p => p.name === activePlan)?.price || 0;
    let addOnPrice = 0;
    if (addOns.satellite) addOnPrice += 20000;
    if (addOns.video) addOnPrice += 35000;
    if (addOns.evidence) addOnPrice += 10000;

    return (basePrice + addOnPrice) * deviceCount;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-sidebar-foreground text-2xl flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-gold" /> Facturación & Suscripción
          </h2>
          <p className="text-sm text-sidebar-foreground/50">Gestiona tus planes, métodos de pago y descarga facturas fiscales.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-sidebar-foreground/50 mb-1">Próxima factura: 15 Mar 2026</div>
          <div className="text-xl font-heading font-bold text-sidebar-foreground">$ 2,450,000 COP</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Plan Selector / Calculator */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-sidebar rounded-xl border border-sidebar-border p-6">
            <h3 className="font-heading font-bold text-sidebar-foreground mb-4">Calculadora de Inversión</h3>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-sidebar-foreground block mb-2">Tamaño de Flota: {deviceCount} activos</label>
                <input
                  type="range"
                  min="1" max="500"
                  value={deviceCount}
                  onChange={(e) => setDeviceCount(parseInt(e.target.value))}
                  className="w-full accent-gold h-2 bg-sidebar-accent rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {plans.map((p) => (
                  <div
                    key={p.name}
                    onClick={() => setActivePlan(p.name)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${activePlan === p.name ? `border-${p.color}-500 bg-${p.color}-500/10 ring-1 ring-${p.color}-500` : "border-sidebar-border bg-sidebar-accent/30 hover:bg-sidebar-accent"}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-bold ${activePlan === p.name ? `text-${p.color}-500` : "text-sidebar-foreground"}`}>{p.name}</span>
                      {p.popular && <span className="text-[9px] bg-gold text-white px-1.5 py-0.5 rounded uppercase font-bold">Best</span>}
                    </div>
                    <div className="text-xl font-heading font-bold text-sidebar-foreground mb-1">${(p.price / 1000).toFixed(0)}k <span className="text-[10px] font-normal text-sidebar-foreground/50">/mes</span></div>
                    <ul className="space-y-1 mt-3">
                      {p.features.map(f => (
                        <li key={f} className="text-[10px] text-sidebar-foreground/60 flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-500" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-sidebar-foreground block mb-2">Módulos Add-ons (Potenciadores)</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'satellite', label: 'Satélite Backup (+20k)', icon: '📡' },
                    { key: 'video', label: 'Video IA en Cabina (+35k)', icon: '📹' },
                    { key: 'evidence', label: 'Evidence Ledger (+10k)', icon: '⚖️' }
                  ].map((addon) => (
                    <button
                      key={addon.key}
                      onClick={() => setAddOns({ ...addOns, [addon.key]: !addOns[addon.key as keyof typeof addOns] })}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${addOns[addon.key as keyof typeof addOns] ? "border-gold bg-gold/10 text-gold" : "border-sidebar-border text-sidebar-foreground/60 bg-sidebar-accent/30"
                        }`}
                    >
                      <span>{addon.icon}</span> {addon.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-sidebar-border flex items-center justify-between">
              <div>
                <div className="text-xs text-sidebar-foreground/50">Total Estimado Mensual</div>
                <div className="text-3xl font-heading font-bold text-sidebar-foreground text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-600">
                  $ {calculateTotal().toLocaleString()} <span className="text-sm text-sidebar-foreground/40 font-normal">COP + IVA</span>
                </div>
              </div>
              <Button className="bg-gold text-sidebar hover:bg-gold/90 font-bold">
                Solicitar Cotización Formal
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Usage Stats (FinOps) */}
        <div className="space-y-4">
          <div className="rounded-xl border border-sidebar-border bg-sidebar p-5">
            <h3 className="font-heading font-bold text-sidebar-foreground mb-3 text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-500" /> Consumo de Datos API
            </h3>
            <div className="relative h-2 bg-sidebar-accent rounded-full overflow-hidden mb-2">
              <div className="absolute top-0 left-0 h-full w-[65%] bg-purple-500"></div>
            </div>
            <div className="flex justify-between text-[10px] text-sidebar-foreground/50">
              <span>6.5M requests</span>
              <span>Límite: 10M</span>
            </div>
          </div>

          <div className="rounded-xl border border-sidebar-border bg-sidebar p-5">
            <h3 className="font-heading font-bold text-sidebar-foreground mb-3 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" /> Almacenamiento Evidence
            </h3>
            <div className="relative h-2 bg-sidebar-accent rounded-full overflow-hidden mb-2">
              <div className="absolute top-0 left-0 h-full w-[25%] bg-blue-500"></div>
            </div>
            <div className="flex justify-between text-[10px] text-sidebar-foreground/50">
              <span>120 GB usados</span>
              <span>Tier: 500 GB</span>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-sidebar-accent to-sidebar border border-sidebar-border p-5">
            <h3 className="font-heading font-bold text-sidebar-foreground mb-2 text-sm">¿Necesitas ayuda?</h3>
            <p className="text-xs text-sidebar-foreground/60 mb-4">Nuestro equipo de ingeniería comercial puede diseñar un plan a medida para tu operación logistica.</p>
            <Button variant="outline" size="sm" className="w-full border-sidebar-border hover:bg-gold/10 hover:text-gold text-xs">
              Contactar Asesor Enterprise
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardBilling;
