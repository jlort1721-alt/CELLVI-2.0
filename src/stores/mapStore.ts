import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TileLayerPreset, MapFilterState, RouteReplayState, RouteReplayPoint } from '@/features/monitoring/types/mapTypes';

interface MapState {
  tileLayer: TileLayerPreset;
  filters: MapFilterState;
  isFullscreen: boolean;
  selectedVehicleId: string | null;
  routeReplay: RouteReplayState | null;
  showControlPanel: boolean;

  setTileLayer: (preset: TileLayerPreset) => void;
  updateFilter: <K extends keyof MapFilterState>(key: K, value: MapFilterState[K]) => void;
  toggleFullscreen: () => void;
  setSelectedVehicle: (id: string | null) => void;
  startRouteReplay: (vehiclePlate: string, points: RouteReplayPoint[]) => void;
  stopRouteReplay: () => void;
  setReplaySpeed: (speed: number) => void;
  advanceReplay: () => void;
  toggleReplayPlay: () => void;
  setReplayIndex: (index: number) => void;
  toggleControlPanel: () => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      tileLayer: 'dark',
      filters: {
        statusFilter: ['moving', 'stopped', 'offline', 'alert'],
        showTrails: true,
        showGeofences: true,
        showHeatmap: false,
        showClusters: true,
        searchQuery: '',
      },
      isFullscreen: false,
      selectedVehicleId: null,
      routeReplay: null,
      showControlPanel: false,

      setTileLayer: (preset) => set({ tileLayer: preset }),
      updateFilter: (key, value) =>
        set((s) => ({ filters: { ...s.filters, [key]: value } })),
      toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),
      setSelectedVehicle: (id) => set({ selectedVehicleId: id }),
      startRouteReplay: (vehiclePlate, points) =>
        set({
          routeReplay: {
            isPlaying: false,
            currentIndex: 0,
            speed: 1,
            routePoints: points,
            vehiclePlate,
          },
        }),
      stopRouteReplay: () => set({ routeReplay: null }),
      setReplaySpeed: (speed) =>
        set((s) => (s.routeReplay ? { routeReplay: { ...s.routeReplay, speed } } : {})),
      advanceReplay: () =>
        set((s) => {
          if (!s.routeReplay) return {};
          const next = s.routeReplay.currentIndex + 1;
          if (next >= s.routeReplay.routePoints.length) {
            return { routeReplay: { ...s.routeReplay, isPlaying: false, currentIndex: s.routeReplay.routePoints.length - 1 } };
          }
          return { routeReplay: { ...s.routeReplay, currentIndex: next } };
        }),
      toggleReplayPlay: () =>
        set((s) => (s.routeReplay ? { routeReplay: { ...s.routeReplay, isPlaying: !s.routeReplay.isPlaying } } : {})),
      setReplayIndex: (index) =>
        set((s) => (s.routeReplay ? { routeReplay: { ...s.routeReplay, currentIndex: index } } : {})),
      toggleControlPanel: () => set((s) => ({ showControlPanel: !s.showControlPanel })),
    }),
    { name: 'cellvi-map-storage', partialize: (state) => ({ tileLayer: state.tileLayer, filters: state.filters }) }
  )
);
