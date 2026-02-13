-- MIGRACIÓN: Optimización de Escalabilidad (Scaling & Partitioning)
-- Fecha: 17/02/2026
-- Objetivo: Añadir índices GIST y planificar particionamiento.

SET search_path = public, extensions;

-- 1. Optimización Geoespacial (CRITICAL FOR GEOFENCING)
-- El trigger check_geofence_violations usa ST_Contains. Sin índice GIST es O(N).
CREATE INDEX IF NOT EXISTS idx_geofences_geom_gist ON public.geofences USING GIST (geom);

-- 2. Optimización de Estado Caliente (CACHE)
-- Crear una tabla ligera para consultar la última posición sin escanear telemetry_events (millones de filas).
CREATE TABLE IF NOT EXISTS public.vehicle_last_positions (
    vehicle_id UUID PRIMARY KEY REFERENCES public.vehicles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    address TEXT,
    last_updated TIMESTAMPTZ DEFAULT now(),
    -- Copiar metadata útil para evitar joins
    driver_name TEXT,
    plate TEXT
);

-- RLS para la caché
ALTER TABLE public.vehicle_last_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants view own vehicle positions" ON public.vehicle_last_positions
    FOR SELECT USING (tenant_id = get_user_tenant_id());

-- Trigger para mantener la caché actualizada automáticamente
CREATE OR REPLACE FUNCTION public.update_vehicle_cache()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.vehicle_last_positions (
        vehicle_id, tenant_id, latitude, longitude, speed, heading, last_updated
    )
    VALUES (
        NEW.vehicle_id, 
        (SELECT tenant_id FROM public.vehicles WHERE id = NEW.vehicle_id),
        NEW.latitude, 
        NEW.longitude, 
        NEW.speed, 
        NEW.heading, 
        NEW.ts
    )
    ON CONFLICT (vehicle_id) DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        speed = EXCLUDED.speed,
        heading = EXCLUDED.heading,
        last_updated = EXCLUDED.last_updated;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vincular al flujo de telemetría
DROP TRIGGER IF EXISTS trg_update_vehicle_cache ON public.telemetry_events;
CREATE TRIGGER trg_update_vehicle_cache
AFTER INSERT ON public.telemetry_events
FOR EACH ROW EXECUTE FUNCTION public.update_vehicle_cache();

-- 3. Índices Compuestos para Reportes
-- Acelerar filtros comunes en dashboards (/reportes)
CREATE INDEX IF NOT EXISTS idx_work_orders_composite 
ON public.work_orders(tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_plans_status
ON public.maintenance_plans(tenant_id, status, next_due_date ASC);

-- 4. Particionamiento (Stub - Requiere migración manual de datos existentes)
-- Nota: PostgreSQL nativo no soporta convertir una tabla normal a particionada directamente.
-- Se requiere renombrar la tabla vieja, crear la nueva particionada e insertar los datos.
-- Este script solo añade el índice GIST que es seguro y no disruptivo.
