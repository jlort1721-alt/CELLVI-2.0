/*
  # Smart Fleet Analytics & Digital Twin Core (Fase 2 & 3 Enhanced)
  # Fecha: 2026-02-18
  # Autor: Antigravity AI
  
  Objetivo:
  1. Habilitar la visualización "Experta" (Digital Twin State)
  2. Implementar Detección de Anomalías (The Oracle) usando Estadística Bayesiana (Z-Score simplificado)
  3. Crear endpoints públicos seguros para "Trustless Verification"
*/

SET search_path = public, extensions;

-- 1. EXTENSIONS FOR STATISTICS
CREATE EXTENSION IF NOT EXISTS "tablefunc" WITH SCHEMA "extensions"; -- Para desviaciones estándar

-- 2. TABLA DE ESTADO DEL GEMELO DIGITAL (Real-Time State)
-- Esta tabla alimenta al visor 3D con el estado de cada componente crítico
CREATE TABLE IF NOT EXISTS public.digital_twin_state (
  vehicle_id UUID PRIMARY KEY REFERENCES public.vehicles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Component Health (0-100%)
  engine_health INT DEFAULT 100,
  transmission_health INT DEFAULT 100,
  brakes_health INT DEFAULT 100,
  tires_health INT DEFAULT 100,
  cooling_unit_health INT DEFAULT 100,
  
  -- Anomalies (Flag for 3D Highlighting)
  anomaly_detected BOOLEAN DEFAULT false,
  anomaly_component TEXT, -- 'engine', 'cooling', 'tires'
  anomaly_severity TEXT, -- 'low', 'medium', 'critical'
  
  last_updated TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.digital_twin_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants view own twin state" ON public.digital_twin_state FOR SELECT USING (tenant_id = get_user_tenant_id());

-- 3. EL ORÁCULO: DETECCIÓN DE ANOMALÍAS (Phase 3.5)
-- Función que corre en cada inserción de telemetría para detectar patrones anormales
CREATE OR REPLACE FUNCTION public.detect_telemetry_anomalies()
RETURNS TRIGGER AS $$
DECLARE
  avg_temp FLOAT;
  stddev_temp FLOAT;
  z_score FLOAT;
BEGIN
  -- Calcular media y desviación estándar de las últimas 24h para este vehículo
  SELECT 
    AVG(temperature_c), STDDEV(temperature_c)
  INTO 
    avg_temp, stddev_temp
  FROM public.cold_chain_logs
  WHERE vehicle_id = NEW.vehicle_id 
  AND created_at > now() - INTERVAL '24 hours';
  
  -- Evitar división por cero
  IF stddev_temp IS NOT NULL AND stddev_temp > 0 THEN
    -- Calcular Z-Score (Cuantas desviaciones estándar se aleja del promedio)
    z_score := ABS((NEW.temperature_c - avg_temp) / stddev_temp);
    
    -- Si Z-Score > 3 (99.7% probabilidad de anomalía estadística)
    IF z_score > 3 THEN
       -- 1. Registrar Alerta Predictiva
       INSERT INTO public.alerts (
         tenant_id, vehicle_id, type, severity, message, data
       ) VALUES (
         NEW.tenant_id, NEW.vehicle_id, 'PREDICTIVE_ANOMALY', 'critical',
         'Patrón térmico anómalo detectado (Z-Score: ' || round(z_score::numeric, 2) || ')',
         jsonb_build_object(
           'current_temp', NEW.temperature_c,
           'avg_24h', avg_temp,
           'deviation', stddev_temp
         )
       );
       
       -- 2. Actualizar Gemelo Digital (Para que brille en rojo en 3D)
       INSERT INTO public.digital_twin_state (vehicle_id, tenant_id, cooling_unit_health, anomaly_detected, anomaly_component, anomaly_severity)
       VALUES (NEW.vehicle_id, NEW.tenant_id, 45, true, 'cooling', 'critical')
       ON CONFLICT (vehicle_id) DO UPDATE SET
         cooling_unit_health = 45,
         anomaly_detected = true,
         anomaly_component = 'cooling',
         anomaly_severity = 'critical',
         last_updated = now();
    ELSE
       -- Restablecer salud si todo normal
       UPDATE public.digital_twin_state 
       SET anomaly_detected = false, cooling_unit_health = 100
       WHERE vehicle_id = NEW.vehicle_id AND anomaly_detected = true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Predictivo
DROP TRIGGER IF EXISTS trg_predict_anomalies ON public.cold_chain_logs;
CREATE TRIGGER trg_predict_anomalies
  AFTER INSERT ON public.cold_chain_logs
  FOR EACH ROW EXECUTE FUNCTION public.detect_telemetry_anomalies();


-- 4. VERIFICACIÓN PÚBLICA (Phase 4 Enhanced)
-- Función para verificar un hash sin autenticación (Public RPC)
CREATE OR REPLACE FUNCTION public.verify_ledger_hash(hash_to_verify TEXT)
RETURNS TABLE (
  verified BOOLEAN,
  event_time TIMESTAMPTZ, -- Renamed from 'timestamp' to avoid conflict
  event_type TEXT,
  payload JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as admin to bypass RLS for public check
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true, 
    created_at, 
    event_type, 
    payload
  FROM public.forensic_ledger
  WHERE current_hash = hash_to_verify;
END;
$$;
-- Grant execute to anon users (PUBLIC API)
GRANT EXECUTE ON FUNCTION public.verify_ledger_hash(TEXT) TO anon;
