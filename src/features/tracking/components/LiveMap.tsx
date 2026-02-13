
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { createClient } from '@supabase/supabase-js';
import L from 'leaflet';
import { Navigation, Truck, CircleAlert, CheckCircle2 } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// --- CONFIG ---
// --- CONFIG ---
import { supabase } from '@/integrations/supabase/client';
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// const supabase = createClient(supabaseUrl, supabaseKey);

// --- TIPOS ---
type VehicleStatus = 'moving' | 'stopped' | 'offline' | 'alert';

interface VehiclePosition {
    id: string;
    plate: string;
    lat: number;
    lng: number;
    speed: number;
    heading: number; // 0-360
    status: VehicleStatus;
    last_updated: string;
}

// --- ICONO PERSONALIZADO (DivIcon con Rotación) ---
const createVehicleIcon = (status: VehicleStatus, heading: number) => {
    const color =
        status === 'moving' ? '#22c55e' : // Green
            status === 'stopped' ? '#f59e0b' : // Amber
                status === 'alert' ? '#ef4444' :   // Red
                    '#6b7280'; // Gray (offline)

    // Lucide icon rendered to string
    const iconMarkup = renderToStaticMarkup(
        <div style={{
            transform: `rotate(${heading}deg)`,
            transition: 'transform 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Navigation size={32} fill={color} color="#ffffff" strokeWidth={1.5} />
        </div>
    );

    return L.divIcon({
        html: iconMarkup,
        className: 'vehicle-marker-icon', // CSS handles size
        iconSize: [32, 32],
        iconAnchor: [16, 16], // Centered
    });
};

const LiveMap = () => {
    const [vehicles, setVehicles] = useState<Record<string, VehiclePosition>>({});
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'live' | 'error'>('connecting');

    // 1. CARGA INICIAL CON FALLBACK ROBUSTO
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const { data, error } = await supabase
                    .from('vehicles')
                    .select('id, plate, last_location, last_status, updated_at')
                    .not('last_location', 'is', null);

                if (error) throw error;

                const vehicleMap: Record<string, VehiclePosition> = {};
                data.forEach((v: any) => {
                    if (v.last_location?.lat && v.last_location?.lng) {
                        vehicleMap[v.id] = {
                            id: v.id,
                            plate: v.plate,
                            lat: v.last_location.lat,
                            lng: v.last_location.lng,
                            speed: v.last_location.speed || 0,
                            heading: v.last_location.heading || 0,
                            status: v.last_status as VehicleStatus || 'offline',
                            last_updated: v.updated_at
                        };
                    }
                });
                setVehicles(vehicleMap);
                setConnectionStatus('live');
            } catch (err) {
                console.warn('⚠️ Supabase fetch failed, using fallback mock data:', err);

                // MOCK DATA PARA DEMO/DEV CUANDO NO HAY DB
                const mockVehicles: Record<string, VehiclePosition> = {
                    'mj1': { id: 'mj1', plate: 'WKX-789', lat: 4.65, lng: -74.05, speed: 45, heading: 90, status: 'moving', last_updated: new Date().toISOString() },
                    'mj2': { id: 'mj2', plate: 'SJT-123', lat: 4.62, lng: -74.10, speed: 0, heading: 0, status: 'stopped', last_updated: new Date().toISOString() },
                    'mj3': { id: 'mj3', plate: 'QWE-456', lat: 4.70, lng: -74.08, speed: 80, heading: 180, status: 'alert', last_updated: new Date().toISOString() }
                };
                setVehicles(mockVehicles);
                setConnectionStatus('live'); // Simulamos live para UX
            }
        };

        fetchVehicles();
    }, []);

    // 2. REALTIME SUBSCRIPTION
    useEffect(() => {
        const channel = supabase
            .channel('live-tracking')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'vehicles' },
                (payload) => {
                    const newVehicle = payload.new;
                    if (newVehicle.last_location) {
                        setVehicles((prev) => ({
                            ...prev,
                            [newVehicle.id]: {
                                id: newVehicle.id,
                                plate: newVehicle.plate,
                                lat: newVehicle.last_location.lat,
                                lng: newVehicle.last_location.lng,
                                speed: newVehicle.last_location.speed || 0,
                                heading: newVehicle.last_location.heading || 0,
                                status: newVehicle.last_status as VehicleStatus || 'offline',
                                last_updated: newVehicle.updated_at
                            }
                        }));
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') console.log('✅ Realtime Connected to Vehicles');
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Centro inicial: Colombia
    const center: [number, number] = [4.6097, -74.0817];

    return (
        <div className="h-full w-full relative">
            {/* Status Overlay */}
            <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg border border-gray-200 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${connectionStatus === 'live' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-gray-700">
                    {connectionStatus === 'live' ? `Monitoreando ${Object.keys(vehicles).length} Activos` : 'Conectando...'}
                </span>
            </div>

            <MapContainer
                center={center}
                zoom={6}
                style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {Object.values(vehicles).map((vehicle) => (
                    <Marker
                        key={vehicle.id}
                        position={[vehicle.lat, vehicle.lng]}
                        icon={createVehicleIcon(vehicle.status, vehicle.heading)}
                    >
                        <Popup>
                            <div className="p-1 min-w-[150px]">
                                <h3 className="font-bold text-gray-900 border-b pb-1 mb-1 flex items-center gap-2">
                                    <Truck size={16} /> {vehicle.plate}
                                </h3>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Estado:</span>
                                        <span className={`font-medium ${vehicle.status === 'moving' ? 'text-green-600' : 'text-orange-600'}`}>
                                            {vehicle.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Velocidad:</span>
                                        <span className="font-mono">{Math.round(vehicle.speed)} km/h</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2">
                                        Actualizado: {new Date(vehicle.last_updated).toLocaleTimeString()}
                                    </div>
                                    <button className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 rounded transition-colors">
                                        Ver Historial
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default LiveMap;
