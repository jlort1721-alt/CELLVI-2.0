import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqKeys = [
  "sla", "security", "integration", "support", "compliance", "data",
  "satellite", "coldchain",
];

const FAQSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  return (
    <section id="faq" className="py-20 md:py-28 bg-background" ref={ref}>
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">
            {t("faq.badge")}
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">
            {t("faq.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg">
            {t("faq.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqKeys.map((key, i) => (
              <AccordionItem
                key={key}
                value={key}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-gold/40 transition-colors"
              >
                <AccordionTrigger className="font-heading font-semibold text-foreground hover:no-underline text-left">
                  {t(`faq.${key}_q`)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {t(`faq.${key}_a`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
