import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, MapPin, Play, CheckCircle, TrendingUp, Users, Globe, ArrowRight, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { platformStats } from "@/lib/demoData";
import { useEffect, useState, useRef, memo } from "react";

/* ── Animated Counter ──────────────────────────────── */
const AnimatedNumber = memo(({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else { setCount(current); }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  const display = Number.isInteger(target) ? Math.round(count) : count.toFixed(1);
  return <span ref={ref}>{display}{suffix}</span>;
});
AnimatedNumber.displayName = "AnimatedNumber";

/* ── Grid Background ──────────────────────────────── */
const GridBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02]" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[200px]" />
    <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[180px]" />
  </div>
));
GridBackground.displayName = "GridBackground";

/* ── Live Pulse ───────────────────────────────────── */
const LivePulse = memo(({ label }: { label: string }) => (
  <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{label}</span>
  </div>
));
LivePulse.displayName = "LivePulse";

/* ── Main ─────────────────────────────────────────── */
const HeroSection = () => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  const heroStats = [
    { icon: MapPin, value: platformStats.totalVehicles, suffix: "+", label: t("hero.stat1Label"), color: "text-blue-400", bg: "bg-blue-500/10" },
    { icon: TrendingUp, value: platformStats.uptime, suffix: "%", label: t("hero.stat2Label"), color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: Users, value: 500, suffix: "+", label: t("hero.stat3Label"), color: "text-purple-400", bg: "bg-purple-500/10" },
    { icon: Shield, value: 23, suffix: " ", label: t("hero.stat4Label"), color: "text-gold", bg: "bg-gold/10" },
  ];

  const trustBadges = [t("hero.trustBadge1"), t("hero.trustBadge2"), t("hero.trustBadge3")];

  return (
    <section id="inicio" ref={containerRef} className="relative min-h-screen flex items-center overflow-hidden bg-navy">
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <img src="/hero-bg-2.jpg" alt="" className="w-full h-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy" />
      </motion.div>
      <GridBackground />

      <div className="absolute top-20 right-10 hidden xl:block">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="w-64 h-64 rounded-full border border-gold/5" />
      </div>

      <motion.div className="container mx-auto px-4 relative z-10 pt-28 pb-16" style={{ opacity }}>
        <div className="max-w-5xl">
          {/* Top Badges */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-wrap items-center gap-3 mb-8">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5">
              <Shield className="w-4 h-4 text-gold" />
              <span className="text-xs font-bold text-gold uppercase tracking-wider">{t("hero.badge")}</span>
            </div>
            <LivePulse label={t("hero.livePulse")} />
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.1] mb-6 tracking-tight">
            {t("hero.title1")}{" "}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold">{t("hero.titleHighlight")}</span>
              <motion.div className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-gold/0 via-gold to-gold/0" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.8 }} />
            </span>{" "}
            {t("hero.title2")}
          </motion.h1>

          {/* Subtitle */}
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-lg md:text-xl text-white/60 mb-10 max-w-3xl font-body leading-relaxed">
            {t("hero.subtitle")}
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-wrap gap-4 mb-10">
            <Button asChild size="lg" className="bg-gradient-to-r from-gold to-yellow-500 font-heading font-bold text-navy hover:from-gold/90 hover:to-yellow-500/90 shadow-[0_0_30px_rgba(212,175,55,0.3)] text-base px-8 h-12 group">
              <a href="#pricing">
                {t("hero.cta1")}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-heading font-semibold text-base px-8 h-12 group backdrop-blur-sm bg-white/5">
              <a href="/demo">
                <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                {t("hero.cta2")}
              </a>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 font-heading font-medium text-base px-6 h-12 group">
              <a href="/platform">
                <Activity className="w-4 h-4 mr-2" />
                {t("hero.accessPlatform")}
              </a>
            </Button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-14">
            {trustBadges.map((badge, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-white/50">{badge}</span>
              </div>
            ))}
          </motion.div>

          {/* Stats Grid */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {heroStats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }} className="relative group">
                <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-5 border border-white/[0.08] hover:border-gold/20 transition-all duration-300 hover:bg-white/[0.06]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className={`font-heading font-extrabold text-2xl md:text-3xl ${stat.color} tracking-tight`}>
                    <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs text-white/40 mt-1 font-medium">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Enterprise Tech Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.2 }} className="mt-16 pt-10 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">{t("hero.trustBadge3")}</p>
            <div className="flex flex-wrap items-center gap-8">
              {["GPS Satelital", "4G/LTE", "LoRaWAN", "BLE 5.0", "GNSS Anti-Jamming"].map((tech, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-white/15" />
                  <span className="text-[10px] text-white/20 font-bold uppercase tracking-wider">{tech}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
