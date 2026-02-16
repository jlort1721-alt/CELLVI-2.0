
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Polyline, ZoomControl, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Navigation, Truck, AlertTriangle, Zap, Clock, X, Play, History } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

import { supabase } from '@/integrations/supabase/client';
import { useMapStore } from '@/stores/mapStore';
import { geofences as demoGeofences, routeRecords } from '@/lib/demoData';
import { TILE_LAYERS } from '@/features/monitoring/types/mapTypes';
import MapControlPanel from './MapControlPanel';
import HeatmapLayer from './HeatmapLayer';
import RouteReplayControl from './RouteReplayControl';

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
  trail: [number, number][];
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
      {selected && <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />}
      <div style={{
        transform: `rotate(${heading}deg)`,
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))'
      }}>
        <Navigation size={32} fill={color} color="#ffffff" strokeWidth={1.5} />
      </div>
      <div className="absolute -bottom-4 bg-sidebar/90 backdrop-blur text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10 whitespace-nowrap shadow-lg">
        {plate}
        {status === 'moving' && <span className="ml-1 text-green-400 text-[8px]">&#9679;</span>}
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

// Custom cluster icon
const createClusterIcon = (cluster: L.MarkerCluster) => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 36 : count < 50 ? 44 : 52;
  const color = count < 10 ? '#22c55e' : count < 50 ? '#f59e0b' : '#ef4444';

  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color}20;
      border:2px solid ${color};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:bold;color:${color};
      backdrop-filter:blur(4px);
      box-shadow:0 4px 12px ${color}40;
    ">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(size, size),
  });
};

// Imperative MarkerClusterGroup using leaflet.markercluster
const ClusterLayer = ({ vehicles, enabled, selectedVehicleId, onVehicleClick, createClusterIcon: iconFn }: {
  vehicles: VehiclePosition[];
  enabled: boolean;
  selectedVehicleId: string | null;
  onVehicleClick: (id: string) => void;
  createClusterIcon: (cluster: L.MarkerCluster) => L.DivIcon;
}) => {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
      return;
    }

    if (!clusterRef.current) {
      clusterRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        iconCreateFunction: iconFn,
      });
      map.addLayer(clusterRef.current);
    }

    const group = clusterRef.current;
    group.clearLayers();

    vehicles.forEach((v) => {
      const marker = L.marker([v.lat, v.lng], {
        icon: createVehicleIcon(v.status, v.heading, v.plate, selectedVehicleId === v.id),
      });
      marker.on('click', () => onVehicleClick(v.id));
      group.addLayer(marker);
    });

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
    };
  }, [enabled, vehicles, selectedVehicleId, map, onVehicleClick, iconFn]);

  return null;
};

const FleetMap = () => {
  const [vehicles, setVehicles] = useState<Record<string, VehiclePosition>>({});
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<L.Map>(null);

  const { tileLayer, filters, isFullscreen, routeReplay, startRouteReplay } = useMapStore();
  const { t } = useTranslation();
  const tileConfig = TILE_LAYERS[tileLayer];

  // 1. INIT
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
              id: v.id, plate: v.plate,
              lat: v.last_location.lat, lng: v.last_location.lng,
              speed: v.last_location.speed || 0, heading: v.last_location.heading || 0,
              status: (v.last_status as VehicleStatus) || 'offline',
              last_updated: v.updated_at,
              trail: [[v.last_location.lat, v.last_location.lng]]
            };
          }
        });
        setVehicles(vehicleMap);
      } catch {
        // MOCK DATA
        const mockVehicles: Record<string, VehiclePosition> = {
          'mj1': { id: 'mj1', plate: 'NAR-123', lat: 1.2136, lng: -77.2811, speed: 72, heading: 45, status: 'moving', last_updated: new Date().toISOString(), trail: [[1.21, -77.29], [1.2136, -77.2811]] },
          'mj2': { id: 'mj2', plate: 'NAR-456', lat: 2.4419, lng: -76.6067, speed: 85, heading: 180, status: 'moving', last_updated: new Date().toISOString(), trail: [[2.45, -76.61], [2.4419, -76.6067]] },
          'mj3': { id: 'mj3', plate: 'NAR-789', lat: 1.6144, lng: -77.0857, speed: 0, heading: 0, status: 'stopped', last_updated: new Date().toISOString(), trail: [[1.6144, -77.0857]] },
          'mj4': { id: 'mj4', plate: 'PUT-321', lat: 1.8528, lng: -76.0467, speed: 110, heading: 90, status: 'alert', last_updated: new Date().toISOString(), trail: [[1.85, -76.05], [1.8528, -76.0467]] },
          'mj5': { id: 'mj5', plate: 'CAU-654', lat: 3.4516, lng: -76.532, speed: 0, heading: 0, status: 'offline', last_updated: new Date().toISOString(), trail: [[3.4516, -76.532]] },
          'mj6': { id: 'mj6', plate: 'NAR-987', lat: 0.8614, lng: -77.6711, speed: 60, heading: 350, status: 'moving', last_updated: new Date().toISOString(), trail: [[0.86, -77.67], [0.8614, -77.6711]] },
        };
        setVehicles(mockVehicles);
      } finally {
        setMapReady(true);
      }
    };
    fetchVehicles();
  }, []);

  // 2. REALTIME
  useEffect(() => {
    const channel = supabase
      .channel('live-tracking-fleet-v2')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'vehicles' },
        (payload) => {
          const newV = payload.new;
          if (newV.last_location?.lat) {
            setVehicles((prev) => {
              const oldV = prev[newV.id];
              const newPoint: [number, number] = [newV.last_location.lat, newV.last_location.lng];
              const newTrail = oldV ? [...oldV.trail, newPoint].slice(-20) : [newPoint];
              return {
                ...prev,
                [newV.id]: {
                  id: newV.id, plate: newV.plate,
                  lat: newV.last_location.lat, lng: newV.last_location.lng,
                  speed: newV.last_location.speed || 0, heading: newV.last_location.heading || 0,
                  status: (newV.last_status as VehicleStatus) || 'offline',
                  last_updated: newV.updated_at, trail: newTrail
                }
              };
            });
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Auto-center on selection
  useEffect(() => {
    if (selectedVehicleId && vehicles[selectedVehicleId] && mapRef.current) {
      const v = vehicles[selectedVehicleId];
      mapRef.current.flyTo([v.lat, v.lng], 15, { duration: 1.5 });
    }
  }, [selectedVehicleId, vehicles]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return Object.values(vehicles).filter((v) => {
      if (!filters.statusFilter.includes(v.status)) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return v.plate.toLowerCase().includes(q) || v.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [vehicles, filters.statusFilter, filters.searchQuery]);

  // Heatmap points from vehicle positions
  const heatmapPoints = useMemo((): [number, number, number][] => {
    if (!filters.showHeatmap) return [];
    return Object.values(vehicles).map((v) => [v.lat, v.lng, v.speed > 0 ? 0.8 : 0.3]);
  }, [vehicles, filters.showHeatmap]);

  // Replay marker position
  const replayPosition = useMemo(() => {
    if (!routeReplay) return null;
    const pt = routeReplay.routePoints[routeReplay.currentIndex];
    return pt ? { lat: pt.lat, lng: pt.lng, heading: pt.heading } : null;
  }, [routeReplay]);

  if (!mapReady) return <div className="h-full w-full bg-sidebar animate-pulse rounded-xl" />;

  const selectedVehicle = selectedVehicleId ? vehicles[selectedVehicleId] : null;

  return (
    <div className={`h-full w-full relative rounded-xl overflow-hidden shadow-2xl border border-sidebar-border flex flex-row ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : ''}`}>
      {/* MAP AREA */}
      <div className="flex-1 relative h-full">
        <MapContainer
          center={[2.5, -76.5]}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          className="z-0 bg-sidebar"
          ref={mapRef}
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            attribution={tileConfig.attribution}
            url={tileConfig.url}
            maxZoom={tileConfig.maxZoom}
          />

          {/* Geofences */}
          {filters.showGeofences && demoGeofences.filter((g) => g.active).map((g) => (
            <Circle
              key={g.id}
              center={[g.lat, g.lng]}
              radius={g.radiusM}
              pathOptions={{
                color: g.type === 'polygon' ? '#a855f7' : '#3b82f6',
                fillOpacity: 0.08,
                weight: 2,
                dashArray: '6 4',
              }}
            />
          ))}

          {/* Heatmap */}
          {filters.showHeatmap && heatmapPoints.length > 0 && (
            <HeatmapLayer points={heatmapPoints} />
          )}

          {/* Vehicle Markers with Clustering (imperative leaflet.markercluster) */}
          <ClusterLayer
            vehicles={filteredVehicles}
            enabled={filters.showClusters}
            selectedVehicleId={selectedVehicleId}
            onVehicleClick={setSelectedVehicleId}
            createClusterIcon={createClusterIcon}
          />

          {/* Trails (rendered via react-leaflet) */}
          {filters.showTrails && filteredVehicles.filter((v) => v.trail.length > 1).map((v) => (
            <Polyline
              key={`trail-${v.id}`}
              positions={v.trail}
              pathOptions={{
                color: v.status === 'moving' ? '#22c55e' : '#f59e0b',
                weight: 3, opacity: 0.4,
                dashArray: v.status === 'offline' ? '5, 10' : undefined
              }}
            />
          ))}

          {/* Non-clustered markers fallback */}
          {!filters.showClusters && filteredVehicles.map((v) => (
            <Marker
              key={v.id}
              position={[v.lat, v.lng]}
              icon={createVehicleIcon(v.status, v.heading, v.plate, selectedVehicleId === v.id)}
              eventHandlers={{ click: () => setSelectedVehicleId(v.id) }}
            />
          ))}

          {/* Route Replay marker */}
          {replayPosition && (
            <Marker
              position={[replayPosition.lat, replayPosition.lng]}
              icon={L.divIcon({
                html: `<div style="width:20px;height:20px;background:#c9a961;border-radius:50%;border:3px solid white;box-shadow:0 0 12px #c9a961;transform:rotate(${replayPosition.heading}deg)"></div>`,
                className: 'replay-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            />
          )}
        </MapContainer>

        {/* FLOATING HUD */}
        <div className="absolute top-4 left-4 z-[500] pointer-events-none">
          <div className="bg-sidebar/80 backdrop-blur border border-sidebar-border p-2 rounded-lg shadow-xl text-sidebar-foreground text-xs font-mono pointer-events-auto">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              LIVE FEED: {filteredVehicles.length}/{Object.keys(vehicles).length} UNITS
            </span>
          </div>
        </div>

        {/* Map Control Panel */}
        <MapControlPanel />

        {/* Route Replay Control */}
        <RouteReplayControl />
      </div>

      {/* SIDE PANEL */}
      {selectedVehicle && (
        <div className="w-80 h-full bg-sidebar border-l border-sidebar-border flex flex-col shadow-2xl z-10 absolute right-0 top-0 transition-transform duration-300">
          <div className="p-4 border-b border-sidebar-border flex justify-between items-start bg-sidebar-accent/50">
            <div>
              <h2 className="text-xl font-bold text-sidebar-foreground flex items-center gap-2">
                <Truck className="text-blue-500" />
                {selectedVehicle.plate}
              </h2>
              <p className="text-xs text-sidebar-foreground/40 mt-1">{selectedVehicle.id.slice(0, 8)}...</p>
            </div>
            <button type="button" onClick={() => setSelectedVehicleId(null)} className="text-sidebar-foreground/40 hover:text-sidebar-foreground" title="Cerrar panel">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-6 overflow-y-auto flex-1">
            <div className={`p-4 rounded-lg border ${selectedVehicle.status === 'moving' ? 'bg-green-500/10 border-green-500/20' :
              selectedVehicle.status === 'alert' ? 'bg-red-500/10 border-red-500/20' :
                'bg-sidebar-accent border-sidebar-border'
              }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-sidebar-foreground/40">Estado</span>
                {selectedVehicle.status === 'alert' && <AlertTriangle size={16} className="text-red-500" />}
              </div>
              <div className="text-2xl font-bold text-sidebar-foreground capitalize flex items-center gap-2">
                {selectedVehicle.status}
                {selectedVehicle.status === 'moving' && <Zap size={16} className="text-yellow-400 animate-pulse" />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-sidebar-accent/50 p-3 rounded border border-sidebar-border">
                <span className="text-[10px] text-sidebar-foreground/50 block mb-1">VELOCIDAD</span>
                <span className="text-lg font-mono text-sidebar-foreground">{Math.round(selectedVehicle.speed)} <span className="text-xs text-sidebar-foreground/50">km/h</span></span>
              </div>
              <div className="bg-sidebar-accent/50 p-3 rounded border border-sidebar-border">
                <span className="text-[10px] text-sidebar-foreground/50 block mb-1">RUMBO</span>
                <span className="text-lg font-mono text-sidebar-foreground">{Math.round(selectedVehicle.heading)}°</span>
              </div>
              <div className="bg-sidebar-accent/50 p-3 rounded border border-sidebar-border col-span-2 flex items-center gap-3">
                <Clock size={16} className="text-sidebar-foreground/50" />
                <div>
                  <span className="text-[10px] text-sidebar-foreground/50 block">ÚLTIMO REPORTE</span>
                  <span className="text-sm font-mono text-sidebar-foreground">
                    {new Date(selectedVehicle.last_updated).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  const route = routeRecords.find((r) => r.plate === selectedVehicle.plate) || routeRecords[0];
                  startRouteReplay(
                    selectedVehicle.plate,
                    route.events.map((e) => ({
                      lat: e.lat, lng: e.lng,
                      speed: e.type === 'speeding' ? 110 : e.type === 'stop' ? 0 : 65,
                      heading: Math.random() * 360,
                      timestamp: `2026-02-11T${e.time}:00`,
                    }))
                  );
                }}
                className="w-full py-2 bg-gold/10 hover:bg-gold/20 text-gold rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-gold/20"
              >
                <Play size={14} /> Replay de Ruta
              </button>
              <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <History size={14} /> Ver Historial
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
