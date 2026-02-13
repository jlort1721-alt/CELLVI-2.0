import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Car, Building2, Construction, Headphones, Globe, ShieldCheck, ScanFace, Camera, Bell, DoorOpen, Radio } from "lucide-react";

const icons = [Car, Building2, Construction, Headphones, Globe, ShieldCheck, ScanFace, Camera, Bell, DoorOpen, Radio];

const ServicesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  const services = icons.map((icon, i) => ({
    icon,
    title: t(`services.svc${i + 1}`),
    desc: t(`services.svc${i + 1}Desc`),
  }));

  return (
    <section id="servicios" className="py-20 md:py-28 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">{t("services.badge")}</span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">{t("services.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg">{t("services.subtitle")}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.08 * i }} className="group relative bg-card rounded-xl overflow-hidden border border-border hover:border-gold/50 transition-all hover:shadow-lg">
              <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-7">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-gold/15 transition-colors">
                  <svc.icon className="w-6 h-6 text-primary group-hover:text-gold transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-lg text-foreground mb-3">{svc.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{svc.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
