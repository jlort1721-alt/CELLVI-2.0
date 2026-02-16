// ── Cold Chain Enterprise Data Model ─────────────────────────────────
// Comprehensive types and mock data for pharmaceutical/food cold chain monitoring

export type UnitStatus = "normal" | "warning" | "critical" | "offline";
export type CargoClassification = "pharma" | "frozen" | "refrigerated" | "ambient-controlled";
export type ComplianceStandard = "GDP" | "HACCP" | "WHO-PQS" | "INVIMA" | "RNDC";
export type AlertSeverity = "info" | "warning" | "critical";
export type SensorType = "BLE" | "RS485" | "1-Wire" | "IoT-LTE";

export interface ColdChainUnit {
  id: string;
  vehiclePlate: string;
  cargoType: string;
  cargoClassification: CargoClassification;
  targetTempMin: number;
  targetTempMax: number;
  currentTemp: number;
  humidity: number;
  status: UnitStatus;
  sensorId: string;
  sensorType: SensorType;
  sensorBattery: number;
  lastUpdated: string;
  tripId: string;
  origin: string;
  destination: string;
  driverName: string;
  driverPhone: string;
  eta: string;
  progressPercent: number;
  doorOpenCount: number;
  complianceScore: number;
  complianceStandards: ComplianceStandard[];
  totalDeviations24h: number;
  maxDeviation24h: number;
  lat: number;
  lng: number;
  compartments: number;
  lastCalibration: string;
  nextCalibration: string;
}

export interface TempReading {
  timestamp: string;
  temp: number;
  humidity: number;
  doorOpen: boolean;
  batteryLevel: number;
  signalStrength: number;
}

export interface ColdChainAlert {
  id: string;
  unitId: string;
  vehiclePlate: string;
  severity: AlertSeverity;
  type: "temp_high" | "temp_low" | "humidity" | "door_open" | "battery_low" | "sensor_offline" | "calibration_due" | "deviation" | "checkpoint";
  message: string;
  timestamp: string;
  acknowledged: boolean;
  value?: number;
  threshold?: number;
}

export interface ComplianceRecord {
  id: string;
  unitId: string;
  tripId: string;
  standard: ComplianceStandard;
  status: "compliant" | "non_compliant" | "pending_review";
  score: number;
  deviations: number;
  auditDate: string;
  expiresAt: string;
  certNumber: string;
}

export interface ColdChainEvent {
  id: string;
  unitId: string;
  type: "departure" | "arrival" | "door_open" | "door_close" | "temp_deviation" | "checkpoint" | "refuel" | "inspection" | "calibration";
  timestamp: string;
  description: string;
  lat?: number;
  lng?: number;
}

// ── Mock Data ─────────────────────────────────────────────────────────

export const coldChainUnits: ColdChainUnit[] = [
  {
    id: "cc-1", vehiclePlate: "PUT-321", cargoType: "Medicamentos", cargoClassification: "pharma",
    targetTempMin: 2, targetTempMax: 8, currentTemp: 5.2, humidity: 45, status: "normal",
    sensorId: "BLE-001", sensorType: "BLE", sensorBattery: 92, lastUpdated: "2026-02-16T14:30:00",
    tripId: "T-001", origin: "Bogotá", destination: "Cali",
    driverName: "Carlos Mendoza", driverPhone: "+57 310 555 1234", eta: "2026-02-16T22:00:00",
    progressPercent: 68, doorOpenCount: 2, complianceScore: 98.5,
    complianceStandards: ["GDP", "INVIMA", "RNDC"], totalDeviations24h: 1, maxDeviation24h: 0.3,
    lat: 3.4516, lng: -76.5320, compartments: 2, lastCalibration: "2026-01-15", nextCalibration: "2026-04-15",
  },
  {
    id: "cc-2", vehiclePlate: "NAR-123", cargoType: "Congelados", cargoClassification: "frozen",
    targetTempMin: -20, targetTempMax: -16, currentTemp: -17.8, humidity: 30, status: "normal",
    sensorId: "BLE-002", sensorType: "BLE", sensorBattery: 85, lastUpdated: "2026-02-16T14:28:00",
    tripId: "T-002", origin: "Pasto", destination: "Popayán",
    driverName: "Miguel Torres", driverPhone: "+57 312 555 5678", eta: "2026-02-16T18:30:00",
    progressPercent: 45, doorOpenCount: 1, complianceScore: 99.1,
    complianceStandards: ["HACCP", "INVIMA"], totalDeviations24h: 0, maxDeviation24h: 0,
    lat: 2.4419, lng: -76.6061, compartments: 1, lastCalibration: "2026-02-01", nextCalibration: "2026-05-01",
  },
  {
    id: "cc-3", vehiclePlate: "CAU-654", cargoType: "Lácteos", cargoClassification: "refrigerated",
    targetTempMin: 0, targetTempMax: 4, currentTemp: 3.9, humidity: 55, status: "warning",
    sensorId: "RS485-001", sensorType: "RS485", sensorBattery: 78, lastUpdated: "2026-02-16T14:25:00",
    tripId: "T-003", origin: "Popayán", destination: "Cali",
    driverName: "Ana Rodríguez", driverPhone: "+57 315 555 9012", eta: "2026-02-16T17:15:00",
    progressPercent: 72, doorOpenCount: 4, complianceScore: 91.2,
    complianceStandards: ["HACCP", "INVIMA", "RNDC"], totalDeviations24h: 3, maxDeviation24h: 1.1,
    lat: 2.8266, lng: -76.5524, compartments: 1, lastCalibration: "2025-12-20", nextCalibration: "2026-03-20",
  },
  {
    id: "cc-4", vehiclePlate: "NAR-456", cargoType: "Vacunas", cargoClassification: "pharma",
    targetTempMin: 2, targetTempMax: 8, currentTemp: 9.1, humidity: 60, status: "critical",
    sensorId: "BLE-003", sensorType: "BLE", sensorBattery: 45, lastUpdated: "2026-02-16T14:20:00",
    tripId: "T-004", origin: "Ipiales", destination: "Pasto",
    driverName: "Jorge Castillo", driverPhone: "+57 318 555 3456", eta: "2026-02-16T16:45:00",
    progressPercent: 55, doorOpenCount: 6, complianceScore: 72.8,
    complianceStandards: ["GDP", "WHO-PQS", "INVIMA"], totalDeviations24h: 8, maxDeviation24h: 2.3,
    lat: 1.2136, lng: -77.2811, compartments: 3, lastCalibration: "2025-11-10", nextCalibration: "2026-02-10",
  },
  {
    id: "cc-5", vehiclePlate: "VAL-789", cargoType: "Flores", cargoClassification: "refrigerated",
    targetTempMin: 1, targetTempMax: 4, currentTemp: 2.5, humidity: 70, status: "normal",
    sensorId: "1W-001", sensorType: "1-Wire", sensorBattery: 100, lastUpdated: "2026-02-16T14:32:00",
    tripId: "T-005", origin: "Cali", destination: "Buenaventura",
    driverName: "Luis Martínez", driverPhone: "+57 320 555 7890", eta: "2026-02-16T16:00:00",
    progressPercent: 82, doorOpenCount: 0, complianceScore: 99.8,
    complianceStandards: ["HACCP"], totalDeviations24h: 0, maxDeviation24h: 0,
    lat: 3.8801, lng: -77.0311, compartments: 1, lastCalibration: "2026-01-28", nextCalibration: "2026-04-28",
  },
  {
    id: "cc-6", vehiclePlate: "BOG-101", cargoType: "Insulina", cargoClassification: "pharma",
    targetTempMin: 2, targetTempMax: 8, currentTemp: 4.8, humidity: 42, status: "normal",
    sensorId: "IoT-001", sensorType: "IoT-LTE", sensorBattery: 97, lastUpdated: "2026-02-16T14:33:00",
    tripId: "T-006", origin: "Bogotá", destination: "Medellín",
    driverName: "Patricia Gómez", driverPhone: "+57 311 555 2345", eta: "2026-02-16T20:30:00",
    progressPercent: 35, doorOpenCount: 1, complianceScore: 99.5,
    complianceStandards: ["GDP", "WHO-PQS", "INVIMA", "RNDC"], totalDeviations24h: 0, maxDeviation24h: 0,
    lat: 5.7110, lng: -74.5130, compartments: 2, lastCalibration: "2026-02-05", nextCalibration: "2026-05-05",
  },
  {
    id: "cc-7", vehiclePlate: "ANT-222", cargoType: "Hemoderivados", cargoClassification: "pharma",
    targetTempMin: -30, targetTempMax: -25, currentTemp: -27.3, humidity: 20, status: "normal",
    sensorId: "IoT-002", sensorType: "IoT-LTE", sensorBattery: 88, lastUpdated: "2026-02-16T14:31:00",
    tripId: "T-007", origin: "Medellín", destination: "Barranquilla",
    driverName: "Fernando Restrepo", driverPhone: "+57 314 555 6789", eta: "2026-02-17T06:00:00",
    progressPercent: 22, doorOpenCount: 0, complianceScore: 100,
    complianceStandards: ["GDP", "WHO-PQS", "INVIMA"], totalDeviations24h: 0, maxDeviation24h: 0,
    lat: 7.8832, lng: -75.5130, compartments: 1, lastCalibration: "2026-02-10", nextCalibration: "2026-05-10",
  },
  {
    id: "cc-8", vehiclePlate: "SAN-333", cargoType: "Mariscos", cargoClassification: "frozen",
    targetTempMin: -18, targetTempMax: -15, currentTemp: -14.2, humidity: 35, status: "warning",
    sensorId: "RS485-002", sensorType: "RS485", sensorBattery: 62, lastUpdated: "2026-02-16T14:18:00",
    tripId: "T-008", origin: "Santa Marta", destination: "Cartagena",
    driverName: "Roberto Díaz", driverPhone: "+57 316 555 0123", eta: "2026-02-16T17:00:00",
    progressPercent: 60, doorOpenCount: 3, complianceScore: 88.4,
    complianceStandards: ["HACCP", "INVIMA"], totalDeviations24h: 4, maxDeviation24h: 1.8,
    lat: 10.9685, lng: -74.7813, compartments: 2, lastCalibration: "2025-12-15", nextCalibration: "2026-03-15",
  },
];

export const coldChainAlerts: ColdChainAlert[] = [
  { id: "a-1", unitId: "cc-4", vehiclePlate: "NAR-456", severity: "critical", type: "temp_high", message: "Temperatura supera límite máximo en compartimento de vacunas", timestamp: "2026-02-16T14:18:00", acknowledged: false, value: 9.1, threshold: 8 },
  { id: "a-2", unitId: "cc-4", vehiclePlate: "NAR-456", severity: "critical", type: "door_open", message: "Puerta abierta por más de 5 minutos — ruta de vacunas", timestamp: "2026-02-16T14:10:00", acknowledged: false },
  { id: "a-3", unitId: "cc-3", vehiclePlate: "CAU-654", severity: "warning", type: "temp_high", message: "Temperatura acercándose al límite superior (3.9°C / 4°C máx)", timestamp: "2026-02-16T14:25:00", acknowledged: false, value: 3.9, threshold: 4 },
  { id: "a-4", unitId: "cc-8", vehiclePlate: "SAN-333", severity: "warning", type: "temp_high", message: "Temperatura por encima del rango (-14.2°C / -15°C máx)", timestamp: "2026-02-16T14:15:00", acknowledged: false, value: -14.2, threshold: -15 },
  { id: "a-5", unitId: "cc-4", vehiclePlate: "NAR-456", severity: "warning", type: "battery_low", message: "Batería del sensor BLE-003 al 45%", timestamp: "2026-02-16T13:50:00", acknowledged: true, value: 45, threshold: 50 },
  { id: "a-6", unitId: "cc-8", vehiclePlate: "SAN-333", severity: "warning", type: "battery_low", message: "Batería del sensor RS485-002 al 62%", timestamp: "2026-02-16T13:30:00", acknowledged: true, value: 62, threshold: 70 },
  { id: "a-7", unitId: "cc-4", vehiclePlate: "NAR-456", severity: "critical", type: "calibration_due", message: "Calibración vencida desde 2026-02-10 — vehículo de vacunas", timestamp: "2026-02-16T08:00:00", acknowledged: false },
  { id: "a-8", unitId: "cc-3", vehiclePlate: "CAU-654", severity: "info", type: "door_open", message: "Apertura de puerta registrada en punto de entrega Cali", timestamp: "2026-02-16T12:45:00", acknowledged: true },
  { id: "a-9", unitId: "cc-1", vehiclePlate: "PUT-321", severity: "info", type: "checkpoint", message: "Checkpoint de verificación completado correctamente", timestamp: "2026-02-16T11:30:00", acknowledged: true },
  { id: "a-10", unitId: "cc-8", vehiclePlate: "SAN-333", severity: "warning", type: "humidity", message: "Humedad por encima del 30% en compartimento de mariscos congelados", timestamp: "2026-02-16T13:00:00", acknowledged: false, value: 35, threshold: 30 },
];

export const complianceRecords: ComplianceRecord[] = [
  { id: "cr-1", unitId: "cc-1", tripId: "T-001", standard: "GDP", status: "compliant", score: 98.5, deviations: 1, auditDate: "2026-02-15", expiresAt: "2026-08-15", certNumber: "GDP-COL-2026-001" },
  { id: "cr-2", unitId: "cc-1", tripId: "T-001", standard: "INVIMA", status: "compliant", score: 97.2, deviations: 2, auditDate: "2026-02-10", expiresAt: "2026-08-10", certNumber: "INV-2026-4521" },
  { id: "cr-3", unitId: "cc-2", tripId: "T-002", standard: "HACCP", status: "compliant", score: 99.1, deviations: 0, auditDate: "2026-02-12", expiresAt: "2026-08-12", certNumber: "HACCP-2026-112" },
  { id: "cr-4", unitId: "cc-4", tripId: "T-004", standard: "GDP", status: "non_compliant", score: 72.8, deviations: 8, auditDate: "2026-02-16", expiresAt: "2026-02-16", certNumber: "GDP-COL-2026-004" },
  { id: "cr-5", unitId: "cc-4", tripId: "T-004", standard: "WHO-PQS", status: "non_compliant", score: 68.5, deviations: 12, auditDate: "2026-02-16", expiresAt: "2026-02-16", certNumber: "WHO-PQS-2026-004" },
  { id: "cr-6", unitId: "cc-6", tripId: "T-006", standard: "GDP", status: "compliant", score: 99.5, deviations: 0, auditDate: "2026-02-14", expiresAt: "2026-08-14", certNumber: "GDP-COL-2026-006" },
  { id: "cr-7", unitId: "cc-7", tripId: "T-007", standard: "WHO-PQS", status: "compliant", score: 100, deviations: 0, auditDate: "2026-02-13", expiresAt: "2026-08-13", certNumber: "WHO-PQS-2026-007" },
  { id: "cr-8", unitId: "cc-5", tripId: "T-005", standard: "HACCP", status: "compliant", score: 99.8, deviations: 0, auditDate: "2026-02-11", expiresAt: "2026-08-11", certNumber: "HACCP-2026-505" },
  { id: "cr-9", unitId: "cc-8", tripId: "T-008", standard: "HACCP", status: "pending_review", score: 88.4, deviations: 4, auditDate: "2026-02-16", expiresAt: "2026-03-16", certNumber: "HACCP-2026-808" },
  { id: "cr-10", unitId: "cc-3", tripId: "T-003", standard: "INVIMA", status: "pending_review", score: 91.2, deviations: 3, auditDate: "2026-02-16", expiresAt: "2026-03-16", certNumber: "INV-2026-3003" },
];

export const coldChainEvents: ColdChainEvent[] = [
  { id: "ev-1", unitId: "cc-4", type: "departure", timestamp: "2026-02-16T08:00:00", description: "Salida desde centro de distribución Ipiales", lat: 0.8316, lng: -77.6445 },
  { id: "ev-2", unitId: "cc-4", type: "inspection", timestamp: "2026-02-16T08:05:00", description: "Inspección preoperacional completada — sensor verificado" },
  { id: "ev-3", unitId: "cc-4", type: "door_open", timestamp: "2026-02-16T10:30:00", description: "Apertura de puerta — entrega parcial en Túquerres", lat: 1.0872, lng: -77.6197 },
  { id: "ev-4", unitId: "cc-4", type: "door_close", timestamp: "2026-02-16T10:35:00", description: "Puerta cerrada — temperatura verificada" },
  { id: "ev-5", unitId: "cc-4", type: "temp_deviation", timestamp: "2026-02-16T12:15:00", description: "Desviación de temperatura detectada: +1.1°C sobre el límite" },
  { id: "ev-6", unitId: "cc-4", type: "door_open", timestamp: "2026-02-16T13:45:00", description: "Apertura de puerta prolongada — más de 5 minutos" },
  { id: "ev-7", unitId: "cc-4", type: "temp_deviation", timestamp: "2026-02-16T14:18:00", description: "ALERTA CRÍTICA: temperatura 9.1°C (máx: 8°C)" },
  { id: "ev-8", unitId: "cc-1", type: "departure", timestamp: "2026-02-16T06:00:00", description: "Salida desde Bogotá — destino Cali" },
  { id: "ev-9", unitId: "cc-1", type: "checkpoint", timestamp: "2026-02-16T11:30:00", description: "Checkpoint Ibagué — temperatura verificada OK" },
  { id: "ev-10", unitId: "cc-1", type: "refuel", timestamp: "2026-02-16T12:00:00", description: "Recarga de combustible — Armenia" },
];

// ── Data Generation ───────────────────────────────────────────────────

export const generateTempHistory = (unit: ColdChainUnit): TempReading[] => {
  const readings: TempReading[] = [];
  const now = new Date();
  const avgTemp = (unit.targetTempMin + unit.targetTempMax) / 2;
  for (let i = 48; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 30 * 60000);
    const drift = Math.sin(i / 5) * 1.5 + (Math.random() - 0.5) * 0.8;
    const temp = parseFloat((avgTemp + drift + (unit.status === "critical" ? 3 : 0)).toFixed(1));
    readings.push({
      timestamp: t.toISOString(),
      temp,
      humidity: Math.round(unit.humidity + (Math.random() - 0.5) * 10),
      doorOpen: i === 20 || i === 35,
      batteryLevel: Math.max(40, unit.sensorBattery - Math.floor(i * 0.3)),
      signalStrength: Math.min(100, Math.max(20, 75 + Math.floor((Math.random() - 0.5) * 30))),
    });
  }
  return readings;
};

// ── Computed Helpers ──────────────────────────────────────────────────

export const getColdChainStats = () => {
  const total = coldChainUnits.length;
  const normal = coldChainUnits.filter(u => u.status === "normal").length;
  const warning = coldChainUnits.filter(u => u.status === "warning").length;
  const critical = coldChainUnits.filter(u => u.status === "critical").length;
  const offline = coldChainUnits.filter(u => u.status === "offline").length;
  const avgCompliance = coldChainUnits.reduce((sum, u) => sum + u.complianceScore, 0) / total;
  const totalDeviations = coldChainUnits.reduce((sum, u) => sum + u.totalDeviations24h, 0);
  const pharmaUnits = coldChainUnits.filter(u => u.cargoClassification === "pharma").length;
  const avgTemp = coldChainUnits.reduce((sum, u) => sum + u.currentTemp, 0) / total;
  const unacknowledgedAlerts = coldChainAlerts.filter(a => !a.acknowledged).length;
  const criticalAlerts = coldChainAlerts.filter(a => a.severity === "critical" && !a.acknowledged).length;
  const avgBattery = coldChainUnits.reduce((sum, u) => sum + u.sensorBattery, 0) / total;
  const slaFulfillment = (normal / total) * 100;

  return {
    total, normal, warning, critical, offline,
    avgCompliance: parseFloat(avgCompliance.toFixed(1)),
    totalDeviations, pharmaUnits, avgTemp: parseFloat(avgTemp.toFixed(1)),
    unacknowledgedAlerts, criticalAlerts,
    avgBattery: Math.round(avgBattery),
    slaFulfillment: parseFloat(slaFulfillment.toFixed(1)),
  };
};
