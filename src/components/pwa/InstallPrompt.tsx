
import React, { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Detect if already installed properly
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsStandalone(true);
        }

        // Chrome / Android
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // iOS Detection
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS && !(window.navigator as any).standalone) {
            // Show prompt after 5 seconds
            setTimeout(() => setShowIOSPrompt(true), 5000);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (isStandalone) return null; // Don't show if already app

    return (
        <>
            {/* Chrome / Android Floating Button */}
            {deferredPrompt && (
                <div className="fixed bottom-4 left-4 right-4 z-[9999] animate-in slide-in-from-bottom-5">
                    <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between border border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <Download size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Instalar App</h3>
                                <p className="text-xs text-slate-400">Acceso rápido y offline.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setDeferredPrompt(null)} className="p-2 text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                            <button
                                onClick={handleInstall}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
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
                    <button onClick={() => setShowIOSPrompt(false)} className="absolute top-4 right-4 text-slate-400">
                        <X size={24} />
                    </button>
                    <div className="text-center space-y-4">
                        <p className="font-bold text-lg">Instalar CELLVI en iPhone</p>
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
