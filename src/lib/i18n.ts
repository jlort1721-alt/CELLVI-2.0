
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar recursos directamente (bundling) para evitar requests de red
// En fase Enterprise, usar 'i18next-http-backend' para lazy load.
import translationES from '@/locales/es.json';
import translationEN from '@/locales/en.json';

// Recursos
const resources = {
  es: {
    translation: translationES
  },
  en: {
    translation: translationEN
  }
};

i18n
  // Detectar idioma del usuario (navegador)
  .use(LanguageDetector)
  // Integración React
  .use(initReactI18next)
  // Inicialización
  .init({
    resources,
    fallbackLng: 'es', // Default a español si falla detección
    debug: false, // Quitar debug en producción
    interpolation: {
      escapeValue: false, // React escapa por defecto (XSS safe)
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'], // Guardar preferencia en LS
    }
  });

export default i18n;
