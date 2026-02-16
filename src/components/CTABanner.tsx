import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CTABannerProps {
  headingKey: string;
  subtextKey: string;
  ctaKey: string;
  ctaHref: string;
  variant?: "gold" | "navy";
}

const CTABanner = ({ headingKey, subtextKey, ctaKey, ctaHref, variant = "gold" }: CTABannerProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  const isGold = variant === "gold";

  return (
    <section ref={ref} className={`py-16 ${isGold ? "bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10" : "bg-navy"}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 text-center"
      >
        <h3 className={`font-heading font-extrabold text-2xl md:text-3xl mb-3 ${isGold ? "text-foreground" : "text-white"}`}>
          {t(headingKey)}
        </h3>
        <p className={`text-lg mb-6 max-w-xl mx-auto ${isGold ? "text-muted-foreground" : "text-white/60"}`}>
          {t(subtextKey)}
        </p>
        <Button
          asChild
          size="lg"
          className={`font-heading font-bold group ${
            isGold
              ? "bg-gradient-to-r from-gold to-yellow-500 text-navy hover:from-gold/90 hover:to-yellow-500/90 shadow-[0_0_25px_rgba(212,175,55,0.2)]"
              : "bg-white text-navy hover:bg-white/90"
          }`}
        >
          <a href={ctaHref}>
            {t(ctaKey)}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </Button>
      </motion.div>
    </section>
  );
};

export default CTABanner;
