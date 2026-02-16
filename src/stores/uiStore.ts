import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ActiveModule =
  | 'overview' | 'map' | 'alerts'
  | 'routes' | 'geofences' | 'drivers'
  | 'fuel' | 'cold-chain' | 'connectivity'
  | 'asset-detail' | 'predictive'
  | 'policy-engine' | 'gnss-security' | 'evidence' | 'audit-log' | 'reports' | 'compliance' | 'rndc'
  | 'billing' | 'admin'
  | 'evidence-verifier' | 'gateway-monitor'
  | 'asegurar-ia'
  | 'route-genius' | 'vision-guard' | 'neuro-core';

interface UIState {
  sidebarOpen: boolean;
  activeModule: ActiveModule;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveModule: (module: ActiveModule) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeModule: 'overview',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setActiveModule: (module) => set({ activeModule: module }),
    }),
    {
      name: 'cellvi-ui-storage', // name of the item in the storage (must be unique)
    }
  )
);
