import React, { memo } from 'react';
import { Map, Satellite, Mountain, Moon, Eye, EyeOff, Route, Radar, Flame, Users, Search, X, Maximize2, Minimize2, Settings2 } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import type { TileLayerPreset } from '@/features/monitoring/types/mapTypes';

const tileOptions: { key: TileLayerPreset; icon: React.ElementType; label: string }[] = [
  { key: 'street', icon: Map, label: 'Calles' },
  { key: 'satellite', icon: Satellite, label: 'Satélite' },
  { key: 'terrain', icon: Mountain, label: 'Terreno' },
  { key: 'dark', icon: Moon, label: 'Oscuro' },
];

const MapControlPanel = memo(() => {
  const {
    tileLayer, setTileLayer, filters, updateFilter,
    isFullscreen, toggleFullscreen, showControlPanel, toggleControlPanel,
  } = useMapStore();

  if (!showControlPanel) {
    return (
      <button
        onClick={toggleControlPanel}
        className="absolute top-4 right-4 z-[500] p-2.5 bg-sidebar/90 backdrop-blur border border-sidebar-border rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors shadow-xl"
        title="Controles del Mapa"
      >
        <Settings2 className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-[500] w-64 bg-sidebar/95 backdrop-blur-xl border border-sidebar-border rounded-2xl shadow-2xl text-sidebar-foreground overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
        <span className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/60">Controles</span>
        <div className="flex items-center gap-1">
          <button onClick={toggleFullscreen} className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors" title={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}>
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={toggleControlPanel} className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-sidebar-foreground/50" />
          <input
            type="text"
            placeholder="Buscar vehículo..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>

        {/* Tile Layers */}
        <div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-sidebar-foreground/50 block mb-2">Capa Base</span>
          <div className="grid grid-cols-4 gap-1">
            {tileOptions.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setTileLayer(key)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[8px] font-bold transition-all ${
                  tileLayer === key
                    ? 'bg-gold/10 text-gold border border-gold/30'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filters */}
        <div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-sidebar-foreground/50 block mb-2">Estado</span>
          <div className="space-y-1">
            {[
              { key: 'moving' as const, label: 'En Movimiento', color: 'bg-green-500' },
              { key: 'stopped' as const, label: 'Detenido', color: 'bg-yellow-500' },
              { key: 'alert' as const, label: 'Alerta', color: 'bg-red-500' },
              { key: 'offline' as const, label: 'Desconectado', color: 'bg-gray-500' },
            ].map(({ key, label, color }) => (
              <label key={key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={filters.statusFilter.includes(key)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...filters.statusFilter, key]
                      : filters.statusFilter.filter((s) => s !== key);
                    updateFilter('statusFilter', updated);
                  }}
                  className="w-3 h-3 rounded accent-gold"
                />
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-[10px]">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Layer Toggles */}
        <div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-sidebar-foreground/50 block mb-2">Capas</span>
          <div className="space-y-1">
            {[
              { key: 'showTrails' as const, icon: Route, label: 'Estelas de Ruta' },
              { key: 'showGeofences' as const, icon: Radar, label: 'Geocercas' },
              { key: 'showHeatmap' as const, icon: Flame, label: 'Mapa de Calor' },
              { key: 'showClusters' as const, icon: Users, label: 'Clustering' },
            ].map(({ key, icon: Icon, label }) => (
              <label key={key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={filters[key]}
                  onChange={(e) => updateFilter(key, e.target.checked)}
                  className="w-3 h-3 rounded accent-gold"
                />
                <Icon className="w-3 h-3 text-sidebar-foreground/60" />
                <span className="text-[10px]">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
MapControlPanel.displayName = 'MapControlPanel';

export default MapControlPanel;
