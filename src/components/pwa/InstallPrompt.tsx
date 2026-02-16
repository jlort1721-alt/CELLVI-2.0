
import React, { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

const STORAGE_KEYS = {
    DISMISSED_AT: 'pwa_install_prompt_dismissed_at',
    DISMISS_COUNT: 'pwa_install_prompt_dismiss_count',
    IOS_DISMISSED: 'pwa_ios_install_dismissed_at',
};

const COOLDOWN_DAYS = 7; // Don't show again for N days after dismissal
const MAX_DISMISSALS = 3; // Stop showing after N dismissals

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);

    useEffect(() => {
        // Detect if already installed
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as any).standalone ||
                           document.referrer.includes('android-app://');

        if (isInstalled) {
            setIsStandalone(true);
            return;
        }

        // Check if user has dismissed too many times
        const dismissCount = parseInt(localStorage.getItem(STORAGE_KEYS.DISMISS_COUNT) || '0');
        if (dismissCount >= MAX_DISMISSALS) {
            console.log('[InstallPrompt] Max dismissals reached, not showing');
            return;
        }

        // Chrome / Android
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Check if within cooldown period
            const dismissedAt = localStorage.getItem(STORAGE_KEYS.DISMISSED_AT);
            if (dismissedAt) {
                const daysSinceDismiss = (Date.now() - new Date(dismissedAt).getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceDismiss < COOLDOWN_DAYS) {
                    console.log(`[InstallPrompt] Within cooldown (${daysSinceDismiss.toFixed(1)} days)`);
                    return;
                }
            }

            // Show prompt after short delay for better UX
            setTimeout(() => {
                setShowAndroidPrompt(true);
                // Track prompt shown
                trackEvent('pwa_install_prompt_shown', { platform: 'android' });
            }, 3000);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // iOS Detection
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS && !(window.navigator as any).standalone) {
            // Check iOS cooldown
            const iosDismissedAt = localStorage.getItem(STORAGE_KEYS.IOS_DISMISSED);
            if (iosDismissedAt) {
                const daysSinceDismiss = (Date.now() - new Date(iosDismissedAt).getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceDismiss < COOLDOWN_DAYS) {
                    console.log(`[InstallPrompt iOS] Within cooldown (${daysSinceDismiss.toFixed(1)} days)`);
                    return;
                }
            }

            // Show after delay
            setTimeout(() => {
                setShowIOSPrompt(true);
                trackEvent('pwa_install_prompt_shown', { platform: 'ios' });
            }, 5000);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        trackEvent('pwa_install_prompt_clicked', { platform: 'android' });

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        trackEvent('pwa_install_prompt_response', {
            platform: 'android',
            outcome
        });

        if (outcome === 'accepted') {
            // Clear dismissal tracking on successful install
            localStorage.removeItem(STORAGE_KEYS.DISMISSED_AT);
            localStorage.removeItem(STORAGE_KEYS.DISMISS_COUNT);
            setDeferredPrompt(null);
            setShowAndroidPrompt(false);
        } else {
            handleDismiss();
        }
    };

    const handleDismiss = () => {
        // Track dismissal
        trackEvent('pwa_install_prompt_dismissed', { platform: 'android' });

        // Update dismiss count and timestamp
        const currentCount = parseInt(localStorage.getItem(STORAGE_KEYS.DISMISS_COUNT) || '0');
        localStorage.setItem(STORAGE_KEYS.DISMISS_COUNT, String(currentCount + 1));
        localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, new Date().toISOString());

        setShowAndroidPrompt(false);
        setDeferredPrompt(null);
    };

    const handleIOSDismiss = () => {
        trackEvent('pwa_install_prompt_dismissed', { platform: 'ios' });
        localStorage.setItem(STORAGE_KEYS.IOS_DISMISSED, new Date().toISOString());
        setShowIOSPrompt(false);
    };

    // Analytics tracking helper
    const trackEvent = (eventName: string, params?: Record<string, any>) => {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', eventName, {
                event_category: 'pwa_install',
                ...params
            });
        }
        console.log(`[InstallPrompt] ${eventName}`, params);
    };

    if (isStandalone) return null; // Don't show if already app

    return (
        <>
            {/* Chrome / Android Floating Prompt */}
            {showAndroidPrompt && deferredPrompt && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[9999] animate-in slide-in-from-bottom-5 fade-in">
                    <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between border border-slate-700">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="bg-blue-600 p-2 rounded-lg flex-shrink-0">
                                <Download size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm">Instalar ASEGURAR</h3>
                                <p className="text-xs text-slate-400 truncate">Acceso rápido, trabaja offline</p>
                            </div>
                        </div>
                        <div className="flex gap-2 ml-2">
                            <button onClick={handleDismiss} className="p-2 text-slate-400 hover:text-white" aria-label="Cerrar">
                                <X size={20} />
                            </button>
                            <button
                                onClick={handleInstall}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap"
                            >
                                Instalar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* iOS Instructions */}
            {showIOSPrompt && (
                <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-slate-900/95 backdrop-blur text-white p-6 rounded-t-2xl shadow-2xl border-t border-slate-700 animate-in slide-in-from-bottom-10">
                    <button onClick={handleIOSDismiss} className="absolute top-4 right-4 text-slate-400 hover:text-white" aria-label="Cerrar">
                        <X size={24} />
                    </button>
                    <div className="text-center space-y-4">
                        <p className="font-bold text-lg">Instalar ASEGURAR en iPhone</p>
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
                            1. Toca el botón <Share size={18} className="text-blue-400" /> Compartir
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
                            2. Selecciona <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700 font-bold">+ Agregar a Inicio</span>
                        </div>
                    </div>
                    {/* Arrow pointing down to browser bar */}
                    <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-slate-900">
                        ▼
                    </div>
                </div>
            )}
        </>
    );
};

export default InstallPrompt;
