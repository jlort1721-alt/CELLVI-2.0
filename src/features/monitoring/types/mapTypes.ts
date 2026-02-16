// Enterprise Map Type Definitions

export type TileLayerPreset = 'street' | 'satellite' | 'terrain' | 'dark';

export interface TileLayerConfig {
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
}

export const TILE_LAYERS: Record<TileLayerPreset, TileLayerConfig> = {
  street: {
    name: 'Calles',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  satellite: {
    name: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    maxZoom: 18,
  },
  terrain: {
    name: 'Terreno',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
    maxZoom: 17,
  },
  dark: {
    name: 'Oscuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB',
    maxZoom: 20,
  },
};

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  lat: number;
  lng: number;
  radiusM: number;
  active: boolean;
  color: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export interface RouteReplayPoint {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export interface RouteReplayState {
  isPlaying: boolean;
  currentIndex: number;
  speed: number;
  routePoints: RouteReplayPoint[];
  vehiclePlate: string;
}

export type VehicleStatusFilter = 'moving' | 'stopped' | 'offline' | 'alert';

export interface MapFilterState {
  statusFilter: VehicleStatusFilter[];
  showTrails: boolean;
  showGeofences: boolean;
  showHeatmap: boolean;
  showClusters: boolean;
  searchQuery: string;
}
