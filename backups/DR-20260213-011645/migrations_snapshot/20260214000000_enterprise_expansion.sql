-- MIGRACIÓN: ENTERPRISE LEVEL UP (RNDC, GEOFENCING, ANALYTICS)
-- Objetivo: Implementar lógica de negocio avanzada para certificación empresarial.

-- 1. TABLAS PARA INTELIGENCIA PREDICTIVA
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'OIL_CHANGE', 'TIRE_ROTATION', 'BRAKE_INSPECTION', etc.
    odometer_reading DOUBLE PRECISION,
    cost DOUBLE PRECISION,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fuel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    gallons DOUBLE PRECISION NOT NULL,
    cost_per_gallon DOUBLE PRECISION,
    total_cost DOUBLE PRECISION,
    odometer_reading DOUBLE PRECISION,
    full_tank BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para nuevas tablas
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own maintenance" ON public.maintenance_logs
    FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenants can manage own maintenance" ON public.maintenance_logs
    FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenants can view own fuel logs" ON public.fuel_logs
    FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenants can manage own fuel logs" ON public.fuel_logs
    FOR ALL USING (tenant_id = get_user_tenant_id());

-- 2. MEJORAS DE GEOFENCING (POSTGIS)
-- Añadir columna geométrica real si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='geofences' AND column_name='geom') THEN
        ALTER TABLE public.geofences ADD COLUMN geom GEOGRAPHY(POLYGON, 4326);
    END IF;
END $$;

-- Función para verificar violaciones de Geocerca en tiempo real
CREATE OR REPLACE FUNCTION public.check_geofence_violations()
RETURNS TRIGGER AS $$
DECLARE
    geofence_record RECORD;
    alert_exists BOOLEAN;
    veh_tenant_id UUID;
BEGIN
    -- Cache tenant_id
    SELECT tenant_id INTO veh_tenant_id FROM public.vehicles WHERE id = NEW.vehicle_id;

    -- Buscar geocercas activas para el tenant
    FOR geofence_record IN 
        SELECT id, name, type, geom 
        FROM public.geofences 
        WHERE tenant_id = veh_tenant_id
        AND active = true
        AND geom IS NOT NULL
    LOOP
        -- Lógica: Alertar si el punto NO está contenido en el polígono (Salió de zona segura)
        IF NOT ST_Contains(geofence_record.geom::geometry, ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geometry) THEN
            
            -- Evitar spam: Solo una alerta por hora si no se ha reconocido
            SELECT EXISTS (
                SELECT 1 FROM public.alerts 
                WHERE vehicle_id = NEW.vehicle_id 
                AND policy_id = geofence_record.id 
                AND acknowledged = false 
                AND created_at > now() - INTERVAL '1 hour'
            ) INTO alert_exists;

            IF NOT alert_exists THEN
                INSERT INTO public.alerts (tenant_id, vehicle_id, policy_id, severity, type, message, data)
                VALUES (
                    veh_tenant_id,
                    NEW.vehicle_id,
                    geofence_record.id,
                    'high',
                    'GEOFENCE_VIOLATION',
                    'Vehículo fuera de zona permitida: ' || geofence_record.name,
                    jsonb_build_object(
                        'lat', NEW.latitude, 
                        'lng', NEW.longitude, 
                        'geofence_id', geofence_record.id,
                        'ts', NEW.time
                    )
                );
            END IF;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropear si existía para evitar duplicados en redeploy
DROP TRIGGER IF EXISTS trg_check_geofence_violations ON public.vehicle_telemetry;

CREATE TRIGGER trg_check_geofence_violations 
AFTER INSERT ON public.vehicle_telemetry
FOR EACH ROW EXECUTE FUNCTION public.check_geofence_violations();

-- 3. VISTAS PARA DASHBOARDS ANALÍTICOS
CREATE OR REPLACE VIEW public.vw_predictive_maintenance AS
SELECT 
    v.id as vehicle_id,
    v.plate,
    v.tenant_id,
    (v.metadata->>'odometer_total')::float8 as current_odometer,
    MAX(m.odometer_reading) as last_maintenance_odometer,
    (v.metadata->>'odometer_total')::float8 - COALESCE(MAX(m.odometer_reading), 0) as km_since_last_service,
    CASE 
        WHEN ((v.metadata->>'odometer_total')::float8 - COALESCE(MAX(m.odometer_reading), 0)) > 5000 THEN 'URGENT'
        WHEN ((v.metadata->>'odometer_total')::float8 - COALESCE(MAX(m.odometer_reading), 0)) > 4000 THEN 'WARNING'
        ELSE 'OK'
    END as maintenance_status
FROM public.vehicles v
LEFT JOIN public.maintenance_logs m ON v.id = m.vehicle_id
GROUP BY v.id, v.plate, v.tenant_id, v.metadata;

-- Habilitar tiempo real para nuevas tablas
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fuel_logs;
