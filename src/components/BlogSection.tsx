import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, ArrowRight } from "lucide-react";

const postKeys = ["post1", "post2", "post3"];

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
          {postKeys.map((key, i) => (
            <motion.article key={key} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 * i }} className="bg-card rounded-xl overflow-hidden border border-border hover:border-gold/40 transition-all group hover:shadow-lg">
              <div className="h-2 bg-gold-gradient" />
              <div className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-3">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t(`blog.${key}Date`)}</span>
                  <span>&bull;</span>
                  <span>{t(`blog.${key}Author`)}</span>
                </div>
                <h3 className="font-heading font-bold text-foreground mb-3 group-hover:text-gold transition-colors line-clamp-2">{t(`blog.${key}Title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">{t(`blog.${key}Excerpt`)}</p>
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
