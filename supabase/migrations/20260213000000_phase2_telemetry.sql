-- MIGRACIÓN FASE 2: TELEMETRÍA GEOESPACIAL (IOT)
-- Objetivo: Estructura optimizada para Big Data de Geolocalización (Time-Series)

-- 1. Extensiones Geoespaciales
-- Intentar habilitar PostGIS. Si falla en local, el resto de la tabla funciona con lat/long crudos.
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Tabla Maestra de Telemetría (Hot Data)
-- No usa 'id' serial porque en IoT el identificador es (vehicle_id, time).
CREATE TABLE IF NOT EXISTS public.vehicle_telemetry (
    time TIMESTAMPTZ NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    
    -- Datos Crudos
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION DEFAULT 0, -- km/h
    heading DOUBLE PRECISION DEFAULT 0, -- 0-360 grados
    altitude DOUBLE PRECISION,
    accuracy DOUBLE PRECISION, -- metros (dilución de precisión)
    
    -- Contexto Operativo
    metadata JSONB DEFAULT '{}'::jsonb, -- { battery_level, satellites, cellular_signal, ignition_status }
    events JSONB DEFAULT '[]'::jsonb,   -- [{ type: 'HARSH_BRAKING', value: 0.8 }, { type: 'GEOFENCE_EXIT', zone: 'BOGOTA' }]

    -- Columna Geoespacial Calculada (Automática para PostGIS)
    -- Si PostGIS falla, esta columna será ignorada o fallará la creación (en ese caso, comentar).
    location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED
);

-- Convertir en Hipertabla (si TimescaleDB estuviera activo) -> SELECT create_hypertable('vehicle_telemetry', 'time');
-- Como es Postgres estándar por defecto, usamos particionamiento manual si crece > 10M filas.

-- 3. Índices de Alto Rendimiento (Query Patterns)
-- Patrón A: "Dónde estuvo el vehículo X ayer?"
CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_time ON public.vehicle_telemetry (vehicle_id, time DESC);

-- Patrón B: "Qué vehículos están en esta zona ahora?" (Última posición suele consultarse en 'vehicles', no aquí, pero útil para análisis histórico)
CREATE INDEX IF NOT EXISTS idx_telemetry_location ON public.vehicle_telemetry USING GIST (location);

-- Patrón C: Limpieza por TTL (Time To Live)
CREATE INDEX IF NOT EXISTS idx_telemetry_time_only ON public.vehicle_telemetry (time);

-- 4. Actualización de Última Posición (Snapshot en Tabla Vehicles)
-- Mejora el rendimiento de "Mapa en Vivo" evitando scanear la tabla gigante de telemetría.
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS last_location JSONB, -- { lat, lng, speed, time, address }
ADD COLUMN IF NOT EXISTS last_status TEXT DEFAULT 'offline'; -- 'moving', 'stopped', 'offline'

-- Trigger para mantener el Snapshot actualizado
CREATE OR REPLACE FUNCTION public.update_vehicle_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.vehicles 
    SET 
        last_location = jsonb_build_object(
            'lat', NEW.latitude,
            'lng', NEW.longitude,
            'speed', NEW.speed,
            'heading', NEW.heading,
            'time', NEW.time
        ),
        last_status = CASE 
            WHEN (NEW.time < NOW() - INTERVAL '10 minutes') THEN 'offline'
            WHEN (NEW.speed > 5) THEN 'moving'
            ELSE 'stopped'
        END,
        updated_at = NOW()
    WHERE id = NEW.vehicle_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vehicle_snapshot 
AFTER INSERT ON public.vehicle_telemetry
FOR EACH ROW EXECUTE FUNCTION public.update_vehicle_snapshot();

-- 5. Seguridad de Ingesta (Solo dispositvos autenticados o service_role pueden escribir)
ALTER TABLE public.vehicle_telemetry ENABLE ROW LEVEL SECURITY;

-- Política de Lectura: Usuarios del Tenant ven sus vehículos
CREATE POLICY "Tenants view own telemetry" ON public.vehicle_telemetry
FOR SELECT USING (
    vehicle_id IN (SELECT id FROM vehicles WHERE tenant_id = get_user_tenant_id())
);

-- Política de Escritura: Service Role (API Ingesta) o Dispositivos IoT (Auth Token)
CREATE POLICY "IoT Devices Insert" ON public.vehicle_telemetry
FOR INSERT WITH CHECK (
    -- Validar si el usuario es un 'iot_device' o service_role. Simplificado:
    (auth.jwt() ->> 'role') = 'service_role' OR 
    (auth.jwt() -> 'app_metadata' ->> 'device_id') IS NOT NULL
);
