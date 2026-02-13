
import React from 'react';
import LiveMap from '../components/LiveMap';
import { LayoutDashboard, Truck, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TrackingDashboard = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            {/* Header Flotante */}
            <div className="absolute top-4 left-4 right-4 z-[9999] pointer-events-none flex justify-between">
                <div className="pointer-events-auto bg-white/90 backdrop-blur rounded-xl shadow-lg border border-slate-200 p-4 max-w-sm">
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="text-blue-600" />
                        {t('tracking.title')}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {t('tracking.subtitle')}
                    </p>

                    <div className="mt-4 flex gap-2">
                        <div className="flex-1 bg-slate-100 rounded p-2 text-center">
                            <span className="block text-xs text-slate-500 font-medium">{t('tracking.status_active')}</span>
                            <span className="text-lg font-bold text-green-600">12</span>
                        </div>
                        <div className="flex-1 bg-slate-100 rounded p-2 text-center">
                            <span className="block text-xs text-slate-500 font-medium">{t('tracking.status_stopped')}</span>
                            <span className="text-lg font-bold text-orange-500">4</span>
                        </div>
                        <div className="flex-1 bg-slate-100 rounded p-2 text-center">
                            <span className="block text-xs text-slate-500 font-medium">{t('tracking.status_offline')}</span>
                            <span className="text-lg font-bold text-slate-400">2</span>
                        </div>
                    </div>
                </div>

                <div className="pointer-events-auto flex flex-col gap-2">
                    <button className="bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors" title={t('tracking.view_satellite') || 'Vista Satelital'}>
                        <LayoutDashboard size={20} className="text-slate-600" />
                    </button>
                    <button className="bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors" title={t('tracking.view_history') || 'Historial'}>
                        <History size={20} className="text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Mapa Geoespacial */}
            <div className="flex-1 min-h-[500px] w-full relative z-0">
                <LiveMap />
            </div>

            {/* Footer de Estado de Sistema */}
            <div className="bg-slate-900 text-slate-400 text-xs py-2 px-4 flex justify-between items-center z-[1000] relative">
                <span>{t('tracking.gps_gateway', { status: t('common.online') })}</span>
                <span>{t('tracking.last_update', { time: new Date().toLocaleTimeString() })}</span>
            </div>
        </div>
    );
};

export default TrackingDashboard;
