import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Truck,
  Thermometer,
  HardHat,
  PackageCheck,
  Fuel,
  ShieldCheck,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLandingStore } from "@/stores/landingStore";

type UseCaseTab = "all" | "transport" | "industry" | "security";

interface UseCaseDefinition {
  id: string;
  key: string;
  icon: React.ElementType;
  tab: UseCaseTab;
}

const useCaseDefinitions: UseCaseDefinition[] = [
  { id: "uc1", key: "uc1", icon: Truck, tab: "transport" },
  { id: "uc2", key: "uc2", icon: Thermometer, tab: "industry" },
  { id: "uc3", key: "uc3", icon: HardHat, tab: "industry" },
  { id: "uc4", key: "uc4", icon: PackageCheck, tab: "transport" },
  { id: "uc5", key: "uc5", icon: Fuel, tab: "transport" },
  { id: "uc6", key: "uc6", icon: ShieldCheck, tab: "security" },
];

const tabLabels: Record<UseCaseTab, { en: string; es: string }> = {
  all: { en: "All", es: "Todos" },
  transport: { en: "Transport", es: "Transporte" },
  industry: { en: "Industry", es: "Industria" },
  security: { en: "Security", es: "Seguridad" },
};

const UseCasesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t, i18n } = useTranslation();
  const activeUseCaseTab = useLandingStore((s) => s.activeUseCaseTab);
  const setActiveUseCaseTab = useLandingStore((s) => s.setActiveUseCaseTab);

  const currentTab = activeUseCaseTab as UseCaseTab;
  const lang = i18n.language?.startsWith("en") ? "en" : "es";

  const filteredUseCases =
    currentTab === "all"
      ? useCaseDefinitions
      : useCaseDefinitions.filter((uc) => uc.tab === currentTab);

  return (
    <section
      className="py-20 md:py-28 bg-background relative overflow-hidden"
      ref={ref}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-[30%] left-[10%] w-72 h-72 bg-blue-500 rounded-full blur-[100px]" />
        <div className="absolute bottom-[30%] right-[10%] w-72 h-72 bg-gold rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
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

        {/* Tab filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-10"
        >
          <Tabs
            value={currentTab}
            onValueChange={(value) => setActiveUseCaseTab(value)}
          >
            <TabsList className="bg-muted/60 backdrop-blur-sm">
              {(Object.keys(tabLabels) as UseCaseTab[]).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold"
                >
                  {tabLabels[tab][lang]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredUseCases.map((useCase, i) => {
            const Icon = useCase.icon;

            return (
              <motion.div
                key={useCase.id}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="group bg-card rounded-xl border border-border overflow-hidden transition-all hover:border-gold/50 hover:shadow-xl"
              >
                <div className="relative p-8">
                  {/* Header: Icon + Title + Stat badge */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-14 h-14 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors flex-shrink-0">
                      <Icon className="w-7 h-7 text-gold" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-bold text-xl text-foreground mb-1.5">
                        {t(`useCases.${useCase.key}Title`)}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-gold/10 text-gold font-medium">
                        <TrendingUp className="w-3 h-3" />
                        {t(`useCases.${useCase.key}Stat`)}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {t(`useCases.${useCase.key}Desc`)}
                  </p>

                  {/* Bullet points */}
                  <ul className="space-y-2.5">
                    {[1, 2, 3].map((bulletNum) => (
                      <li key={bulletNum} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground leading-relaxed">
                          {t(`useCases.${useCase.key}Bullet${bulletNum}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
