export interface ColdChainUnit {
  id: string;
  vehiclePlate: string;
  cargoType: string;
  targetTempMin: number;
  targetTempMax: number;
  currentTemp: number;
  humidity: number;
  status: "normal" | "warning" | "critical";
  sensorId: string;
  lastUpdated: string;
  tripId: string;
  origin: string;
  destination: string;
}

export interface TempReading {
  timestamp: string;
  temp: number;
  humidity: number;
  doorOpen: boolean;
}

export const coldChainUnits: ColdChainUnit[] = [
  { id: "cc-1", vehiclePlate: "PUT-321", cargoType: "Medicamentos", targetTempMin: 2, targetTempMax: 8, currentTemp: 5.2, humidity: 45, status: "normal", sensorId: "BLE-001", lastUpdated: "2026-02-11T14:30:00", tripId: "T-001", origin: "Bogotá", destination: "Cali" },
  { id: "cc-2", vehiclePlate: "NAR-123", cargoType: "Congelados", targetTempMin: -20, targetTempMax: -16, currentTemp: -17.8, humidity: 30, status: "normal", sensorId: "BLE-002", lastUpdated: "2026-02-11T14:28:00", tripId: "T-002", origin: "Pasto", destination: "Popayán" },
  { id: "cc-3", vehiclePlate: "CAU-654", cargoType: "Lácteos", targetTempMin: 0, targetTempMax: 4, currentTemp: 3.9, humidity: 55, status: "warning", sensorId: "RS485-001", lastUpdated: "2026-02-11T14:25:00", tripId: "T-003", origin: "Popayán", destination: "Cali" },
  { id: "cc-4", vehiclePlate: "NAR-456", cargoType: "Vacunas", targetTempMin: 2, targetTempMax: 8, currentTemp: 9.1, humidity: 60, status: "critical", sensorId: "BLE-003", lastUpdated: "2026-02-11T14:20:00", tripId: "T-004", origin: "Ipiales", destination: "Pasto" },
  { id: "cc-5", vehiclePlate: "VAL-789", cargoType: "Flores", targetTempMin: 1, targetTempMax: 4, currentTemp: 2.5, humidity: 70, status: "normal", sensorId: "1W-001", lastUpdated: "2026-02-11T14:32:00", tripId: "T-005", origin: "Cali", destination: "Buenaventura" },
];

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
    });
  }
  return readings;
};
