import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Gauge, MapPinned, Fuel, Clock, Route, AlertTriangle, FileText, Power } from "lucide-react";



const featureIcons = [Lock, AlertTriangle, Gauge, MapPinned, Route, Fuel, Clock, FileText, Power];

const PlatformSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  const features = featureIcons.map((icon, i) => ({
    icon,
    label: t(`platform.feat${i + 1}`),
  }));

  return (
    <section id="plataforma" className="py-20 md:py-28 bg-navy relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">{t("platform.badge")}</span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-primary-foreground mt-3">{t("platform.title")}</h2>
          <p className="text-primary-foreground/60 max-w-2xl mx-auto mt-4 text-lg">{t("platform.subtitle")}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.2 }}>
            <div className="grid grid-cols-3 gap-4">
              {features.map((feat, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.4, delay: 0.05 * i }} className="flex flex-col items-center text-center p-4 rounded-xl bg-navy-light/50 border border-gold/10 hover:border-gold/40 transition-all group">
                  <feat.icon className="w-7 h-7 text-gold mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-primary-foreground/80">{feat.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.3 }} className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-gold/20">
              <img src="/platform-preview-2.jpg" alt="Plataforma CELLVI" className="w-full" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gold-gradient rounded-2xl flex items-center justify-center shadow-gold">
              <div className="text-center">
                <div className="font-heading font-extrabold text-2xl text-navy">2.0</div>
                <div className="text-[10px] font-bold text-navy/70">CELLVI</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PlatformSection;
