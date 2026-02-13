import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Target, Eye, BookOpen } from "lucide-react";


const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  const cards = [
    { icon: Target, title: t("about.mission"), text: t("about.missionText") },
    { icon: Eye, title: t("about.vision"), text: t("about.visionText") },
    { icon: BookOpen, title: t("about.legality"), text: t("about.legalityText") },
  ];

  return (
    <section id="nosotros" className="py-20 md:py-28 bg-section-gradient" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">{t("about.badge")}</span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">{t("about.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg">{t("about.subtitle")}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.15 * i }} className="bg-card rounded-xl p-8 shadow-navy/5 shadow-lg border border-border hover:border-gold/40 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-gold-gradient flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <card.icon className="w-7 h-7 text-navy" />
              </div>
              <h3 className="font-heading font-bold text-xl text-foreground mb-3">{card.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{card.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.5 }} className="grid md:grid-cols-2 gap-8 mt-16">
          <div className="rounded-xl overflow-hidden shadow-lg border border-border">
            <img src="/security-center.jpg" alt={t("about.headquarters")} className="w-full h-64 md:h-80 object-cover" />
            <div className="p-4 bg-card">
              <h4 className="font-heading font-bold text-foreground">{t("about.headquarters")}</h4>
              <p className="text-muted-foreground text-sm">{t("about.headquartersAddr")}</p>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg border border-border">
            <img src="/mechanic-check.jpg" alt={t("about.fleet")} className="w-full h-64 md:h-80 object-cover" />
            <div className="p-4 bg-card">
              <h4 className="font-heading font-bold text-foreground">{t("about.fleet")}</h4>
              <p className="text-muted-foreground text-sm">{t("about.fleetDesc")}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
