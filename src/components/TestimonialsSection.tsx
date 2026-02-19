import { motion, useInView } from "framer-motion";
import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useLandingStore } from "@/stores/landingStore";
import { Button } from "@/components/ui/button";

const testimonialKeys = ["t1", "t2", "t3"];

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();
  const testimonialIndex = useLandingStore((s) => s.testimonialIndex);
  const setTestimonialIndex = useLandingStore((s) => s.setTestimonialIndex);
  const autoplay = useLandingStore((s) => s.testimonialAutoplay);
  const setAutoplay = useLandingStore((s) => s.setTestimonialAutoplay);

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setTestimonialIndex((testimonialIndex + 1) % testimonialKeys.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoplay, testimonialIndex, setTestimonialIndex]);

  const prev = () => {
    setAutoplay(false);
    setTestimonialIndex((testimonialIndex - 1 + testimonialKeys.length) % testimonialKeys.length);
  };

  const next = () => {
    setAutoplay(false);
    setTestimonialIndex((testimonialIndex + 1) % testimonialKeys.length);
  };

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
            {t("testimonials.badge")}
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">
            {t("testimonials.title")}
          </h2>
        </motion.div>

        {/* Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {testimonialKeys.map((key, i) => (
              <motion.div
                key={key}
                initial={false}
                animate={{
                  opacity: i === testimonialIndex ? 1 : 0,
                  scale: i === testimonialIndex ? 1 : 0.95,
                }}
                transition={{ duration: 0.5 }}
                className={`${i !== testimonialIndex ? "pointer-events-none absolute inset-0" : "relative"}`}
              >
                <div className="bg-card rounded-2xl p-8 md:p-12 border border-border shadow-lg relative">
                  <Quote className="w-12 h-12 text-gold/10 absolute top-6 right-6" />

                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-5 h-5 text-gold fill-gold" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-lg md:text-xl text-foreground leading-relaxed mb-8 italic">
                    &ldquo;{t(`testimonials.${key}Text`)}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center text-white font-bold text-lg">
                      {t(`testimonials.${key}Name`).charAt(0)}
                    </div>
                    <div>
                      <p className="font-heading font-bold text-foreground">
                        {t(`testimonials.${key}Name`)}
                      </p>
                      <p className="text-sm text-gold font-medium">
                        {t(`testimonials.${key}Role`)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`testimonials.${key}Company`)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button variant="outline" size="icon" onClick={prev} aria-label="Anterior" className="rounded-full border-border hover:border-gold/50">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-2">
              {testimonialKeys.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Testimonial ${i + 1}`}
                  onClick={() => { setAutoplay(false); setTestimonialIndex(i); }}
                  className={`h-2.5 rounded-full transition-all ${
                    i === testimonialIndex ? "bg-gold w-8" : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2.5"
                  }`}
                />
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={next} aria-label="Siguiente" className="rounded-full border-border hover:border-gold/50">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
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
              {["CE", "ML", "AG", "RB", "+"].map((initials, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-yellow-600 border-2 border-card flex items-center justify-center text-xs font-bold text-white"
                >
                  {initials}
                </div>
              ))}
            </div>
            <div className="text-sm">
              <span className="font-bold text-foreground">500+</span>
              <span className="text-muted-foreground"> {t("testimonials.badge").toLowerCase()}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
