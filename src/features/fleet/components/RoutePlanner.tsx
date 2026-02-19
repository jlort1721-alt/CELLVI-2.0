
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { createClient } from '@supabase/supabase-js';
import { Play, RotateCcw, Save, MapPin, Truck } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Config Supabase
// Config Supabase
import { supabase } from '@/integrations/supabase/client';
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// const supabase = createClient(supabaseUrl, supabaseKey);

// Tipos
interface Stop {
    id: string;
    lat: number;
    lng: number;
    label: string;
}

interface OptimizedResult {
    route: Stop[];
    total_distance_km: number;
    computation_ms: number;
}

// Iconos
const depotIcon = L.divIcon({
    html: `<div style="background:#2563eb; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3)">D</div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const stopIcon = (index: number) => L.divIcon({
    html: `<div style="background:#f97316; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3)">${index}</div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

// Componente para capturar clics en el mapa
const MapClickHandler = ({ onAddStop }: { onAddStop: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onAddStop(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const RoutePlanner = () => {
    const [stops, setStops] = useState<Stop[]>([]);
    const [optimizedRoute, setOptimizedRoute] = useState<Stop[] | null>(null);
    const [metrics, setMetrics] = useState<{ dist: number, time: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAddStop = (lat: number, lng: number) => {
        const id = Math.random().toString(36).substr(2, 9);
        const label = stops.length === 0 ? 'Depósito' : `Parada ${stops.length}`;
        setStops([...stops, { id, lat, lng, label }]);
        setOptimizedRoute(null); // Reset optimization on change
        setMetrics(null);
    };

    const handleReset = () => {
        setStops([]);
        setOptimizedRoute(null);
        setMetrics(null);
    };

    const handleOptimize = async () => {
        if (stops.length < 3) {
            alert("Agrega al menos 1 depósito y 2 paradas para optimizar.");
            return;
        }

        setIsLoading(true);
        try {
            const depot = stops[0];
            const dropoffs = stops.slice(1);

            // Llamada a Edge Function
            const { data, error } = await supabase.functions.invoke('optimize-route', {
                body: { depot, stops: dropoffs }
            });

            if (error) throw error;

            // Mapear respuesta a objetos Stop
            // La IA devuelve coordenadas, necesitamos re-asociar las etiquetas si es posible
            // O simplemente usar la geometría devuelta
            // Nota: optimize-route devuelve objetos {id, lat, lng} ordenados.

            setOptimizedRoute(data.optimized_route);
            setMetrics({
                dist: data.total_distance_km,
                time: data.computation_ms
            });

        } catch (err: any) {
            console.error(err);
            alert("Error optimizando ruta: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-slate-100 relative">
            {/* Sidebar Controls */}
            <div className="w-80 bg-white shadow-xl z-10 flex flex-col border-r border-slate-200">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="text-blue-600" /> Planificador IA
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Algoritmo VRP (2-Opt Heuristic)
                    </p>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-2">
                    {stops.length === 0 && (
                        <div className="text-center p-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                            <p className="text-sm">Clic en el mapa para agregar puntos.</p>
                            <p className="text-xs mt-2">1º Clic: Depósito (Inicio)</p>
                            <p className="text-xs">Siguientes: Entregas</p>
                        </div>
                    )}

                    {stops.map((stop, idx) => (
                        <div key={stop.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-100 text-sm">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx === 0 ? 'bg-blue-600' : 'bg-orange-500'}`}>
                                {idx === 0 ? 'D' : idx}
                            </span>
                            <div className="flex-1">
                                <span className="font-medium text-slate-700">{stop.label}</span>
                                <span className="block text-[10px] text-slate-400">{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Metrics Result */}
                {metrics && (
                    <div className="p-4 bg-green-50 border-t border-green-100">
                        <h3 className="text-xs font-bold text-green-700 uppercase mb-2">Resultado Optimizado</h3>
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-white p-2 rounded border border-green-100">
                                <span className="block text-lg font-bold text-slate-800">{metrics.dist.toFixed(1)} km</span>
                                <span className="text-[10px] text-slate-500">DISTANCIA TOTAL</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-green-100">
                                <span className="block text-lg font-bold text-slate-800">{metrics.time.toFixed(0)} ms</span>
                                <span className="text-[10px] text-slate-500">TIEMPO CÁLCULO</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 border-t border-slate-200 space-y-2">
                    <button
                        onClick={handleOptimize}
                        disabled={stops.length < 3 || isLoading}
                        className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all ${stops.length < 3 ? 'bg-slate-300 cursor-not-allowed' :
                            isLoading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30'
                            }`}
                    >
                        {isLoading ? 'Calculando...' : <><Play size={18} /> OPTIMIZAR RUTA</>}
                    </button>

                    <button
                        onClick={handleReset}
                        className="w-full py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2 border border-slate-200"
                    >
                        <RotateCcw size={16} /> Reiniciar
                    </button>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                <MapContainer
                    center={[4.6097, -74.0817]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onAddStop={handleAddStop} />

                    {/* Polyline for Optimized Route */}
                    {optimizedRoute && (
                        <Polyline
                            positions={optimizedRoute.map(s => [s.lat, s.lng])}
                            pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8, lineJoin: 'round' }}
                        />
                    )}

                    {/* Markers */}
                    {stops.map((stop, idx) => (
                        <Marker
                            key={stop.id}
                            position={[stop.lat, stop.lng]}
                            icon={idx === 0 ? depotIcon : stopIcon(idx)}
                        >
                            <Popup>{stop.label}</Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default RoutePlanner;
