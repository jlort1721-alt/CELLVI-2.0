import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, ArrowRight } from "lucide-react";

const posts = [
  { date: "22 Mayo 2025", titleKey: "Reunión Interinstitucional por la Seguridad Vial en el Sur del País", excerptKey: "Ante la creciente inseguridad en las vías de Cauca y Nariño, se llevó a cabo una reunión interinstitucional con la Policía de Tránsito para analizar los casos de piratería terrestre.", author: "Rómulo Bolaños" },
  { date: "28 Mayo 2024", titleKey: "ASEGURAR LTDA se Integra al Sistema RISTRA", excerptKey: "Se llevó a cabo una reunión con los directivos del RISTRA para integrar a nuestra empresa en esta plataforma tecnológica de alto impacto para la seguridad vial.", author: "Rómulo Bolaños" },
  { date: "2024", titleKey: "ASEGURAR en Alianza con AION: Defensa Predictiva 24/7", excerptKey: "Plataforma unificada de seguridad inteligente: video, IA, control y automatización. Monitoreo 24/7 con inteligencia artificial y nuevas tecnologías de seguridad.", author: "ASEGURAR LTDA" },
];

const BlogSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  return (
    <section id="blog" className="py-20 md:py-28 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">{t("blog.badge")}</span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">{t("blog.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg">{t("blog.subtitle")}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {posts.map((post, i) => (
            <motion.article key={i} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 * i }} className="bg-card rounded-xl overflow-hidden border border-border hover:border-gold/40 transition-all group hover:shadow-lg">
              <div className="h-2 bg-gold-gradient" />
              <div className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-3">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.author}</span>
                </div>
                <h3 className="font-heading font-bold text-foreground mb-3 group-hover:text-gold transition-colors line-clamp-2">{post.titleKey}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">{post.excerptKey}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-gold group-hover:gap-2 transition-all cursor-pointer">
                  {t("blog.readMore")} <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
