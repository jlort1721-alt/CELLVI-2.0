import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Truck, Thermometer, HardHat, Package, Fuel, Building2, CheckCircle, TrendingUp } from "lucide-react";

const cases = [
  { icon: Truck, key: "uc1", color: "text-blue-500" },
  { icon: Thermometer, key: "uc2", color: "text-cyan-500" },
  { icon: HardHat, key: "uc3", color: "text-amber-500" },
  { icon: Package, key: "uc4", color: "text-emerald-500" },
  { icon: Fuel, key: "uc5", color: "text-orange-500" },
  { icon: Building2, key: "uc6", color: "text-violet-500" },
];

const UseCasesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  return (
    <section className="py-20 md:py-28 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">
            {t("useCases.badge")}
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">
            {t("useCases.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg">
            {t("useCases.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((uc, i) => (
            <motion.div
              key={uc.key}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i }}
              className={`group rounded-xl border border-border overflow-hidden transition-all hover:shadow-lg relative ${["uc1", "uc3", "uc5", "uc6"].includes(uc.key) ? "md:col-span-2 lg:col-span-1 bg-navy text-white border-none" : "bg-card hover:border-gold/50"
                }`}
            >
              {uc.key === "uc1" && (
                <div className="absolute inset-0 z-0">
                  <img src="/road-safety.jpg" alt="Transporte" className="w-full h-full object-cover opacity-40 group-hover:opacity-30 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/40" />
                </div>
              )}
              {uc.key === "uc3" && (
                <div className="absolute inset-0 z-0">
                  <img src="/remote-mining.jpg" alt="Minería" className="w-full h-full object-cover opacity-40 group-hover:opacity-30 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/40" />
                </div>
              )}
              {uc.key === "uc5" && (
                <div className="absolute inset-0 z-0">
                  <img src="/fleet-maintenance.jpg" alt="Mantenimiento" className="w-full h-full object-cover opacity-40 group-hover:opacity-30 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/40" />
                </div>
              )}
              {uc.key === "uc6" && (
                <div className="absolute inset-0 z-0">
                  <img src="/compliance-office.jpg" alt="Gobierno" className="w-full h-full object-cover opacity-40 group-hover:opacity-30 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/40" />
                </div>
              )}

              <div className="relative z-10 p-7 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${["uc1", "uc3", "uc5", "uc6"].includes(uc.key) ? "bg-white/10 group-hover:bg-gold/20" : "bg-primary/10 group-hover:bg-gold/15"
                    }`}>
                    <uc.icon className={`w-6 h-6 transition-colors ${["uc1", "uc3", "uc5", "uc6"].includes(uc.key) ? "text-gold" : `${uc.color} group-hover:text-gold`
                      }`} />
                  </div>
                  <div className={`flex items-center gap-1.5 border rounded-full px-3 py-1 ${["uc1", "uc3", "uc5", "uc6"].includes(uc.key) ? "bg-gold/20 border-gold/30" : "bg-gold/10 border-gold/20"
                    }`}>
                    <TrendingUp className="w-3.5 h-3.5 text-gold" />
                    <span className="text-xs font-bold text-gold">{t(`useCases.${uc.key}Stat`)}</span>
                  </div>
                </div>

                <h3 className={`font-heading font-bold text-lg mb-2 ${["uc1", "uc3", "uc5", "uc6"].includes(uc.key) ? "text-white" : "text-foreground"
                  }`}>
                  {t(`useCases.${uc.key}Title`)}
                </h3>
                <p className={`text-sm leading-relaxed mb-4 flex-grow ${["uc1", "uc3", "uc5", "uc6"].includes(uc.key) ? "text-gray-300" : "text-muted-foreground"
                  }`}>
                  {t(`useCases.${uc.key}Desc`)}
                </p>

                <ul className="space-y-2 mt-auto">
                  {[1, 2, 3].map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                      <span className={`text-xs leading-relaxed ${["uc1", "uc3", "uc5", "uc6"].includes(uc.key) ? "text-gray-400" : "text-muted-foreground"
                        }`}>
                        {t(`useCases.${uc.key}Bullet${b}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
