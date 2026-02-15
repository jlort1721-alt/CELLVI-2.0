import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote, MapPin, Building2 } from "lucide-react";
import { testimonials } from "@/lib/demoData";

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 md:py-28 bg-section-gradient relative overflow-hidden" ref={ref}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-[30%] left-[10%] w-72 h-72 bg-gold rounded-full blur-[100px]" />
        <div className="absolute bottom-[30%] right-[10%] w-72 h-72 bg-blue-500 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">
            Historias de Éxito
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg">
            Empresas reales que transformaron sus operaciones con CELLVI
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="bg-card rounded-xl p-6 border border-border hover:border-gold/50 transition-all shadow-sm hover:shadow-lg relative group"
            >
              <Quote className="w-10 h-10 text-gold/10 absolute top-4 right-4 group-hover:text-gold/20 transition-colors" />

              {/* Rating */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: Math.floor(item.rating) }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-gold fill-gold" />
                ))}
                {item.rating % 1 !== 0 && (
                  <Star className="w-4 h-4 text-gold fill-gold opacity-50" />
                )}
              </div>

              {/* Testimonial Text */}
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 italic line-clamp-6">
                "{item.text}"
              </p>

              {/* Author Info */}
              <div className="pt-4 border-t border-border/50">
                <p className="font-heading font-bold text-foreground text-sm mb-1">
                  {item.person}
                </p>
                <p className="text-xs text-gold font-medium mb-2">
                  {item.position}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Building2 className="w-3 h-3" />
                  <span className="font-medium">{item.company}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <MapPin className="w-3 h-3" />
                  <span>{item.location}</span>
                </div>
                <div className="mt-2 inline-block">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-gold/10 text-gold font-medium">
                    {item.industry}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-card rounded-full px-6 py-3 border border-gold/20">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-yellow-600 border-2 border-card flex items-center justify-center text-xs font-bold text-white"
                >
                  {i === 1 && "TA"}
                  {i === 2 && "LS"}
                  {i === 3 && "CT"}
                  {i === 4 && "VP"}
                  {i === 5 && "+"}
                </div>
              ))}
            </div>
            <div className="text-sm">
              <span className="font-bold text-foreground">500+ empresas</span>
              <span className="text-muted-foreground"> confían en CELLVI</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
