-- MIGRACIÓN: CADENA DE FRÍO AVANZADA (PHARMA & FOOD GRADE)
-- Objetivo: Monitoreo térmico con alertas proactivas y auditoría de desviación.

-- 1. CONFIGURACIÓN TÉRMICA POR VEHÍCULO
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS thermal_config JSONB DEFAULT '{
    "enabled": false,
    "min_temp": 2.0,
    "max_temp": 8.0,
    "alert_delay_minutes": 5,
    "sensors": ["INTERNAL_01"]
}'::jsonb;

-- 2. FUNCIÓN DE MONITOREO TÉRMICO (TRIGGER)
CREATE OR REPLACE FUNCTION public.check_thermal_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_config JSONB;
    v_min_temp FLOAT;
    v_max_temp FLOAT;
    v_tenant_id UUID;
    v_alert_exists BOOLEAN;
BEGIN
    -- Obtener límites del vehículo
    SELECT thermal_config, tenant_id INTO v_config, v_tenant_id 
    FROM public.vehicles WHERE id = NEW.vehicle_id;

    IF (v_config->>'enabled')::boolean = true THEN
        v_min_temp := (v_config->>'min_temp')::float8;
        v_max_temp := (v_config->>'max_temp')::float8;

        -- Determinar si está fuera de rango
        NEW.in_range := (NEW.temperature >= v_min_temp AND NEW.temperature <= v_max_temp);

        -- Generar alerta si hay desviación
        IF NOT NEW.in_range THEN
            -- Evitar spam (1 alerta por cada 15 min)
            SELECT EXISTS (
                SELECT 1 FROM public.alerts 
                WHERE vehicle_id = NEW.vehicle_id 
                AND type = 'THERMAL_DEVIATION'
                AND acknowledged = false 
                AND created_at > now() - INTERVAL '15 minutes'
            ) INTO v_alert_exists;

            IF NOT v_alert_exists THEN
                INSERT INTO public.alerts (tenant_id, vehicle_id, severity, type, message, data)
                VALUES (
                    v_tenant_id,
                    NEW.vehicle_id,
                    'critical',
                    'THERMAL_DEVIATION',
                    '¡ALERTA TÉRMICA! Temperatura fuera de rango: ' || NEW.temperature || '°C (Límite: ' || v_min_temp || '-' || v_max_temp || ')',
                    jsonb_build_object(
                        'temp', NEW.temperature,
                        'sensor', NEW.sensor_id,
                        'lat', NEW.latitude,
                        'lng', NEW.longitude,
                        'ts', NEW.ts
                    )
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_thermal_integrity ON public.cold_chain_logs;
CREATE TRIGGER trg_thermal_integrity
BEFORE INSERT ON public.cold_chain_logs
FOR EACH ROW EXECUTE FUNCTION public.check_thermal_integrity();

-- 3. VISTA PARA CUMPLIMIENTO (COMPLIANCE REPORT)
CREATE OR REPLACE VIEW public.vw_thermal_compliance AS
SELECT 
    vehicle_id,
    DATE_TRUNC('hour', ts) as hour,
    AVG(temperature) as avg_temp,
    MIN(temperature) as min_temp,
    MAX(temperature) as max_temp,
    COUNT(*) FILTER (WHERE NOT in_range) as deviations_count,
    COUNT(*) as total_readings
FROM public.cold_chain_logs
GROUP BY vehicle_id, hour;
