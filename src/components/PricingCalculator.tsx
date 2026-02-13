import { useState, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Calculator, Check, X, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { tiers, addOns, countries, type CountryConfig } from "@/lib/pricingData";

// Features for comparison table
const allFeatures = [
  "feat1", "feat2", "feat3", "feat4", "feat5", "feat6",
  "feat7", "feat8", "feat9", "feat10", "feat11", "feat12",
];

const PricingCalculator = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();
  const [country, setCountry] = useState<CountryConfig>(countries[0]);
  const [assetCount, setAssetCount] = useState(50);
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, boolean>>({});
  const [showComparison, setShowComparison] = useState(false);

  // Determine which tier fits the asset count
  const activeTier = useMemo(() => {
    if (assetCount <= 25) return tiers[0];
    if (assetCount <= 100) return tiers[1];
    if (assetCount <= 500) return tiers[2];
    return tiers[3];
  }, [assetCount]);

  // Parse price string to number
  const parsePrice = (str: string): number => {
    const clean = str.replace(/[^0-9.,]/g, "").replace(/\./g, "").replace(",", ".");
    return parseFloat(clean) || 0;
  };

  const baseMonthly = useMemo(() => {
    const price = activeTier.basePrice[country.code];
    if (!price || price.amount === "Contactar" || price.amount === "Contact") return null;
    return parsePrice(price.amount) * assetCount;
  }, [activeTier, country, assetCount]);

  const addOnsMonthly = useMemo(() => {
    let total = 0;
    addOns.forEach((a) => {
      if (selectedAddOns[a.key]) {
        const p = a.price[country.code];
        if (p && p.amount !== "Consultar" && p.amount !== "Inquire") {
          const unitPrice = parsePrice(p.amount);
          // video/coldchain per asset, support247 flat, satellite per 100 msgs estimate
          if (a.key === "support247" || a.key === "partner") {
            total += unitPrice;
          } else if (a.key === "satellite") {
            total += unitPrice * assetCount * 30; // ~30 msgs/asset/month
          } else {
            total += unitPrice * assetCount;
          }
        }
      }
    });
    return total;
  }, [selectedAddOns, country, assetCount]);

  const totalMonthly = baseMonthly !== null ? baseMonthly + addOnsMonthly : null;
  const currency = country.currency;

  const formatCurrency = (val: number) => {
    if (currency === "COP") return `$${val.toLocaleString("es-CO")} COP`;
    if (currency === "MXN") return `$${val.toLocaleString("es-MX")} MXN`;
    return `$${val.toLocaleString("en-US")} USD`;
  };

  return (
    <section className="py-16 md:py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4 max-w-6xl">
        {/* ── Calculator ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-3 py-1 rounded-full text-xs font-heading font-bold mb-3">
              <Calculator className="w-3.5 h-3.5" /> {t("pricing.calcTitle")}
            </div>
            <h3 className="font-heading font-extrabold text-2xl md:text-3xl text-foreground">
              {t("pricing.calcSubtitle")}
            </h3>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Left: Inputs */}
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-heading font-bold text-foreground mb-2 block">{t("pricing.calcCountry")}</label>
                  <div className="flex flex-wrap gap-2">
                    {countries.map((c) => (
                      <button key={c.code} onClick={() => setCountry(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${country.code === c.code ? "bg-gold-gradient text-navy" : "bg-muted text-muted-foreground"}`}>
                        {c.flag} {c.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-heading font-bold text-foreground mb-2 block">
                    {t("pricing.calcAssets")}: <span className="text-gold">{assetCount}</span>
                  </label>
                  <Input type="range" min={1} max={600} value={assetCount}
                    onChange={(e) => setAssetCount(parseInt(e.target.value))}
                    className="w-full h-2 accent-gold" />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>1</span><span>100</span><span>300</span><span>500+</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-heading font-bold text-foreground mb-2 block">{t("pricing.calcPlan")}</label>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <span className="font-heading font-bold text-foreground">{t(`pricing.${activeTier.key}`)}</span>
                    <span className="text-xs text-muted-foreground ml-2">({activeTier.assets} {t("pricing.assets")})</span>
                  </div>
                </div>
              </div>

              {/* Center: Add-ons */}
              <div>
                <label className="text-xs font-heading font-bold text-foreground mb-3 block">{t("pricing.addonsTitle")}</label>
                <div className="space-y-3">
                  {addOns.filter(a => a.key !== "partner").map((a) => {
                    const p = a.price[country.code];
                    return (
                      <div key={a.key} className="flex items-center justify-between gap-3 bg-muted/30 rounded-lg p-3">
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-foreground">{t(`pricing.addon_${a.key}`)}</span>
                          <div className="text-[10px] text-muted-foreground">
                            {p.amount} {p.currency} {p.unit}
                          </div>
                        </div>
                        <Switch checked={!!selectedAddOns[a.key]} onCheckedChange={(v) => setSelectedAddOns(prev => ({ ...prev, [a.key]: v }))} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Summary */}
              <div className="bg-navy rounded-xl p-6 text-primary-foreground">
                <h4 className="font-heading font-bold text-sm mb-6 text-gold">{t("pricing.calcSummary")}</h4>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-foreground/60">{t(`pricing.${activeTier.key}`)} × {assetCount}</span>
                    <span className="font-bold">{baseMonthly !== null ? formatCurrency(baseMonthly) : t("pricing.calcContact")}</span>
                  </div>
                  {addOnsMonthly > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-foreground/60">Add-ons</span>
                      <span className="font-bold">{formatCurrency(addOnsMonthly)}</span>
                    </div>
                  )}
                  <div className="border-t border-primary-foreground/20 pt-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-heading font-bold">{t("pricing.calcTotal")}</span>
                      <span className="font-heading font-extrabold text-2xl text-gold">
                        {totalMonthly !== null ? formatCurrency(totalMonthly) : t("pricing.calcContact")}
                      </span>
                    </div>
                    <span className="text-[10px] text-primary-foreground/40">/mes + IVA</span>
                  </div>
                </div>
                <Button asChild className="w-full bg-gold-gradient text-navy font-heading font-bold">
                  <a href="#contacto">{t("pricing.cta")}</a>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Comparison Toggle ── */}
        <div className="text-center mb-8">
          <Button variant="outline" onClick={() => setShowComparison(!showComparison)} className="font-heading font-bold">
            {showComparison ? t("pricing.hideComparison") : t("pricing.showComparison")}
          </Button>
        </div>

        {/* ── Comparison Table ── */}
        {showComparison && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-heading font-bold text-foreground">{t("pricing.feature")}</th>
                  {tiers.map((tier) => (
                    <th key={tier.key} className={`text-center py-3 px-4 font-heading font-bold ${tier.popular ? "text-gold" : "text-foreground"}`}>
                      {t(`pricing.${tier.key}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((fk) => (
                  <tr key={fk} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2.5 px-4 text-muted-foreground text-xs">{t(`pricing.${fk}`)}</td>
                    {tiers.map((tier) => (
                      <td key={tier.key} className="text-center py-2.5 px-4">
                        {tier.features.includes(fk) ? (
                          <Check className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Limits rows */}
                {["usersIncluded", "eventsPerDay", "retentionDays", "apiCallsPerMonth"].map((lk) => (
                  <tr key={lk} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2.5 px-4 text-muted-foreground text-xs">{t(`pricing.limit_${lk === "usersIncluded" ? "users" : lk === "eventsPerDay" ? "events" : lk === "retentionDays" ? "retention" : "api"}`)}</td>
                    {tiers.map((tier) => {
                      const val = (tier.limits as Record<string, number>)[lk];
                      return (
                        <td key={tier.key} className="text-center py-2.5 px-4 text-xs font-bold text-foreground">
                          {val === -1 ? "∞" : lk === "apiCallsPerMonth" ? `${(val / 1000)}K` : val.toLocaleString()}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default PricingCalculator;
