// ===== DEMO DATA LAYER =====
// Structured mock data with fixed seed for consistency.
// Replace with API calls when backend is ready.

export interface Vehicle {
  id: string;
  plate: string;
  driver: string;
  type: string;
  status: "activo" | "detenido" | "alerta" | "apagado";
  speed: number;
  fuel: number;
  battery: number;
  signal: number;
  lat: number;
  lng: number;
  lastUpdate: string;
  route: string;
  engineOn: boolean;
  locked: boolean;
  km: number;
}

export interface RouteRecord {
  id: string;
  vehicleId: string;
  plate: string;
  date: string;
  origin: string;
  destination: string;
  distanceKm: number;
  durationMin: number;
  stops: number;
  events: RouteEvent[];
  fuelUsedL: number;
}

export interface RouteEvent {
  time: string;
  type: "start" | "stop" | "speeding" | "geofence_enter" | "geofence_exit" | "fuel_drop" | "end";
  description: string;
  lat: number;
  lng: number;
}

export interface Geofence {
  id: string;
  name: string;
  type: "circle" | "polygon";
  active: boolean;
  lat: number;
  lng: number;
  radiusM: number;
  createdAt: string;
}

export interface FuelRecord {
  date: string;
  vehicleId: string;
  plate: string;
  consumptionLPer100Km: number;
  totalLiters: number;
  distanceKm: number;
}

export interface Alert {
  id: string;
  vehicleId: string;
  plate: string;
  type: string;
  message: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
}

// ---- VEHICLES ----
export const vehicles: Vehicle[] = [
  { id: "V001", plate: "NAR-123", driver: "Carlos Martínez", type: "Camión", status: "activo", speed: 72, fuel: 68, battery: 95, signal: 4, lat: 1.2136, lng: -77.2811, lastUpdate: "Hace 30s", route: "Pasto → Cali", engineOn: true, locked: false, km: 145230 },
  { id: "V002", plate: "NAR-456", driver: "María López", type: "Tractomula", status: "activo", speed: 85, fuel: 45, battery: 88, signal: 3, lat: 2.4419, lng: -76.6067, lastUpdate: "Hace 1m", route: "Popayán → Pasto", engineOn: true, locked: false, km: 320100 },
  { id: "V003", plate: "NAR-789", driver: "Andrés Guerrero", type: "Volqueta", status: "detenido", speed: 0, fuel: 82, battery: 92, signal: 5, lat: 1.6144, lng: -77.0857, lastUpdate: "Hace 5m", route: "La Unión → Pasto", engineOn: false, locked: true, km: 89450 },
  { id: "V004", plate: "PUT-321", driver: "Jorge Erazo", type: "Carro Tanque", status: "alerta", speed: 110, fuel: 30, battery: 75, signal: 2, lat: 1.8528, lng: -76.0467, lastUpdate: "Hace 15s", route: "Mocoa → Neiva", engineOn: true, locked: false, km: 210780 },
  { id: "V005", plate: "CAU-654", driver: "Sandra Muñoz", type: "Furgón", status: "apagado", speed: 0, fuel: 55, battery: 60, signal: 0, lat: 3.4516, lng: -76.532, lastUpdate: "Hace 2h", route: "Cali (estacionado)", engineOn: false, locked: true, km: 178320 },
  { id: "V006", plate: "NAR-987", driver: "Luis Córdoba", type: "Bus", status: "activo", speed: 60, fuel: 72, battery: 98, signal: 5, lat: 0.8614, lng: -77.6711, lastUpdate: "Hace 45s", route: "Ipiales → Pasto", engineOn: true, locked: false, km: 456120 },
];

// ---- ROUTES ----
export const routeRecords: RouteRecord[] = [
  {
    id: "R001", vehicleId: "V001", plate: "NAR-123", date: "2026-02-10", origin: "Pasto", destination: "Cali",
    distanceKm: 420, durationMin: 540, stops: 3, fuelUsedL: 84,
    events: [
      { time: "05:00", type: "start", description: "Salida de Pasto", lat: 1.2136, lng: -77.2811 },
      { time: "07:30", type: "stop", description: "Parada en La Unión (30 min)", lat: 1.6144, lng: -77.0857 },
      { time: "09:15", type: "speeding", description: "Exceso velocidad: 115 km/h", lat: 2.0, lng: -76.8 },
      { time: "10:00", type: "geofence_enter", description: "Ingreso geocerca Popayán", lat: 2.4419, lng: -76.6067 },
      { time: "12:00", type: "fuel_drop", description: "Caída combustible -15%", lat: 2.8, lng: -76.5 },
      { time: "14:00", type: "end", description: "Llegada a Cali", lat: 3.4516, lng: -76.532 },
    ],
  },
  {
    id: "R002", vehicleId: "V002", plate: "NAR-456", date: "2026-02-10", origin: "Popayán", destination: "Pasto",
    distanceKm: 285, durationMin: 390, stops: 2, fuelUsedL: 71,
    events: [
      { time: "06:00", type: "start", description: "Salida de Popayán", lat: 2.4419, lng: -76.6067 },
      { time: "08:45", type: "stop", description: "Peaje Chachagüí", lat: 1.35, lng: -77.28 },
      { time: "12:30", type: "end", description: "Llegada a Pasto", lat: 1.2136, lng: -77.2811 },
    ],
  },
  {
    id: "R003", vehicleId: "V004", plate: "PUT-321", date: "2026-02-09", origin: "Mocoa", destination: "Neiva",
    distanceKm: 310, durationMin: 480, stops: 4, fuelUsedL: 93,
    events: [
      { time: "04:30", type: "start", description: "Salida de Mocoa", lat: 1.1494, lng: -76.6468 },
      { time: "06:00", type: "speeding", description: "Exceso velocidad: 120 km/h", lat: 1.5, lng: -76.3 },
      { time: "08:00", type: "geofence_exit", description: "Salida geocerca Putumayo", lat: 1.8, lng: -76.1 },
      { time: "12:30", type: "end", description: "Llegada a Neiva", lat: 2.9273, lng: -75.2819 },
    ],
  },
  {
    id: "R004", vehicleId: "V006", plate: "NAR-987", date: "2026-02-11", origin: "Ipiales", destination: "Pasto",
    distanceKm: 80, durationMin: 120, stops: 1, fuelUsedL: 24,
    events: [
      { time: "07:00", type: "start", description: "Salida de Ipiales", lat: 0.8614, lng: -77.6711 },
      { time: "08:00", type: "stop", description: "Parada técnica", lat: 1.0, lng: -77.5 },
      { time: "09:00", type: "end", description: "Llegada a Pasto", lat: 1.2136, lng: -77.2811 },
    ],
  },
];

// ---- GEOFENCES ----
export const geofences: Geofence[] = [
  { id: "G001", name: "Base Pasto", type: "circle", active: true, lat: 1.2136, lng: -77.2811, radiusM: 500, createdAt: "2025-12-01" },
  { id: "G002", name: "Zona Industrial Cali", type: "circle", active: true, lat: 3.4516, lng: -76.532, radiusM: 1000, createdAt: "2025-12-15" },
  { id: "G003", name: "Terminal Popayán", type: "circle", active: false, lat: 2.4419, lng: -76.6067, radiusM: 300, createdAt: "2026-01-10" },
  { id: "G004", name: "Frontera Ipiales", type: "polygon", active: true, lat: 0.8614, lng: -77.6711, radiusM: 2000, createdAt: "2026-01-20" },
  { id: "G005", name: "Peaje Chachagüí", type: "circle", active: true, lat: 1.35, lng: -77.28, radiusM: 200, createdAt: "2026-02-01" },
];

// ---- FUEL DATA (daily) ----
const generateFuelData = (): FuelRecord[] => {
  const records: FuelRecord[] = [];
  const vIds = ["V001", "V002", "V004", "V006"];
  const plates: Record<string, string> = { V001: "NAR-123", V002: "NAR-456", V004: "PUT-321", V006: "NAR-987" };
  for (let d = 0; d < 30; d++) {
    const date = new Date(2026, 0, 13 + d);
    const dateStr = date.toISOString().split("T")[0];
    for (const vid of vIds) {
      const base = vid === "V004" ? 32 : vid === "V002" ? 28 : vid === "V006" ? 22 : 20;
      const consumption = base + (Math.sin(d * 0.7 + vIds.indexOf(vid)) * 5);
      const distance = 150 + Math.sin(d * 0.5) * 80;
      records.push({
        date: dateStr,
        vehicleId: vid,
        plate: plates[vid],
        consumptionLPer100Km: Math.round(consumption * 10) / 10,
        totalLiters: Math.round(consumption * distance / 100),
        distanceKm: Math.round(distance),
      });
    }
  }
  return records;
};

export const fuelRecords: FuelRecord[] = generateFuelData();

// ---- ALERTS ----
export const alerts: Alert[] = [
  { id: "A001", vehicleId: "V004", plate: "PUT-321", type: "speeding", message: "Exceso de velocidad: 110 km/h (límite: 80)", timestamp: "2026-02-11T08:15:00", severity: "high" },
  { id: "A002", vehicleId: "V004", plate: "PUT-321", type: "fuel", message: "Combustible bajo: 30%", timestamp: "2026-02-11T07:45:00", severity: "medium" },
  { id: "A003", vehicleId: "V001", plate: "NAR-123", type: "geofence", message: "Salida de geocerca: Base Pasto", timestamp: "2026-02-10T05:02:00", severity: "low" },
  { id: "A004", vehicleId: "V005", plate: "CAU-654", type: "battery", message: "Batería baja: 60%", timestamp: "2026-02-10T22:00:00", severity: "medium" },
  { id: "A005", vehicleId: "V002", plate: "NAR-456", type: "speeding", message: "Exceso de velocidad: 95 km/h (límite: 80)", timestamp: "2026-02-10T09:30:00", severity: "high" },
];
