import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Cookie, X, Shield, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COOKIE_CONSENT_KEY = "cellvi_cookie_consent";

interface CookiePreferences {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
}

const CookieBanner = () => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [preferences, setPreferences] = useState<CookiePreferences>({
        necessary: true,
        analytics: false,
        marketing: false,
    });

    useEffect(() => {
        const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!stored) {
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const saveConsent = (prefs: CookiePreferences) => {
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ ...prefs, timestamp: new Date().toISOString() }));
        setVisible(false);
    };

    const acceptAll = () => saveConsent({ necessary: true, analytics: true, marketing: true });
    const acceptSelected = () => saveConsent(preferences);
    const rejectOptional = () => saveConsent({ necessary: true, analytics: false, marketing: false });

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 z-[9999] p-4"
                >
                    <div className="max-w-4xl mx-auto rounded-2xl border bg-navy/95 backdrop-blur-xl border-gold/20 shadow-2xl shadow-navy/50 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-start justify-between p-5 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gold/10 border border-gold/20">
                                    <Cookie className="w-5 h-5 text-gold" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm font-heading">
                                        {t("cookies.title", "Política de Cookies")}
                                    </h3>
                                    <p className="text-white/50 text-xs mt-0.5">
                                        {t("cookies.subtitle", "Ley 1581 de 2012 & Decreto 1377 de 2013")}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={rejectOptional}
                                className="text-white/30 hover:text-white/60 transition-colors p-1"
                                aria-label="Cerrar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Description */}
                        <div className="px-5 pb-3">
                            <p className="text-white/60 text-xs leading-relaxed">
                                {t(
                                    "cookies.description",
                                    "Utilizamos cookies propias y de terceros para mejorar su experiencia, analizar el tráfico y personalizar contenido. Conforme a la Ley 1581 de 2012 de protección de datos personales, usted puede aceptar, configurar o rechazar las cookies opcionales."
                                )}
                            </p>
                        </div>

                        {/* Details panel */}
                        <AnimatePresence>
                            {showDetails && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-5 pb-4 space-y-3">
                                        {/* Necessary */}
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                            <div className="flex items-center gap-2.5">
                                                <Shield className="w-4 h-4 text-green-400" />
                                                <div>
                                                    <span className="text-white text-xs font-medium">
                                                        {t("cookies.necessary", "Necesarias")}
                                                    </span>
                                                    <p className="text-white/40 text-[10px]">
                                                        {t("cookies.necessaryDesc", "Esenciales para el funcionamiento del sitio. No se pueden desactivar.")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-500/20 text-green-400 uppercase tracking-wider">
                                                {t("cookies.always", "Siempre")}
                                            </div>
                                        </div>

                                        {/* Analytics */}
                                        <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/8 transition-colors">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-4 h-4 rounded-full bg-blue-500/30 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                                                </div>
                                                <div>
                                                    <span className="text-white text-xs font-medium">
                                                        {t("cookies.analytics", "Analíticas")}
                                                    </span>
                                                    <p className="text-white/40 text-[10px]">
                                                        {t("cookies.analyticsDesc", "Nos ayudan a entender cómo interactúa con la plataforma.")}
                                                    </p>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={preferences.analytics}
                                                onChange={(e) => setPreferences((p) => ({ ...p, analytics: e.target.checked }))}
                                                className="w-4 h-4 rounded accent-gold"
                                            />
                                        </label>

                                        {/* Marketing */}
                                        <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/8 transition-colors">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-4 h-4 rounded-full bg-purple-500/30 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                                                </div>
                                                <div>
                                                    <span className="text-white text-xs font-medium">
                                                        {t("cookies.marketing", "Marketing")}
                                                    </span>
                                                    <p className="text-white/40 text-[10px]">
                                                        {t("cookies.marketingDesc", "Permiten mostrar publicidad relevante y medir campañas.")}
                                                    </p>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={preferences.marketing}
                                                onChange={(e) => setPreferences((p) => ({ ...p, marketing: e.target.checked }))}
                                                className="w-4 h-4 rounded accent-gold"
                                            />
                                        </label>

                                        <p className="text-white/30 text-[10px]">
                                            {t("cookies.moreInfo", "Para más información, consulte nuestra")}{" "}
                                            <a href="/privacidad" className="text-gold hover:underline">
                                                {t("cookies.privacyLink", "Política de Privacidad")}
                                            </a>
                                            .
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="flex items-center gap-2 p-5 pt-3 border-t border-white/5">
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                            >
                                <Settings2 className="w-3.5 h-3.5" />
                                {showDetails
                                    ? t("cookies.hideSettings", "Ocultar")
                                    : t("cookies.showSettings", "Configurar")}
                            </button>
                            <div className="flex-1" />
                            <button
                                onClick={rejectOptional}
                                className="px-4 py-2 rounded-lg text-xs font-medium text-white/50 hover:text-white transition-colors"
                            >
                                {t("cookies.rejectOptional", "Solo necesarias")}
                            </button>
                            {showDetails && (
                                <button
                                    onClick={acceptSelected}
                                    className="px-4 py-2 rounded-lg text-xs font-medium bg-white/10 text-white hover:bg-white/15 transition-colors border border-white/10"
                                >
                                    {t("cookies.acceptSelected", "Guardar selección")}
                                </button>
                            )}
                            <button
                                onClick={acceptAll}
                                className="px-5 py-2 rounded-lg text-xs font-bold bg-gold text-navy hover:bg-gold/90 transition-colors shadow-lg shadow-gold/20"
                            >
                                {t("cookies.acceptAll", "Aceptar todas")}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieBanner;
