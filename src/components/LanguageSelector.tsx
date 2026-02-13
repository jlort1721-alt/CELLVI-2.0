import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("en") ? "en" : "es";

  const toggle = () => {
    i18n.changeLanguage(currentLang === "es" ? "en" : "es");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="text-primary-foreground/70 hover:text-gold gap-1.5 px-2"
      aria-label={currentLang === "es" ? "Switch to English" : "Cambiar a Español"}
    >
      <Globe className="w-4 h-4" />
      <span className="text-xs font-heading font-bold uppercase">{currentLang === "es" ? "EN" : "ES"}</span>
    </Button>
  );
};

export default LanguageSelector;
