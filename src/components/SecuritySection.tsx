import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Link2, ScrollText, Users } from "lucide-react";

const secItems = [
  { icon: ShieldCheck, key: "sec1" },
  { icon: Link2, key: "sec2" },
  { icon: ScrollText, key: "sec3" },
  { icon: Users, key: "sec4" },
];

const SecuritySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  return (
    <section className="py-20 md:py-28 bg-section-gradient" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">
            {t("platform.securityBadge")}
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">
            {t("platform.securityTitle")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg">
            {t("platform.securitySubtitle")}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="grid md:grid-cols-2 gap-6">
            {secItems.map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="bg-card rounded-xl p-7 border border-border hover:border-gold/40 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6 text-navy" />
                </div>
                <h3 className="font-heading font-bold text-lg text-foreground mb-2">
                  {t(`platform.${item.key}`)}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(`platform.${item.key}Desc`)}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-gold/20 relative group">
              <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
              <img src="/gnss-jamming.jpg" alt="Detección de Jamming GNSS" className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" />
            </div>

            <div className="absolute -bottom-6 -left-6 bg-card border border-border p-4 rounded-xl shadow-xl z-20 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <div>
                <div className="text-xs font-bold text-foreground">{t("security.jammingDetected")}</div>
                <div className="text-[10px] text-muted-foreground">{t("security.jammingAction")}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
