import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import oficinaImg from "@/assets/oficina.jpg";
import vehiculoImg from "@/assets/vehiculo.jpg";
import heroBg from "@/assets/hero-bg.jpg";
import platformImg from "@/assets/platform-preview.jpg";

const GallerySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { t } = useTranslation();

  const images = [
    { src: oficinaImg, alt: t("gallery.img1"), caption: t("gallery.img1") },
    { src: vehiculoImg, alt: t("gallery.img2"), caption: t("gallery.img2") },
    { src: heroBg, alt: t("gallery.img3"), caption: t("gallery.img3") },
    { src: platformImg, alt: t("gallery.img4"), caption: t("gallery.img4") },
  ];

  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(() => setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null)), [images.length]);
  const next = useCallback(() => setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null)), [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, close, prev, next]);

  return (
    <>
      <section className="py-20 md:py-28 bg-background" ref={ref}>
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-12">
            <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">{t("gallery.badge")}</span>
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">{t("gallery.title")}</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {images.map((img, i) => (
              <motion.button key={i} initial={{ opacity: 0, scale: 0.9 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.4, delay: 0.1 * i }} onClick={() => setLightboxIndex(i)} className="group relative rounded-xl overflow-hidden aspect-square cursor-pointer border border-border hover:border-gold/50 transition-all focus:outline-none focus:ring-2 focus:ring-gold" aria-label={`${t("gallery.badge")} ${img.caption}`}>
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/50 transition-colors flex items-end">
                  <span className="text-primary-foreground text-xs font-heading font-bold p-3 opacity-0 group-hover:opacity-100 transition-opacity">{img.caption}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={close} role="dialog" aria-modal="true" aria-label={t("gallery.viewerLabel")}>
            <button onClick={close} className="absolute top-4 right-4 text-white/80 hover:text-white z-10" aria-label={t("gallery.close")}><X className="w-8 h-8" /></button>
            <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 text-white/80 hover:text-white z-10" aria-label={t("gallery.prev")}><ChevronLeft className="w-10 h-10" /></button>
            <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 text-white/80 hover:text-white z-10" aria-label={t("gallery.next")}><ChevronRight className="w-10 h-10" /></button>
            <motion.img key={lightboxIndex} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} src={images[lightboxIndex].src} alt={images[lightboxIndex].alt} className="max-w-full max-h-[85vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
            <div className="absolute bottom-6 text-center text-white text-sm font-heading">{images[lightboxIndex].caption} — {lightboxIndex + 1} / {images.length}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GallerySection;
