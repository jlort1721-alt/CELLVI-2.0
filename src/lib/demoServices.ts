// Service interfaces — currently backed by mock data.
// Replace implementations with API calls for production.

import {
  vehicles,
  routeRecords,
  geofences as geofenceData,
  fuelRecords,
  alerts,
  type Vehicle,
  type RouteRecord,
  type Geofence,
  type FuelRecord,
  type Alert,
} from "./demoData";

// ----- Vehicle Service -----
export const vehicleService = {
  getAll: (): Vehicle[] => vehicles,
  getById: (id: string): Vehicle | undefined => vehicles.find((v) => v.id === id),
};

// ----- Route Service -----
export const routeService = {
  getAll: (filters?: { vehicleId?: string; dateFrom?: string; dateTo?: string }): RouteRecord[] => {
    let result = [...routeRecords];
    if (filters?.vehicleId) result = result.filter((r) => r.vehicleId === filters.vehicleId);
    if (filters?.dateFrom) result = result.filter((r) => r.date >= filters.dateFrom!);
    if (filters?.dateTo) result = result.filter((r) => r.date <= filters.dateTo!);
    return result;
  },
  getById: (id: string): RouteRecord | undefined => routeRecords.find((r) => r.id === id),
};

// ----- Geofence Service -----
let _geofences = [...geofenceData];
let _nextId = 6;

export const geofenceService = {
  getAll: (): Geofence[] => [..._geofences],
  create: (g: Omit<Geofence, "id" | "createdAt">): Geofence => {
    const newG: Geofence = { ...g, id: `G${String(_nextId++).padStart(3, "0")}`, createdAt: new Date().toISOString().split("T")[0] };
    _geofences.push(newG);
    return newG;
  },
  update: (id: string, data: Partial<Geofence>): Geofence | null => {
    const idx = _geofences.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    _geofences[idx] = { ..._geofences[idx], ...data };
    return _geofences[idx];
  },
  delete: (id: string): boolean => {
    const len = _geofences.length;
    _geofences = _geofences.filter((g) => g.id !== id);
    return _geofences.length < len;
  },
};

// ----- Fuel Service -----
export const fuelService = {
  getAll: (filters?: { vehicleId?: string; dateFrom?: string; dateTo?: string }): FuelRecord[] => {
    let result = [...fuelRecords];
    if (filters?.vehicleId) result = result.filter((r) => r.vehicleId === filters.vehicleId);
    if (filters?.dateFrom) result = result.filter((r) => r.date >= filters.dateFrom!);
    if (filters?.dateTo) result = result.filter((r) => r.date <= filters.dateTo!);
    return result;
  },
  getStats: (vehicleId?: string) => {
    const data = vehicleId ? fuelRecords.filter((r) => r.vehicleId === vehicleId) : fuelRecords;
    if (!data.length) return { avg: 0, max: 0, min: 0 };
    const consumptions = data.map((d) => d.consumptionLPer100Km);
    return {
      avg: Math.round((consumptions.reduce((a, b) => a + b, 0) / consumptions.length) * 10) / 10,
      max: Math.round(Math.max(...consumptions) * 10) / 10,
      min: Math.round(Math.min(...consumptions) * 10) / 10,
    };
  },
};

// ----- Alert Service -----
export const alertService = {
  getAll: (): Alert[] => alerts,
  getByVehicle: (vehicleId: string): Alert[] => alerts.filter((a) => a.vehicleId === vehicleId),
};
