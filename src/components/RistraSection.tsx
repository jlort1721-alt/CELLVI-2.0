import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Shield, CheckCircle, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const RistraSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-20 bg-navy relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 right-10 w-80 h-80 bg-gold rounded-full blur-[120px]" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-navy-light/50 rounded-2xl p-8 md:p-12 border border-gold/20">
            <div className="flex-shrink-0 relative group">
              <div className="absolute inset-0 bg-gold blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-2 border-gold/30 relative z-10 shadow-2xl">
                <img src="/evidence-seal.jpg" alt="Precinto Electrónico" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -top-2 -right-2 bg-gold text-navy text-[10px] font-bold px-2 py-0.5 rounded-full z-20">
                SEALED
              </div>
            </div>
            <div className="text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-1 mb-3">
                <CheckCircle className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs font-heading font-bold text-gold uppercase tracking-wider">{t("ristra.badge")}</span>
              </div>
              <h3 className="font-heading font-extrabold text-2xl md:text-3xl text-primary-foreground mb-3">{t("ristra.title")}</h3>
              <p className="text-primary-foreground/60 text-sm leading-relaxed mb-4">{t("ristra.text")}</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 text-xs text-primary-foreground/50"><Globe className="w-4 h-4 text-gold" /><span>{t("ristra.coverage")}</span></div>
                <div className="flex items-center gap-2 text-xs text-primary-foreground/50"><Lock className="w-4 h-4 text-gold" /><span>{t("ristra.secure")}</span></div>
                <div className="flex items-center gap-2 text-xs text-primary-foreground/50"><CheckCircle className="w-4 h-4 text-gold" /><span>{t("ristra.verified")}</span></div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Button asChild className="bg-gold-gradient text-navy font-heading font-bold hover:opacity-90">
                <a href="#contacto">{t("ristra.moreInfo")}</a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RistraSection;
