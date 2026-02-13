import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelector from "@/components/LanguageSelector";
import logoAsegurar from "@/assets/logo-asegurar.jpeg";
import { useTheme } from "@/components/ThemeProvider";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { resolved } = useTheme();

  const navItems = [
    { label: t("nav.inicio"), href: "#inicio" },
    { label: t("nav.nosotros"), href: "#nosotros" },
    { label: t("nav.servicios"), href: "#servicios" },
    { label: t("nav.plataforma"), href: "#plataforma" },
    { label: t("nav.planes"), href: "#planes" },
    // The instruction implies adding items with 'name', 'path', 'icon' properties,
    // which are incompatible with the existing 'label' and 'href' structure.
    // To maintain functionality and avoid breaking the current rendering,
    // these items are added using the existing 'label' and 'href' structure.
    // If the intent was to change the structure, further modifications to the
    // rendering logic (e.g., in the .map() calls) would be required.
    { label: t("nav.dashboard"), href: "/dashboard" },
    { label: t("nav.tracking"), href: "/tracking" },
    { label: t("nav.planning"), href: "/planning" },
    { label: t("nav.politicas"), href: "#politicas" },
    { label: t("nav.pqr"), href: "/pqr" },
    { label: t("nav.blog"), href: "#blog" },
    { label: t("nav.contacto"), href: "#contacto" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-md border-b border-gold/20" role="navigation" aria-label="Navegación principal">
      <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
        <a href="#inicio" className="flex items-center gap-2" aria-label="ASEGURAR LTDA - Inicio">
          <img
            src="/logo.png"
            alt="ASEGURAR LTDA - Ubicación y Rastreo Satelital"
            className="h-12 md:h-16 w-auto object-contain"
          />
        </a>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:text-gold transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-navy">
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <Button asChild variant="outline" className="border-gold/40 text-gold hover:bg-gold/10 font-heading font-semibold text-sm">
            <a href="/demo">{t("nav.demoCellvi")}</a>
          </Button>
          <Button asChild className="bg-gold-gradient font-heading font-bold text-navy hover:opacity-90 shadow-gold animate-pulse-gold">
            <a href="#contacto">{t("nav.rastreaTuActivo")}</a>
          </Button>
        </div>

        {/* Mobile toggle */}
        <div className="lg:hidden flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <button className="text-primary-foreground" onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={isOpen}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="lg:hidden bg-navy border-t border-gold/20 overflow-hidden">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setIsOpen(false)} className="px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:text-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold">
                  {item.label}
                </a>
              ))}
              <div className="flex gap-2 mt-2">
                <Button asChild variant="outline" className="border-gold/40 text-gold hover:bg-gold/10 font-heading font-semibold text-sm flex-1">
                  <a href="/demo">{t("nav.demoCellvi")}</a>
                </Button>
                <Button asChild className="bg-gold-gradient font-heading font-bold text-navy hover:opacity-90 flex-1">
                  <a href="#contacto">{t("nav.rastreaTuActivo")}</a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
