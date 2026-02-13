
import React, { useState, useEffect } from 'react';
import { Truck, MapPin, CheckCircle, Search, WifiOff } from 'lucide-react';

interface Stop {
    id: string;
    client: string;
    address: string;
    status: 'pending' | 'completed';
    time_window: string;
}

const MOCK_ROUTE: Stop[] = [
    { id: '1', client: 'Exito Calle 80', address: 'Transversal 54 # 80-20', status: 'completed', time_window: '08:00 - 09:00' },
    { id: '2', client: 'Jumbo Santa Ana', address: 'Cra. 9 # 110-50', status: 'pending', time_window: '10:00 - 11:30' },
    { id: '3', client: 'Carulla Pepe Sierra', address: 'Calle 116 # 15-20', status: 'pending', time_window: '12:00 - 13:00' },
];

const DriverRoute = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [stops, setStops] = useState<Stop[]>(MOCK_ROUTE);

    // Offline Detection
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Load from LocalStorage (Offline Persistence)
    useEffect(() => {
        const saved = localStorage.getItem('driver_route');
        if (saved) setStops(JSON.parse(saved));
    }, []);

    const handleCheckIn = (id: string) => {
        const newStops = stops.map(s => s.id === id ? { ...s, status: 'completed' as const } : s);
        setStops(newStops);
        localStorage.setItem('driver_route', JSON.stringify(newStops));

        // Background Sync Simulation
        if (!isOnline) {
            console.log("Check-in guardado offline. Se sincronizará al conectar.");
            // En real: Add to IndexedDB Sync Queue
        } else {
            console.log("Check-in enviado al servidor.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Mobile */}
            <div className="bg-slate-900 p-4 text-white sticky top-0 z-10 shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            <Truck className="text-blue-400" /> Mi Ruta
                        </h1>
                        <p className="text-xs text-slate-400">Placa: WXK-902</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold bg-slate-800 px-2 py-1 rounded">
                            {stops.filter(s => s.status === 'completed').length}/{stops.length} Ok
                        </span>
                    </div>
                </div>

                {!isOnline && (
                    <div className="mt-2 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center justify-center gap-1 animate-pulse">
                        <WifiOff size={12} /> MODO OFFLINE ACTIVADO
                    </div>
                )}
            </div>

            {/* Timeline */}
            <div className="p-4 space-y-4">
                {stops.map((stop, index) => (
                    <div key={stop.id} className={`relative p-4 rounded-xl border-l-4 shadow-sm ${stop.status === 'completed'
                            ? 'bg-slate-100 border-green-500 opacity-60'
                            : 'bg-white border-blue-500'
                        }`}>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-slate-800">{stop.client}</h3>
                            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                                {stop.time_window}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                            <MapPin size={16} />
                            {stop.address}
                        </div>

                        {stop.status === 'pending' ? (
                            <button
                                onClick={() => handleCheckIn(stop.id)}
                                className="w-full py-3 bg-blue-600 active:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} /> CONFIRMAR LLEGADA
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                                <CheckCircle size={16} /> Completado
                            </div>
                        )}

                        {/* Connector Line */}
                        {index < stops.length - 1 && (
                            <div className="absolute left-[-22px] top-[50px] bottom-[-30px] w-0.5 bg-slate-200" />
                        )}
                    </div>
                ))}
            </div>

            {/* Floating Action Button (FAB) for Navigation */}
            <button className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white z-20 active:scale-90 transition-transform">
                <Search size={24} />
            </button>
        </div>
    );
};

export default DriverRoute;
