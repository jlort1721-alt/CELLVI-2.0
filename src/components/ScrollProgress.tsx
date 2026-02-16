import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useLandingStore } from "@/stores/landingStore";

const ScrollProgress = () => {
  const scrollProgress = useLandingStore((s) => s.scrollProgress);
  const setScrollProgress = useLandingStore((s) => s.setScrollProgress);
  const showBackToTop = useLandingStore((s) => s.showBackToTop);
  const setShowBackToTop = useLandingStore((s) => s.setShowBackToTop);
  const setHasScrolledPastHero = useLandingStore((s) => s.setHasScrolledPastHero);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      setScrollProgress(progress);
      setShowBackToTop(progress > 15);
      setHasScrolledPastHero(scrollTop > window.innerHeight * 0.6);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setScrollProgress, setShowBackToTop, setHasScrolledPastHero]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[2px]">
        <div
          className="h-full bg-gradient-to-r from-gold via-yellow-400 to-gold transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-gold/90 hover:bg-gold text-navy flex items-center justify-center shadow-lg shadow-gold/20 transition-colors"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScrollProgress;
