/**
 * Query Key Factory - PR #25
 *
 * Centralized query key management for React Query.
 * Prevents cache key typos and enables type-safe invalidation.
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 */

export const queryKeys = {
  // Auth & Profile
  auth: {
    all: ["auth"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
    profile: () => [...queryKeys.auth.all, "profile"] as const,
  },

  // Tenant
  tenant: {
    all: ["tenant"] as const,
    detail: () => [...queryKeys.tenant.all] as const,
  },

  // Vehicles
  vehicles: {
    all: ["vehicles"] as const,
    lists: () => [...queryKeys.vehicles.all, "list"] as const,
    list: (filters?: { active?: boolean }) => [...queryKeys.vehicles.lists(), filters] as const,
    details: () => [...queryKeys.vehicles.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.vehicles.details(), id] as const,
    positions: () => [...queryKeys.vehicles.all, "positions"] as const,
  },

  // Telemetry
  telemetry: {
    all: ["telemetry"] as const,
    lists: () => [...queryKeys.telemetry.all, "list"] as const,
    list: (vehicleId?: string, page?: number, pageSize?: number) =>
      [...queryKeys.telemetry.lists(), { vehicleId, page, pageSize }] as const,
  },

  // Alerts
  alerts: {
    all: ["alerts"] as const,
    lists: () => [...queryKeys.alerts.all, "list"] as const,
    list: (page?: number, pageSize?: number) =>
      [...queryKeys.alerts.lists(), { page, pageSize }] as const,
    unacknowledged: () => [...queryKeys.alerts.all, "unacknowledged"] as const,
  },

  // Drivers
  drivers: {
    all: ["drivers"] as const,
    lists: () => [...queryKeys.drivers.all, "list"] as const,
    list: () => [...queryKeys.drivers.lists()] as const,
  },

  // Devices
  devices: {
    all: ["devices"] as const,
    lists: () => [...queryKeys.devices.all, "list"] as const,
    list: () => [...queryKeys.devices.lists()] as const,
  },

  // Policies
  policies: {
    all: ["policies"] as const,
    lists: () => [...queryKeys.policies.all, "list"] as const,
    list: (filters?: { status?: string }) => [...queryKeys.policies.lists(), filters] as const,
  },

  // Geofences
  geofences: {
    all: ["geofences"] as const,
    lists: () => [...queryKeys.geofences.all, "list"] as const,
    list: () => [...queryKeys.geofences.lists()] as const,
  },

  // Evidence
  evidence: {
    all: ["evidence"] as const,
    lists: () => [...queryKeys.evidence.all, "list"] as const,
    list: (page?: number, pageSize?: number) =>
      [...queryKeys.evidence.lists(), { page, pageSize }] as const,
  },

  // Cold Chain
  coldChain: {
    all: ["cold_chain"] as const,
    lists: () => [...queryKeys.coldChain.all, "list"] as const,
    list: (vehicleId?: string, page?: number, pageSize?: number) =>
      [...queryKeys.coldChain.lists(), { vehicleId, page, pageSize }] as const,
  },

  // Reports
  reports: {
    all: ["reports"] as const,
    operational: (dateRange: { start: string; end: string }) =>
      [...queryKeys.reports.all, "operational", dateRange] as const,
    security: (dateRange: { start: string; end: string }) =>
      [...queryKeys.reports.all, "security", dateRange] as const,
  },

  // Dashboard
  dashboard: {
    all: ["dashboard"] as const,
    stats: () => [...queryKeys.dashboard.all, "stats"] as const,
  },

  // Admin
  admin: {
    all: ["admin"] as const,
    users: (page?: number, pageSize?: number) =>
      [...queryKeys.admin.all, "users", { page, pageSize }] as const,
  },
} as const;

/**
 * Type-safe query key helper
 *
 * @example
 * queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
 * queryClient.invalidateQueries({ queryKey: queryKeys.telemetry.list(vehicleId, 1, 100) });
 */
export type QueryKeys = typeof queryKeys;
