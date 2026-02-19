import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Union of all navigable module identifiers in the platform.
 * Each value corresponds to a key in `MODULE_REGISTRY` and a sidebar nav item.
 */
export type ActiveModule =
  | 'overview' | 'map' | 'alerts'
  | 'routes' | 'geofences' | 'drivers'
  | 'fuel' | 'cold-chain' | 'connectivity'
  | 'asset-detail' | 'predictive'
  | 'policy-engine' | 'gnss-security' | 'evidence' | 'audit-log' | 'reports' | 'compliance' | 'rndc'
  | 'billing' | 'admin'
  | 'evidence-verifier' | 'gateway-monitor'
  | 'asegurar-ia'
  | 'route-genius' | 'vision-guard' | 'neuro-core'
  | 'ai-command-center' | 'notification-center';

/**
 * Global UI state managed by Zustand with localStorage persistence.
 * Controls sidebar visibility and the currently active navigation module.
 */
interface UIState {
  /** Whether the sidebar navigation drawer is expanded. */
  sidebarOpen: boolean;
  /** The currently displayed module (drives main content area). */
  activeModule: ActiveModule;
  /** Set sidebar open/closed explicitly. */
  setSidebarOpen: (open: boolean) => void;
  /** Toggle sidebar between open and closed. */
  toggleSidebar: () => void;
  /** Navigate to a different module. */
  setActiveModule: (module: ActiveModule) => void;
}

/**
 * Zustand store for global UI state (sidebar, active module).
 * Persisted to localStorage under key `cellvi-ui-storage`.
 *
 * @example
 * const activeModule = useUIStore((s) => s.activeModule);
 * const setModule = useUIStore((s) => s.setActiveModule);
 */
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
