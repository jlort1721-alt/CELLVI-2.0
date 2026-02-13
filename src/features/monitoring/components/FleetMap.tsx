
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { createClient } from '@supabase/supabase-js';
import L from 'leaflet';
import { Navigation, Truck, AlertTriangle, WifiOff, Zap, Clock, X } from 'lucide-react';
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
  heading: number;
  status: VehicleStatus;
  last_updated: string;
  trail: [number, number][]; // Historial reciente para "culebrita"
}

// --- ICON GEN ---
const createVehicleIcon = (status: VehicleStatus, heading: number, plate: string, selected: boolean) => {
  const color =
    status === 'moving' ? '#22c55e' :
      status === 'stopped' ? '#f59e0b' :
        status === 'alert' ? '#ef4444' :
          '#6b7280';

  const scale = selected ? 1.2 : 1;

  const iconMarkup = renderToStaticMarkup(
    <div className="relative flex items-center justify-center w-10 h-10 transition-transform duration-300" style={{ transform: `scale(${scale})` }}>
      {/* Halo de Selección */}
      {selected && <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />}

      {/* Flecha de Dirección */}
      <div style={{
        transform: `rotate(${heading}deg)`,
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))'
      }}>
        <Navigation size={32} fill={color} color="#ffffff" strokeWidth={1.5} />
      </div>

      {/* Placa Flotante */}
      <div className="absolute -bottom-4 bg-slate-900/90 backdrop-blur text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10 whitespace-nowrap shadow-lg">
        {plate}
      </div>
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'vehicle-marker-icon bg-transparent border-none',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const FleetMap = () => {
  const [vehicles, setVehicles] = useState<Record<string, VehiclePosition>>({});
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<L.Map>(null);

  // 1. INIT CON FALLBACK ROBUSTO
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('id, plate, last_location, last_status, updated_at')
          .not('last_location', 'is', null);

        if (error) throw error;

        const vehicleMap: Record<string, VehiclePosition> = {};
        data?.forEach((v: any) => {
          if (v.last_location?.lat) {
            vehicleMap[v.id] = {
              id: v.id,
              plate: v.plate,
              lat: v.last_location.lat,
              lng: v.last_location.lng,
              speed: v.last_location.speed || 0,
              heading: v.last_location.heading || 0,
              status: (v.last_status as VehicleStatus) || 'offline',
              last_updated: v.updated_at,
              trail: [[v.last_location.lat, v.last_location.lng]]
            };
          }
        });
        setVehicles(vehicleMap);
      } catch (err) {
        console.warn('⚠️ Supabase fetch failed in FleetMap, using mock data:', err);
        // MOCK DATA
        const mockVehicles: Record<string, VehiclePosition> = {
          'mj1': { id: 'mj1', plate: 'WKX-789', lat: 4.65, lng: -74.05, speed: 45, heading: 90, status: 'moving', last_updated: new Date().toISOString(), trail: [[4.64, -74.06], [4.65, -74.05]] },
          'mj2': { id: 'mj2', plate: 'SJT-123', lat: 4.62, lng: -74.10, speed: 0, heading: 0, status: 'stopped', last_updated: new Date().toISOString(), trail: [[4.62, -74.10]] },
          'mj3': { id: 'mj3', plate: 'QWE-456', lat: 4.70, lng: -74.08, speed: 80, heading: 180, status: 'alert', last_updated: new Date().toISOString(), trail: [[4.71, -74.08], [4.70, -74.08]] }
        };
        setVehicles(mockVehicles);
      } finally {
        setMapReady(true);
      }
    };

    fetchVehicles();

    // CSS Check
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // 2. REALTIME
  useEffect(() => {
    const channel = supabase
      .channel('live-tracking-fleet-v2')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'vehicles' },
        (payload) => {
          const newV = payload.new;
          if (newV.last_location?.lat) {
            setVehicles((prev) => {
              const oldV = prev[newV.id];
              // Calcular nuevo trail (máx 20 puntos)
              const newPoint: [number, number] = [newV.last_location.lat, newV.last_location.lng];
              const newTrail = oldV ? [...oldV.trail, newPoint].slice(-20) : [newPoint];

              return {
                ...prev,
                [newV.id]: {
                  id: newV.id,
                  plate: newV.plate,
                  lat: newV.last_location.lat,
                  lng: newV.last_location.lng,
                  speed: newV.last_location.speed || 0,
                  heading: newV.last_location.heading || 0,
                  status: (newV.last_status as VehicleStatus) || 'offline',
                  last_updated: newV.updated_at,
                  trail: newTrail
                }
              };
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Auto-center on selection
  useEffect(() => {
    if (selectedVehicleId && vehicles[selectedVehicleId] && mapRef.current) {
      const v = vehicles[selectedVehicleId];
      mapRef.current.flyTo([v.lat, v.lng], 15, { duration: 1.5 });
    }
  }, [selectedVehicleId]);

  if (!mapReady) return <div className="h-full w-full bg-slate-900 animate-pulse rounded-xl" />;

  const selectedVehicle = selectedVehicleId ? vehicles[selectedVehicleId] : null;

  return (
    <div className="h-full w-full relative rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 flex flex-row">

      {/* MAP AREA */}
      <div className="flex-1 relative h-full">
        <MapContainer
          center={[4.6097, -74.0817]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          className="z-0 bg-slate-900"
          ref={mapRef}
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {Object.values(vehicles).map((v) => (
            <React.Fragment key={v.id}>
              {/* Trail (Estela) */}
              {v.trail.length > 1 && (
                <Polyline
                  positions={v.trail}
                  pathOptions={{
                    color: v.status === 'moving' ? '#22c55e' : '#f59e0b',
                    weight: 3,
                    opacity: 0.5,
                    dashArray: v.status === 'offline' ? '5, 10' : undefined
                  }}
                />
              )}

              {/* Marker */}
              <Marker
                position={[v.lat, v.lng]}
                icon={createVehicleIcon(v.status, v.heading, v.plate, selectedVehicleId === v.id)}
                eventHandlers={{
                  click: () => setSelectedVehicleId(v.id)
                }}
              />
            </React.Fragment>
          ))}
        </MapContainer>

        {/* FLOATING HUD */}
        <div className="absolute top-4 left-4 z-[500] pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded-lg shadow-xl text-white text-xs font-mono pointer-events-auto">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              LIVE FEED: {Object.keys(vehicles).length} UNITS
            </span>
          </div>
        </div>
      </div>

      {/* SIDE PANEL (DETAIL) */}
      {selectedVehicle && (
        <div className="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-10 absolute right-0 top-0 transition-transform duration-300">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex justify-between items-start bg-slate-800/50">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Truck className="text-blue-500" />
                {selectedVehicle.plate}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{selectedVehicle.id.slice(0, 8)}...</p>
            </div>
            <button onClick={() => setSelectedVehicleId(null)} className="text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Stats */}
          <div className="p-4 space-y-6 overflow-y-auto flex-1">
            {/* Status Card */}
            <div className={`p-4 rounded-lg border ${selectedVehicle.status === 'moving' ? 'bg-green-500/10 border-green-500/20' :
              selectedVehicle.status === 'alert' ? 'bg-red-500/10 border-red-500/20' :
                'bg-slate-800 border-slate-700'
              }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Estado</span>
                {selectedVehicle.status === 'alert' && <AlertTriangle size={16} className="text-red-500" />}
              </div>
              <div className="text-2xl font-bold text-white capitalize flex items-center gap-2">
                {selectedVehicle.status}
                {selectedVehicle.status === 'moving' && <Zap size={16} className="text-yellow-400 animate-pulse" />}
              </div>
            </div>

            {/* Telemetry Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                <span className="text-[10px] text-slate-500 block mb-1">VELOCIDAD</span>
                <span className="text-lg font-mono text-white">{Math.round(selectedVehicle.speed)} <span className="text-xs text-slate-500">km/h</span></span>
              </div>
              <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                <span className="text-[10px] text-slate-500 block mb-1">RUMBO</span>
                <span className="text-lg font-mono text-white">{Math.round(selectedVehicle.heading)}°</span>
              </div>
              <div className="bg-slate-800/50 p-3 rounded border border-slate-700 col-span-2 flex items-center gap-3">
                <Clock size={16} className="text-slate-500" />
                <div>
                  <span className="text-[10px] text-slate-500 block">ÚLTIMO REPORTE</span>
                  <span className="text-sm font-mono text-white">
                    {new Date(selectedVehicle.last_updated).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors">
                Ver Historial de Viajes
              </button>
              <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm font-medium transition-colors border border-slate-700">
                Deshabilitar Motor (Remoto)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetMap;
