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
  { id: "A006", vehicleId: "V001", plate: "NAR-123", type: "cold_chain", message: "Temperatura fuera de rango: 12°C (límite: -2°C a 8°C)", timestamp: "2026-02-11T14:30:00", severity: "high" },
  { id: "A007", vehicleId: "V003", plate: "NAR-789", type: "maintenance", message: "Mantenimiento preventivo programado en 200 km", timestamp: "2026-02-11T10:00:00", severity: "medium" },
  { id: "A008", vehicleId: "V004", plate: "PUT-321", type: "gnss_jamming", message: "Posible interferencia GNSS detectada", timestamp: "2026-02-11T08:45:00", severity: "high" },
];

// ---- DRIVERS ----
export interface Driver {
  id: string;
  name: string;
  cedula: string;
  license: string;
  licenseExpiry: string;
  phone: string;
  email: string;
  rating: number;
  totalTrips: number;
  totalKm: number;
  yearsExperience: number;
  status: "activo" | "inactivo" | "vacaciones";
  specializations: string[];
  vehicleAssigned?: string;
}

export const drivers: Driver[] = [
  {
    id: "D001",
    name: "Carlos Martínez",
    cedula: "12345678",
    license: "C2",
    licenseExpiry: "2027-06-15",
    phone: "+57 311 234 5678",
    email: "carlos.martinez@example.com",
    rating: 4.8,
    totalTrips: 1240,
    totalKm: 456230,
    yearsExperience: 15,
    status: "activo",
    specializations: ["Carga refrigerada", "Larga distancia"],
    vehicleAssigned: "V001"
  },
  {
    id: "D002",
    name: "María López",
    cedula: "23456789",
    license: "C3",
    licenseExpiry: "2026-11-20",
    phone: "+57 312 345 6789",
    email: "maria.lopez@example.com",
    rating: 4.9,
    totalTrips: 2150,
    totalKm: 820100,
    yearsExperience: 18,
    status: "activo",
    specializations: ["Tractomula", "Carga pesada"],
    vehicleAssigned: "V002"
  },
  {
    id: "D003",
    name: "Andrés Guerrero",
    cedula: "34567890",
    license: "C2",
    licenseExpiry: "2027-03-10",
    phone: "+57 313 456 7890",
    email: "andres.guerrero@example.com",
    rating: 4.6,
    totalTrips: 890,
    totalKm: 189450,
    yearsExperience: 12,
    status: "activo",
    specializations: ["Volqueta", "Construcción"],
    vehicleAssigned: "V003"
  },
  {
    id: "D004",
    name: "Jorge Erazo",
    cedula: "45678901",
    license: "C3",
    licenseExpiry: "2026-08-25",
    phone: "+57 314 567 8901",
    email: "jorge.erazo@example.com",
    rating: 4.5,
    totalTrips: 1560,
    totalKm: 410780,
    yearsExperience: 14,
    status: "activo",
    specializations: ["Carro tanque", "Materiales peligrosos"],
    vehicleAssigned: "V004"
  },
  {
    id: "D005",
    name: "Sandra Muñoz",
    cedula: "56789012",
    license: "C2",
    licenseExpiry: "2027-01-30",
    phone: "+57 315 678 9012",
    email: "sandra.munoz@example.com",
    rating: 4.7,
    totalTrips: 1020,
    totalKm: 278320,
    yearsExperience: 10,
    status: "vacaciones",
    specializations: ["Furgón", "Distribución urbana"],
    vehicleAssigned: "V005"
  },
];

// ---- PLATFORM STATISTICS ----
export interface PlatformStats {
  totalVehicles: number;
  activeVehicles: number;
  kmTraveledThisMonth: number;
  uptime: number;
  totalAlerts: number;
  resolvedAlerts: number;
  avgResponseTime: number;
  fuelSavings: number;
  co2Reduction: number;
}

export const platformStats: PlatformStats = {
  totalVehicles: 247,
  activeVehicles: 189,
  kmTraveledThisMonth: 2847650,
  uptime: 99.87,
  totalAlerts: 1456,
  resolvedAlerts: 1389,
  avgResponseTime: 4.2, // minutes
  fuelSavings: 18.5, // percentage
  co2Reduction: 145.8, // tons
};

// ---- TESTIMONIALS ----
export interface Testimonial {
  id: string;
  company: string;
  companyLogo?: string;
  person: string;
  position: string;
  text: string;
  rating: number;
  location: string;
  industry: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "T001",
    company: "Transportes Andinos S.A.S.",
    person: "Roberto Guerrero",
    position: "Gerente de Operaciones",
    text: "CELLVI ha transformado completamente nuestra operación. La trazabilidad en tiempo real y los reportes automáticos nos han permitido reducir costos operativos en un 23% y mejorar significativamente la satisfacción de nuestros clientes. El soporte técnico es excepcional.",
    rating: 5,
    location: "Pasto, Nariño",
    industry: "Transporte de carga refrigerada"
  },
  {
    id: "T002",
    company: "Logística del Sur",
    person: "Ana María Castillo",
    position: "Directora de Flota",
    text: "Implementamos CELLVI hace 8 meses y los resultados han superado nuestras expectativas. La integración con RNDC es perfecta, el módulo de mantenimiento predictivo nos ha ahorrado miles de dólares en reparaciones, y la app móvil facilita la comunicación con los conductores.",
    rating: 5,
    location: "Popayán, Cauca",
    industry: "Distribución last-mile"
  },
  {
    id: "T003",
    company: "Cooperativa de Transportadores Nariñenses",
    person: "Luis Fernando Córdoba",
    position: "Presidente",
    text: "Como cooperativa con 85 vehículos afiliados, necesitábamos una solución robusta y escalable. CELLVI nos ofrece exactamente eso: control total de la flota, reportes detallados para cada propietario, y un sistema de alertas que ha mejorado dramáticamente la seguridad de nuestras operaciones.",
    rating: 4.5,
    location: "Pasto, Nariño",
    industry: "Transporte de carga general"
  },
  {
    id: "T004",
    company: "Valores del Pacífico",
    person: "Patricia Rojas",
    position: "Jefe de Seguridad",
    text: "Para el transporte de valores, la seguridad es primordial. CELLVI nos brinda geofencing preciso, alertas instantáneas ante desvíos de ruta, y un sistema de evidencias que ha sido clave en nuestra certificación ISO. La inversión se recuperó en menos de 6 meses.",
    rating: 5,
    location: "Cali, Valle del Cauca",
    industry: "Transporte de valores"
  },
];

// ---- PRICING PLANS ----
export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxVehicles: number | "unlimited";
  features: string[];
  popular?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "basic",
    name: "Básico",
    description: "Ideal para pequeñas flotas",
    priceMonthly: 89000,
    priceYearly: 890000,
    currency: "COP",
    maxVehicles: 5,
    features: [
      "Rastreo GPS en tiempo real",
      "Alertas básicas (velocidad, geocercas)",
      "Reportes mensuales",
      "Histórico 30 días",
      "App móvil",
      "Soporte por email",
    ],
  },
  {
    id: "professional",
    name: "Profesional",
    description: "Para flotas en crecimiento",
    priceMonthly: 249000,
    priceYearly: 2490000,
    currency: "COP",
    maxVehicles: 25,
    features: [
      "Todo lo del plan Básico",
      "Alertas avanzadas (combustible, temperatura, GNSS)",
      "Mantenimiento predictivo",
      "Integración RNDC automática",
      "Reportes personalizados",
      "Histórico 6 meses",
      "API REST disponible",
      "Soporte prioritario 24/7",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Empresarial",
    description: "Solución completa para grandes flotas",
    priceMonthly: 599000,
    priceYearly: 5990000,
    currency: "COP",
    maxVehicles: "unlimited",
    features: [
      "Todo lo del plan Profesional",
      "Vehículos ilimitados",
      "Multi-tenancy (sub-cuentas)",
      "Certificación blockchain",
      "Dashboard ejecutivo personalizado",
      "Inteligencia artificial predictiva",
      "Integración ERP/SAP",
      "Histórico ilimitado",
      "Gerente de cuenta dedicado",
      "SLA 99.9% garantizado",
    ],
  },
];

// ---- USE CASES ----
export interface UseCase {
  id: string;
  title: string;
  description: string;
  industry: string;
  problem: string;
  solution: string;
  results: string[];
  icon: string;
  image?: string;
}

export const useCases: UseCase[] = [
  {
    id: "cold-chain",
    title: "Cadena de Frío",
    description: "Monitoreo continuo de temperatura para transporte refrigerado",
    industry: "Alimentos y farmacéuticos",
    problem: "Pérdida de producto por ruptura de cadena de frío sin detectar a tiempo",
    solution: "Sensores de temperatura integrados con alertas en tiempo real y certificación blockchain de cada viaje",
    results: [
      "99.8% de cumplimiento de temperatura",
      "Reducción del 85% en pérdida de producto",
      "Certificación automática para auditorías",
      "Alertas instantáneas ante desvíos"
    ],
    icon: "thermometer"
  },
  {
    id: "last-mile",
    title: "Distribución Last-Mile",
    description: "Optimización de rutas y entregas urbanas",
    industry: "E-commerce y retail",
    problem: "Rutas ineficientes, tiempos de entrega impredecibles, falta de visibilidad",
    solution: "Optimización de rutas con IA, geofencing por cliente, prueba de entrega digital",
    results: [
      "32% más entregas por día",
      "Reducción del 40% en tiempo de ruta",
      "95% entregas en ventana horaria",
      "Trazabilidad completa para clientes"
    ],
    icon: "truck"
  },
  {
    id: "security-transport",
    title: "Transporte de Valores",
    description: "Máxima seguridad y trazabilidad para cargas sensibles",
    industry: "Seguridad y valores",
    problem: "Necesidad de rastreo continuo, alertas ante desvíos, evidencias para seguros",
    solution: "Rastreo dual GPS/GNSS, detección de jamming, botón de pánico, evidencias certificadas",
    results: [
      "Cero incidentes sin detectar",
      "Tiempo de respuesta < 2 minutos",
      "Certificación blockchain de rutas",
      "Reducción 60% en primas de seguros"
    ],
    icon: "shield"
  },
  {
    id: "corporate-fleet",
    title: "Flotas Corporativas",
    description: "Control integral de vehículos empresariales",
    industry: "Empresas multi-sede",
    problem: "Uso personal de vehículos, alto consumo de combustible, falta de control",
    solution: "Geofencing horario, control de combustible, reportes de uso por conductor",
    results: [
      "Reducción 45% en uso no autorizado",
      "Ahorro 28% en combustible",
      "Control de jornadas laborales",
      "Reportes ejecutivos automatizados"
    ],
    icon: "building"
  },
];

// ---- HELPER FUNCTIONS ----
export const formatCurrency = (value: number, currency: string = "COP"): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("es-CO").format(value);
};

export const formatKm = (km: number): string => {
  if (km >= 1000000) {
    return `${(km / 1000000).toFixed(1)}M km`;
  } else if (km >= 1000) {
    return `${(km / 1000).toFixed(1)}K km`;
  }
  return `${km} km`;
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Generate realistic telemetry data for charts
export const generateTelemetryData = (days: number = 30) => {
  const data = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().split('T')[0],
      distanceKm: Math.floor(8000 + Math.random() * 4000),
      fuelLiters: Math.floor(1500 + Math.random() * 800),
      alerts: Math.floor(Math.random() * 15),
      avgSpeed: Math.floor(60 + Math.random() * 20),
      activeVehicles: Math.floor(180 + Math.random() * 30),
    });
  }

  return data;
};
