import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, memo } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Truck, Activity, Zap, Gauge, Fuel, Battery, Signal, Clock, ArrowRight } from "lucide-react";
import { vehicles } from "@/lib/demoData";
import { Button } from "@/components/ui/button";
import { useLandingStore } from "@/stores/landingStore";

/* ── Status helpers ───────────────────────────────── */
const statusKeys: Record<string, { color: string; bg: string; i18nKey: string }> = {
  activo: { color: "bg-emerald-500", bg: "bg-emerald-500/10", i18nKey: "liveDemo.inMovement" },
  detenido: { color: "bg-blue-400", bg: "bg-blue-500/10", i18nKey: "liveDemo.stopped" },
  alerta: { color: "bg-red-500", bg: "bg-red-500/10", i18nKey: "liveDemo.activeAlert" },
  apagado: { color: "bg-gray-500", bg: "bg-gray-500/10", i18nKey: "liveDemo.off" },
};

/* ── Vehicle List Item ────────────────────────────── */
const VehicleListItem = memo(({ vehicle, selected, onSelect, pulse, t }: {
  vehicle: typeof vehicles[0];
  selected: boolean;
  onSelect: () => void;
  pulse: boolean;
  t: (key: string) => string;
}) => {
  const st = statusKeys[vehicle.status] ?? statusKeys.apagado;
  return (
    <button
      onClick={onSelect}
      className={`w-full p-3.5 text-left transition-all rounded-lg ${
        selected ? "bg-gold/10 border border-gold/30" : "hover:bg-muted/50 border border-transparent"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-bold text-foreground text-sm">{vehicle.plate}</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${st.color} ${pulse && vehicle.status === "activo" ? "animate-ping" : ""}`} />
          <span className="text-[10px] text-muted-foreground font-mono">{vehicle.lastUpdate}</span>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mb-1.5">{vehicle.driver}</p>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st.bg} ${vehicle.status === "activo" ? "text-emerald-600 dark:text-emerald-400" : vehicle.status === "alerta" ? "text-red-600 dark:text-red-400" : vehicle.status === "detenido" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}>
          {t(st.i18nKey)}
        </span>
        {vehicle.speed > 0 && <span className="text-[10px] text-muted-foreground font-mono">{vehicle.speed} km/h</span>}
      </div>
    </button>
  );
});
VehicleListItem.displayName = "VehicleListItem";

/* ── Telemetry Gauge ──────────────────────────────── */
const TelemetryCard = memo(({ icon: Icon, label, value, unit, color, progress }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  unit: string;
  color: string;
  progress?: number;
}) => (
  <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
    </div>
    <p className="font-heading font-bold text-2xl text-foreground leading-none">
      {value}<span className="text-sm text-muted-foreground ml-1 font-normal">{unit}</span>
    </p>
    {progress !== undefined && (
      <div className="w-full bg-muted rounded-full h-1.5 mt-2.5">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${progress > 50 ? "bg-emerald-500" : progress > 25 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
    )}
  </div>
));
TelemetryCard.displayName = "TelemetryCard";

/* ── Main Section ─────────────────────────────────── */
const LiveDemoSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();
  const selectedVehicleId = useLandingStore((s) => s.selectedVehicleId);
  const setSelectedVehicleId = useLandingStore((s) => s.setSelectedVehicleId);
  const [pulse, setPulse] = useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? vehicles[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const sv = selectedVehicle;
  const st = statusKeys[sv.status] ?? statusKeys.apagado;

  return (
    <section className="py-20 md:py-28 bg-section-gradient relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-blue-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[20%] left-[10%] w-96 h-96 bg-gold/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </div>
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">{t("liveDemo.badge")}</span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground">
            {t("liveDemo.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg leading-relaxed">
            {t("liveDemo.subtitle")}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
          {/* Vehicle List */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-card rounded-xl border border-border overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <h3 className="font-heading font-bold text-foreground text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gold" />
                  {t("liveDemo.demoFleet", { count: vehicles.length })}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[520px]">
                {vehicles.map((vehicle) => (
                  <VehicleListItem
                    key={vehicle.id}
                    vehicle={vehicle}
                    selected={sv.id === vehicle.id}
                    onSelect={() => setSelectedVehicleId(vehicle.id)}
                    pulse={pulse}
                    t={t}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Vehicle Detail */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-xl text-foreground mb-0.5">{sv.plate}</h3>
                    <p className="text-sm text-muted-foreground">{sv.driver} &middot; {sv.type}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg ${st.bg}`}>
                    <Activity className={`w-3.5 h-3.5 ${sv.status === "activo" ? "text-emerald-500" : sv.status === "alerta" ? "text-red-500" : "text-blue-400"}`} />
                    <span className={`text-xs font-bold ${sv.status === "activo" ? "text-emerald-600 dark:text-emerald-400" : sv.status === "alerta" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
                      {t(st.i18nKey)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="relative h-56 bg-muted/10 border-b border-border">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                      <MapPin className="w-7 h-7 text-gold" />
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {sv.lat.toFixed(4)}, {sv.lng.toFixed(4)}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{sv.route}</p>
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <div className="bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${pulse ? "animate-pulse" : ""}`} />
                    <span className="text-[10px] font-semibold text-foreground">{t("liveDemo.liveUpdate")}</span>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3">
                  <div className="bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{sv.lastUpdate}</span>
                  </div>
                </div>
              </div>

              {/* Telemetry Grid */}
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <TelemetryCard icon={Gauge} label={t("liveDemo.speed")} value={sv.speed} unit="km/h" color="text-blue-500" />
                  <TelemetryCard icon={Fuel} label={t("liveDemo.fuel")} value={sv.fuel} unit="%" color="text-orange-500" progress={sv.fuel} />
                  <TelemetryCard icon={Battery} label={t("liveDemo.battery")} value={sv.battery} unit="%" color="text-emerald-500" progress={sv.battery} />
                  <TelemetryCard icon={Signal} label={t("liveDemo.signal")} value={`${sv.signal}/5`} unit="" color="text-purple-500" />
                </div>

                {/* Additional Info */}
                <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">{t("liveDemo.mileage")}</p>
                    <p className="text-sm font-bold text-foreground">{sv.km.toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">{t("liveDemo.engine")}</p>
                    <p className={`text-sm font-bold ${sv.engineOn ? "text-emerald-500" : "text-muted-foreground"}`}>
                      {sv.engineOn ? t("liveDemo.engineOn") : t("liveDemo.engineOff")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">{t("liveDemo.signal")}</p>
                    <p className={`text-sm font-bold ${sv.locked ? "text-emerald-500" : "text-yellow-500"}`}>
                      {sv.signal}/5
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-5">{t("liveDemo.ctaText")}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-gold to-yellow-500 font-heading font-bold text-navy hover:from-gold/90 hover:to-yellow-500/90 shadow-[0_0_25px_rgba(212,175,55,0.2)] group">
              <a href="/demo">
                <Zap className="w-4 h-4 mr-2" />
                {t("liveDemo.ctaButton")}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border hover:bg-muted font-heading font-semibold group">
              <a href="#pricing">
                {t("pricing.cta")}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LiveDemoSection;
