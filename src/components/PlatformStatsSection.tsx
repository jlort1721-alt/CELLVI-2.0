import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState, memo } from "react";
import { useTranslation } from "react-i18next";
import {
  TrendingUp, Activity, MapPin, Shield, Bell, Zap, Leaf, Fuel,
  Server, Clock, CheckCircle
} from "lucide-react";
import { platformStats, formatNumber, formatKm, formatPercentage } from "@/lib/demoData";

/* ── Animated Counter ─────────────────────────────────── */
const AnimatedCounter = memo(({ value, format, started }: {
  value: number;
  format: (val: number) => string;
  started: boolean;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setCount(value); clearInterval(timer); }
      else { setCount(current); }
    }, 2000 / steps);
    return () => clearInterval(timer);
  }, [started, value]);

  return <span>{format(count)}</span>;
});
AnimatedCounter.displayName = "AnimatedCounter";

/* ── Main Section ─────────────────────────────────────── */
const PlatformStatsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [animated, setAnimated] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (isInView && !animated) setAnimated(true);
  }, [isInView, animated]);

  const stats = [
    { icon: MapPin, value: platformStats.totalVehicles, labelKey: "platformStats.vehiclesMonitored", color: "#3b82f6", format: (v: number) => formatNumber(v) },
    { icon: Activity, value: platformStats.activeVehicles, labelKey: "platformStats.inOperation", color: "#22c55e", format: (v: number) => formatNumber(v) },
    { icon: TrendingUp, value: platformStats.kmTraveledThisMonth, labelKey: "platformStats.traveledThisMonth", color: "#a855f7", format: (v: number) => formatKm(v) },
    { icon: Shield, value: platformStats.uptime, labelKey: "platformStats.systemAvailability", color: "hsl(45,95%,55%)", format: (v: number) => `${formatPercentage(v, 2)}` },
    { icon: Bell, value: platformStats.resolvedAlerts, labelKey: "platformStats.alertsResolved", color: "#f97316", format: (v: number) => formatNumber(v) },
    { icon: Zap, value: platformStats.avgResponseTime, labelKey: "platformStats.avgResponseTime", color: "#eab308", format: (v: number) => `${v.toFixed(1)} min` },
    { icon: Fuel, value: platformStats.fuelSavings, labelKey: "platformStats.fuelSavings", color: "#06b6d4", format: (v: number) => `${formatPercentage(v, 1)}` },
    { icon: Leaf, value: platformStats.co2Reduction, labelKey: "platformStats.co2Reduction", color: "#10b981", format: (v: number) => `${v.toFixed(1)}t` },
  ];

  const enterpriseBadges = [
    { icon: Server, value: "99.97%", labelKey: "platformStats.systemAvailability" },
    { icon: Clock, value: "< 2s", labelKey: "platformStats.avgResponseTime" },
    { icon: Shield, value: "ISO 27001", labelKey: "platformStats.clientSatisfaction" },
    { icon: CheckCircle, value: "24/7", labelKey: "platformStats.continuousSupport" },
  ];

  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-96 h-96 bg-gold/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[20%] right-[15%] w-96 h-96 bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
            <Activity className="w-3.5 h-3.5 text-gold" />
            <span className="text-[11px] font-bold text-gold uppercase tracking-widest">{t("platformStats.badge")}</span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground">
            {t("platformStats.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg leading-relaxed">
            {t("platformStats.subtitle")}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.labelKey}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.06 * i }}
              className="group"
            >
              <div className="bg-card rounded-xl p-5 border border-border hover:border-gold/30 transition-all duration-300 hover:shadow-lg hover:shadow-gold/5 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: `${stat.color}15` }}>
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-muted-foreground/60 font-mono">LIVE</span>
                  </div>
                </div>
                <div className="font-heading font-extrabold text-2xl md:text-3xl transition-colors mb-1" style={{ color: stat.color }}>
                  <AnimatedCounter value={stat.value} format={stat.format} started={animated} />
                </div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{t(stat.labelKey)}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enterprise Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-14 border-t border-border pt-10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {enterpriseBadges.map((badge) => (
              <div key={badge.labelKey} className="flex items-center gap-3 justify-center p-4 rounded-xl bg-card/50 border border-border/50">
                <badge.icon className="w-5 h-5 text-gold flex-shrink-0" />
                <div>
                  <div className="font-heading font-bold text-lg text-foreground leading-none">{badge.value}</div>
                  <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t(badge.labelKey)}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PlatformStatsSection;
