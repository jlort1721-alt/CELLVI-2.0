import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Shield } from "lucide-react";

const POLICY_COUNT = 13;

const PoliciesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  return (
    <section id="politicas" className="py-20 md:py-28 bg-section-gradient" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">{t("policies.badge")}</span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">{t("policies.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg">{t("policies.subtitle")}</p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid gap-4">
          {Array.from({ length: POLICY_COUNT }, (_, i) => i + 1).map((num, i) => (
            <motion.div key={num} initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.4, delay: 0.05 * i }} className="flex gap-4 bg-card rounded-xl p-5 border border-border hover:border-gold/40 transition-colors shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center mt-0.5">
                <span className="font-heading font-bold text-navy text-sm">{num}</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{t(`policies.policy${num}`)}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.8 }} className="flex justify-center mt-12">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-6 py-2">
            <Shield className="w-5 h-5 text-gold" />
            <span className="text-sm font-medium text-foreground">{t("policies.commitment")}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PoliciesSection;
