import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Star, Quote } from "lucide-react";

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  const testimonials = [
    { name: t("testimonials.t1Name"), company: t("testimonials.t1Company"), role: t("testimonials.t1Role"), text: t("testimonials.t1Text"), rating: 5 },
    { name: t("testimonials.t2Name"), company: t("testimonials.t2Company"), role: t("testimonials.t2Role"), text: t("testimonials.t2Text"), rating: 5 },
    { name: t("testimonials.t3Name"), company: t("testimonials.t3Company"), role: t("testimonials.t3Role"), text: t("testimonials.t3Text"), rating: 5 },
  ];

  return (
    <section className="py-20 md:py-28 bg-section-gradient" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">{t("testimonials.badge")}</span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">{t("testimonials.title")}</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((item, i) => (
            <motion.div key={item.name} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 * i }} className="bg-card rounded-xl p-8 border border-border hover:border-gold/40 transition-all shadow-sm relative">
              <Quote className="w-8 h-8 text-gold/20 absolute top-6 right-6" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: item.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-gold fill-gold" />
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 italic">"{item.text}"</p>
              <div>
                <p className="font-heading font-bold text-foreground text-sm">{item.name}</p>
                <p className="text-xs text-gold font-medium">{item.company}</p>
                <p className="text-xs text-muted-foreground">{item.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
