import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Thermometer, Truck, Shield, Building2, CheckCircle, Target, AlertTriangle } from "lucide-react";
import { useCases } from "@/lib/demoData";

const iconMap = {
  thermometer: Thermometer,
  truck: Truck,
  shield: Shield,
  building: Building2,
};

const UseCasesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden" ref={ref}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-[30%] left-[10%] w-72 h-72 bg-blue-500 rounded-full blur-[100px]" />
        <div className="absolute bottom-[30%] right-[10%] w-72 h-72 bg-gold rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">
            Casos de Uso Reales
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">
            Soluciones para Cada Industria
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg">
            Resultados comprobados en diferentes sectores del transporte colombiano
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {useCases.map((useCase, i) => {
            const Icon = iconMap[useCase.icon as keyof typeof iconMap];

            return (
              <motion.div
                key={useCase.id}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="group rounded-xl border border-border overflow-hidden transition-all hover:shadow-xl bg-card hover:border-gold/50"
              >
                <div className="relative p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                        {Icon && <Icon className="w-7 h-7 text-gold" />}
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-xl text-foreground mb-1">
                          {useCase.title}
                        </h3>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 font-medium">
                          {useCase.industry}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Problem */}
                  <div className="mb-4 p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-red-600 mb-1">Problema</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {useCase.problem}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Solution */}
                  <div className="mb-6 p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                    <div className="flex items-start gap-3">
                      <Target className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-green-600 mb-1">Solución CELLVI</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {useCase.solution}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Results */}
                  <div>
                    <p className="text-xs font-bold text-foreground mb-3">Resultados Medibles</p>
                    <ul className="space-y-2.5">
                      {useCase.results.map((result, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground leading-relaxed">
                            {result}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
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
