# Estrategia de Integración CANBus / OBD-II (Fase 3)

La precisión del Dashboard de Combustible depende de la calidad de los datos. Pasar del cálculo estimado (GPS) a la medición real (CANBus) es el salto a "Enterprise".

## 1. Hardware y Protocolos
*   **Dispositivos Recomendados:**
    *   **Teltonika FMB140:** Soporte nativo CAN (LVCAN200).
    *   **Ruptela HCV5:** Lectura Heavy Duty (J1939).
*   **Protocolo de Transmisión:** Codec 8 Extended (Teltonika).
    *   IO ID 83: Fuel Level (Liters).
    *   IO ID 84: Engine RPM.
    *   IO ID 85: Total Mileage (Dashboard).

## 2. Ingesta de Datos (Edge Pipeline)
El script de ingesta (`telemetry-ingest`) debe actualizarse para parsear estos campos adicionales en el objeto `metadata`.

### Payload JSON Propuesto (desde Gateway)
```json
{
  "vehicle_id": "uuid...",
  "lat": 4.60,
  "lng": -74.08,
  "canbus": {
    "fuel_level_L": 45.2,
    "rpm": 1500,
    "engine_load_pct": 35,
    "coolant_temp_c": 82,
    "odometer_km": 120500
  }
}
```

## 3. Esquema de Base de Datos (Schema Update)
Aunque usamos `metadata` JSONB, para consultas analíticas rápidas (Dashboard), se recomienda promover campos críticos a columnas o usar Índices GIN en JSONB.

**SQL Schema Update (`vehicle_telemetry`):**
```sql
ALTER TABLE vehicle_telemetry 
ADD COLUMN fuel_level_liters FLOAT,
ADD COLUMN rpm INTEGER,
ADD COLUMN engine_load_pct FLOAT;

-- Indice para reportes rápidos
CREATE INDEX idx_telemetry_fuel ON vehicle_telemetry(vehicle_id, time) INCLUDE (fuel_level_liters);
```

**View para Dashboard:**
```sql
CREATE VIEW fuel_efficiency_daily AS
SELECT 
  vehicle_id,
  date_trunc('day', time) as day,
  MAX(odometer_km) - MIN(odometer_km) as km_driven,
  MAX(fuel_consumed_total) - MIN(fuel_consumed_total) as fuel_used,
  AVG(rpm) as avg_rpm
FROM vehicle_telemetry
GROUP BY 1, 2;
```

## 4. Detección de Robo (Logic)
*   **Regla:** Si `fuel_level` cae > 5% en < 2 minutos Y `speed` == 0.
*   **Acción:** Disparar Alerta "EXTRACCIÓN DE COMBUSTIBLE".
