
import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const WhatsAppButton = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  // Show on all pages, but maybe with a delay
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Customize message based on current page
  const getMessage = () => {
    if (location.pathname.includes("demo")) return "Hola, estoy viendo el Demo de CELLVI y tengo una pregunta.";
    if (location.pathname.includes("platform")) return "Hola, necesito soporte técnico en la plataforma.";
    return "Hola, quiero información sobre los servicios de ASEGURAR LTDA.";
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.a
          href={`https://api.whatsapp.com/send?phone=573187500962&text=${encodeURIComponent(getMessage())}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.5)] hover:scale-110 transition-transform cursor-pointer border-2 border-white/20"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          whileHover={{ rotate: 10 }}
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle className="w-8 h-8 text-white stroke-[2.5px]" />

          {/* Pulse effect */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
        </motion.a>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppButton;
