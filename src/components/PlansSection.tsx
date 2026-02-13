import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Check, Star, Zap, Shield, Settings, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

const planIcons = [Star, Zap, Shield, Settings, Wrench];
const planKeys = ["premium", "standard", "comodato", "homologacion", "special"];
const planFeatureKeys = [
  ["feat_own", "feat_yearly", "feat_install", "feat_support247", "feat_cellvi"],
  ["feat_own", "feat_monthly", "feat_install", "feat_support", "feat_cellvi"],
  ["feat_comodato", "feat_yearly", "feat_install", "feat_support247", "feat_noinvest"],
  ["feat_existing", "feat_reprogram", "feat_network", "feat_support", "feat_nochange"],
  ["feat_accessories", "feat_yellow", "feat_cranes", "feat_tanks", "feat_custom"],
];

const PlansSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  return (
    <section id="planes" className="py-20 md:py-28 bg-section-gradient" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">{t("plans.badge")}</span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">{t("plans.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg">{t("plans.subtitle")}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {planKeys.map((key, i) => {
            const featured = i === 0;
            const Icon = planIcons[i];
            return (
              <motion.div key={key} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 * i }}
                className={`relative rounded-xl p-8 border transition-all hover:shadow-lg ${featured ? "bg-navy border-gold/50 shadow-navy" : "bg-card border-border hover:border-gold/40"}`}>
                {featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-gradient text-navy font-heading font-bold text-xs px-4 py-1 rounded-full">{t("plans.recommended")}</div>}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${featured ? "bg-gold/20" : "bg-primary/10"}`}>
                  <Icon className={`w-6 h-6 ${featured ? "text-gold" : "text-primary"}`} />
                </div>
                <h3 className={`font-heading font-bold text-xl mb-3 ${featured ? "text-primary-foreground" : "text-foreground"}`}>{t(`plans.${key}`)}</h3>
                <p className={`text-sm mb-6 leading-relaxed ${featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t(`plans.${key}Desc`)}</p>
                <ul className="space-y-3 mb-8">
                  {planFeatureKeys[i].map((fk) => (
                    <li key={fk} className="flex items-center gap-2">
                      <Check className={`w-4 h-4 flex-shrink-0 ${featured ? "text-gold" : "text-gold-dark"}`} />
                      <span className={`text-sm ${featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{t(`plans.${fk}`)}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className={`w-full font-heading font-bold ${featured ? "bg-gold-gradient text-navy hover:opacity-90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
                  <a href="#contacto">{t("plans.requestInfo")}</a>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
