-- MIGRACIÓN DE BLINDAJE DE SEGURIDAD (HARDENING)
-- Objetivo: Cerrar permisos en tablas críticas y garantizar inmutabilidad de telemetría.

-- 1. TELEMETRÍA: INMUTABILIDAD (WORM)
-- Revocar permisos de modificación/borrado para todos (incluso dueños)
REVOKE UPDATE, DELETE, TRUNCATE ON public.vehicle_telemetry FROM public, authenticated, service_role;

-- Crear Trigger que impida modificaciones (Doble candado)
CREATE OR REPLACE FUNCTION public.conserve_history()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Telemetry is immutable. Updates/Deletes are forbidden.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_telemetry_worm
BEFORE UPDATE OR DELETE ON public.vehicle_telemetry
FOR EACH ROW EXECUTE FUNCTION public.conserve_history();

-- 2. PLANIFICACIÓN DE RUTAS: SEGURIDAD DE TENANT
-- Asegurar que las paradas (stops) solo sean visibles por el tenant
-- (Asumiendo tabla 'delivery_stops' futura, por ahora aplicamos a 'vehicles')

-- Revisar RLS de Vehicles:
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant Isolation Vehicles" ON public.vehicles;

CREATE POLICY "Tenant Isolation Vehicles"
ON public.vehicles
FOR ALL
USING (
    tenant_id = get_user_tenant_id()
);


-- 3. AUDITORÍA DE ACCESOS
-- Registrar quién consulta el dashboard de tracking (Lecturas sensibles)
-- Esto puede ser costoso, se recomienda hacerlo via API Gateway logs, 
-- pero para cumplimiento estricto, podemos usar pgaudit extension si está disponible.
-- En este nivel MVP, confiaremos en los logs de acceso de Supabase.

-- 4. ÍNDICES DE RENDIMIENTO (Performance Tuning)
-- Optimizar consultas del dashboard tiempo real
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_status ON public.vehicles(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_last_location_gist ON public.vehicles USING GIST ( ST_SetSRID( ST_MakePoint( ((last_location->>'lng')::float8), ((last_location->>'lat')::float8) ), 4326 ) ); 

