import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Check,
  ArrowRight,
  Sparkles,
  Shield,
  Package,
  Users,
  Zap,
  Award,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  tiers,
  addOns,
  fairUseRules,
  partnerCommissions,
  countries,
} from "@/lib/pricingData";
import { useLandingStore } from "@/stores/landingStore";

/* ── Icon map for add-ons ─────────────────────────── */
const addOnIcons: Record<string, React.ElementType> = {
  video: Shield,
  evidence: Shield,
  satellite: Zap,
  support247: Users,
  coldchain: Package,
  partner: Award,
};

/* ── Icon map for partner tiers ───────────────────── */
const partnerIcons: Record<string, React.ElementType> = {
  silver: Award,
  gold: Star,
  platinum: Sparkles,
};

/* ── Format limit value (handle -1 = unlimited) ───── */
const formatLimit = (value: number, unlimited: string): string => {
  if (value === -1) return unlimited;
  return value.toLocaleString();
};

/* ── Main Section ─────────────────────────────────── */
const PricingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  const {
    selectedPlan,
    setSelectedPlan,
    pricingCountry,
    setPricingCountry,
  } = useLandingStore();

  const country = pricingCountry;

  return (
    <section
      id="pricing"
      className="py-20 md:py-28 bg-background relative overflow-hidden"
      ref={ref}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-80 h-80 bg-gold/5 rounded-full blur-[130px]" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-blue-500/5 rounded-full blur-[130px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* ── 1. Section Header ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-3.5 h-3.5 text-gold" />
            <span className="text-[11px] font-bold text-gold uppercase tracking-widest">
              {t("pricing.badge")}
            </span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-foreground mb-4">
            {t("pricing.title")}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t("pricing.subtitle")}
          </p>
        </motion.div>

        {/* ── 2. Country Selector ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-center gap-2 flex-wrap mb-12"
        >
          {countries.map((c) => (
            <button
              key={c.code}
              onClick={() => setPricingCountry(c.code)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                country === c.code
                  ? "bg-card text-foreground border-gold shadow-sm ring-1 ring-gold/20"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-card hover:text-foreground"
              }`}
            >
              <span className="text-base">{c.flag}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </motion.div>

        {/* ── 3. 4-Tier Pricing Grid ──────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
          {tiers.map((tier, i) => {
            const price = tier.basePrice[country];
            const isPopular = tier.popular === true;
            const isSelected = selectedPlan === tier.key;

            return (
              <motion.div
                key={tier.key}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                onClick={() => setSelectedPlan(tier.key)}
                className={`relative rounded-2xl p-7 border transition-all duration-300 cursor-pointer group ${
                  isPopular
                    ? "border-gold ring-2 ring-gold/20 scale-105 bg-card shadow-[0_0_40px_rgba(212,175,55,0.08)] z-10"
                    : isSelected
                    ? "border-gold bg-card shadow-[0_0_30px_rgba(212,175,55,0.06)] ring-1 ring-gold/20"
                    : "border-border bg-card/50 hover:bg-card hover:border-foreground/15 hover:scale-[1.01]"
                }`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute top-0 inset-x-0 -translate-y-1/2 flex justify-center">
                    <span className="bg-gradient-to-r from-gold to-yellow-500 text-navy text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {t("pricing.recommended")}
                    </span>
                  </div>
                )}

                {/* Tier name */}
                <div className="text-gold font-bold uppercase tracking-widest text-[11px] mb-2">
                  {t(`pricing.${tier.key}`)}
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground mb-4 min-h-[40px] leading-relaxed">
                  {t(`pricing.${tier.key}Desc`)}
                </p>

                {/* Price */}
                <div className="mb-2">
                  <span className="text-3xl font-heading font-extrabold text-foreground">
                    {price?.currency && price.amount !== "Contactar" && price.amount !== "Contact"
                      ? `${price.currency} ${price.amount}`
                      : price?.amount}
                  </span>
                  {price?.unit && (
                    <span className="text-muted-foreground text-sm ml-1.5">
                      {price.unit}
                    </span>
                  )}
                </div>

                {/* Assets range */}
                <p className="text-xs text-muted-foreground mb-5">
                  {tier.assets} {t("pricing.assets")}
                </p>

                {/* CTA button */}
                <Button
                  className={`w-full font-bold mb-6 h-11 ${
                    isPopular || isSelected
                      ? "bg-gradient-to-r from-gold to-yellow-500 hover:from-gold/90 hover:to-yellow-500/90 text-navy shadow-lg"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {t("pricing.cta")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                {/* Feature list */}
                <ul className="space-y-2 mb-5">
                  {tier.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2.5 text-[13px] text-muted-foreground group-hover:text-foreground/80 transition-colors"
                    >
                      <div
                        className={`mt-0.5 rounded-full p-0.5 flex-shrink-0 ${
                          isPopular || isSelected
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="flex-1 leading-relaxed">
                        {t(`pricing.${feat}`)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Limits */}
                <div className="border-t border-border pt-4">
                  <p className="text-[11px] font-bold text-gold uppercase tracking-widest mb-2.5">
                    {t("pricing.limitsTitle")}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex justify-between">
                      <span>{t("pricing.limit_users")}</span>
                      <span className="font-semibold text-foreground">
                        {formatLimit(tier.limits.usersIncluded, t("pricing.unlimited"))}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>{t("pricing.limit_events")}</span>
                      <span className="font-semibold text-foreground">
                        {formatLimit(tier.limits.eventsPerDay, t("pricing.unlimited"))}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>{t("pricing.limit_retention")}</span>
                      <span className="font-semibold text-foreground">
                        {formatLimit(tier.limits.retentionDays, t("pricing.unlimited"))}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>{t("pricing.limit_api")}</span>
                      <span className="font-semibold text-foreground">
                        {formatLimit(tier.limits.apiCallsPerMonth, t("pricing.unlimited"))}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>{t("pricing.limit_reports")}</span>
                      <span className="font-semibold text-foreground">
                        {formatLimit(tier.limits.reportsPerMonth, t("pricing.unlimited"))}
                      </span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── 4. Add-Ons Grid ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-5xl mx-auto mb-20"
        >
          <div className="text-center mb-10">
            <h3 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-3">
              {t("pricing.addonsTitle")}
            </h3>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto leading-relaxed">
              {t("pricing.addonsSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {addOns.map((addon, i) => {
              const Icon = addOnIcons[addon.key] || Package;
              const price = addon.price[country];

              return (
                <motion.div
                  key={addon.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.07 }}
                  className="bg-card rounded-xl border border-border p-5 hover:border-gold/30 transition-all group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-gold/10 rounded-lg p-2 flex-shrink-0">
                      <Icon className="w-4 h-4 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading font-bold text-sm text-foreground">
                        {t(`pricing.addon_${addon.key}`)}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {t(`pricing.addon_${addon.key}_desc`)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-foreground">
                      {price?.currency && price.amount !== "Consultar" && price.amount !== "Inquire"
                        ? `${price.currency} ${price.amount}`
                        : price?.amount}
                    </span>
                    {price?.unit && (
                      <span className="text-xs text-muted-foreground ml-1">
                        {price.unit}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── 5. Partner Program ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-4xl mx-auto mb-20"
        >
          <div className="text-center mb-10">
            <h3 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-3">
              {t("pricing.partnerTitle")}
            </h3>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto leading-relaxed">
              {t("pricing.partnerSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {partnerCommissions.map((partner, i) => {
              const Icon = partnerIcons[partner.key] || Award;

              return (
                <motion.div
                  key={partner.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                  className="bg-card rounded-xl border border-border p-6 text-center hover:border-gold/30 transition-all group"
                >
                  <div className="inline-flex items-center justify-center bg-gold/10 rounded-full p-3 mb-4">
                    <Icon className="w-6 h-6 text-gold" />
                  </div>
                  <h4 className="font-heading font-bold text-foreground mb-2">
                    {t(`pricing.partner_${partner.key}`)}
                  </h4>
                  <p className="text-3xl font-heading font-extrabold text-gold mb-1">
                    {partner.commission}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t("pricing.commission")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {partner.minAssets}+ {t("pricing.assets")}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── 6. Fair Use Accordion ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-3xl mx-auto mb-20"
        >
          <div className="text-center mb-10">
            <h3 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-3">
              {t("pricing.fairUseTitle")}
            </h3>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto leading-relaxed">
              {t("pricing.fairUseSubtitle")}
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {fairUseRules.map((ruleKey) => (
              <AccordionItem
                key={ruleKey}
                value={ruleKey}
                className="bg-card rounded-xl border border-border px-5"
              >
                <AccordionTrigger className="text-sm font-bold text-foreground hover:text-gold transition-colors py-4">
                  {t(`pricing.fair_${ruleKey}_title`)}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {t(`pricing.fair_${ruleKey}_body`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* ── 7. Enterprise CTA ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="max-w-3xl mx-auto bg-card rounded-2xl border border-border p-8 md:p-10 text-center">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-4">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">
                {t("pricing.enterprise")}
              </span>
            </div>
            <h3 className="font-heading font-bold text-xl md:text-2xl text-foreground mb-3">
              {t("pricing.enterpriseDesc")}
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-gold to-yellow-500 font-heading font-bold text-navy hover:from-gold/90 hover:to-yellow-500/90 shadow-[0_0_25px_rgba(212,175,55,0.2)] group"
              >
                <a href="#contacto">
                  {t("pricing.cta")}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
