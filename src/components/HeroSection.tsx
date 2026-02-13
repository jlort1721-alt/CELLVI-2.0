import { motion } from "framer-motion";
import { Satellite, Shield, MapPin, Radio } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";



const HeroSection = () => {
  const { t } = useTranslation();

  const stats = [
    { value: t("hero.stat1"), label: t("hero.stat1Label") },
    { value: t("hero.stat2"), label: t("hero.stat2Label") },
    { value: t("hero.stat3"), label: t("hero.stat3Label") },
    { value: t("hero.stat4"), label: t("hero.stat4Label") },
  ];

  return (
    <section id="inicio" className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="/hero-bg-2.jpg" alt="Fondo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-hero-gradient opacity-80" />
      </div>

      <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-32 right-20 hidden lg:block">
        <Satellite className="w-12 h-12 text-gold/30" />
      </motion.div>
      <motion.div animate={{ y: [10, -10, 10] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-40 left-16 hidden lg:block">
        <Radio className="w-8 h-8 text-gold/20" />
      </motion.div>

      <div className="container mx-auto px-4 relative z-10 pt-24">
        <div className="max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-1.5 mb-6">
              <Shield className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-gold">{t("hero.badge")}</span>
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-primary-foreground leading-tight mb-6">
            {t("hero.title1")}{" "}
            <span className="text-gradient-gold">{t("hero.titleHighlight")}</span>{" "}
            {t("hero.title2")}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="text-lg md:text-xl text-primary-foreground/70 mb-8 max-w-2xl font-body">
            {t("hero.subtitle")}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }} className="flex flex-wrap gap-4 mb-16">
            <Button asChild size="lg" className="bg-gold-gradient font-heading font-bold text-navy hover:opacity-90 shadow-gold text-base px-8">
              <a href="#planes">{t("hero.cta1")}</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-gold/40 text-gold hover:bg-gold/10 font-heading font-semibold text-base px-8">
              <a href="/demo">{t("hero.cta2")}</a>
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }} className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="font-heading font-extrabold text-2xl md:text-3xl text-gold">{stat.value}</div>
                <div className="text-sm text-primary-foreground/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
