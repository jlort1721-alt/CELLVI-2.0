import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  TrendingUp,
  Activity,
  MapPin,
  Shield,
  Bell,
  Zap,
  Leaf,
  Fuel
} from "lucide-react";
import { platformStats, formatNumber, formatKm, formatPercentage } from "@/lib/demoData";

const PlatformStatsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !animated) {
      setAnimated(true);
    }
  }, [isInView, animated]);

  const stats = [
    {
      icon: MapPin,
      value: platformStats.totalVehicles,
      label: "Vehículos Monitoreados",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      format: (val: number) => formatNumber(val),
    },
    {
      icon: Activity,
      value: platformStats.activeVehicles,
      label: "En Operación Ahora",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      format: (val: number) => formatNumber(val),
    },
    {
      icon: TrendingUp,
      value: platformStats.kmTraveledThisMonth,
      label: "Recorridos Este Mes",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      format: (val: number) => formatKm(val),
    },
    {
      icon: Shield,
      value: platformStats.uptime,
      label: "Disponibilidad del Sistema",
      color: "text-gold",
      bgColor: "bg-gold/10",
      format: (val: number) => `${formatPercentage(val, 2)}`,
    },
    {
      icon: Bell,
      value: platformStats.resolvedAlerts,
      label: `Alertas Resueltas (de ${formatNumber(platformStats.totalAlerts)})`,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      format: (val: number) => formatNumber(val),
    },
    {
      icon: Zap,
      value: platformStats.avgResponseTime,
      label: "Tiempo Promedio de Respuesta",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      format: (val: number) => `${val.toFixed(1)} min`,
    },
    {
      icon: Fuel,
      value: platformStats.fuelSavings,
      label: "Ahorro en Combustible",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      format: (val: number) => `${formatPercentage(val, 1)}`,
    },
    {
      icon: Leaf,
      value: platformStats.co2Reduction,
      label: "Reducción de CO₂ (Toneladas)",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      format: (val: number) => `${val.toFixed(1)}t`,
    },
  ];

  const AnimatedCounter = ({
    value,
    format
  }: {
    value: number;
    format: (val: number) => string
  }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!animated) return;

      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(current);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [animated, value]);

    return <span>{format(count)}</span>;
  };

  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden" ref={ref}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-96 h-96 bg-gold rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[15%] w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">
            Impacto en Tiempo Real
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">
            La Confianza de Cientos de Empresas
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg">
            Datos actualizados en vivo desde nuestra plataforma. Transparencia total, resultados medibles.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i }}
              className="group bg-card rounded-xl p-6 border border-border hover:border-gold/50 transition-all shadow-sm hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>

              <div className="mb-2">
                <div className={`font-heading font-extrabold text-3xl ${stat.color} transition-colors`}>
                  <AnimatedCounter value={stat.value} format={stat.format} />
                </div>
              </div>

              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Additional achievement badges */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {[
            { value: "23+", label: "Años de Experiencia" },
            { value: "500+", label: "Clientes Activos" },
            { value: "99.9%", label: "Satisfacción Cliente" },
            { value: "24/7", label: "Soporte Continuo" },
          ].map((badge, i) => (
            <div
              key={badge.label}
              className="text-center p-4 rounded-lg bg-card/50 border border-border/50"
            >
              <div className="font-heading font-bold text-2xl text-gold mb-1">
                {badge.value}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {badge.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PlatformStatsSection;
