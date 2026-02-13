-- MIGRACIÓN FASE 6: HARDENING & ENTERPRISE READINESS
-- Objetivo: Idempotencia real, DLQ y Auditoría Encadenada (Tamper-Proof)

-- Habilitar extensión crypto para hashes si no existe
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. COLAS ROBUSTAS (Idempotency + DLQ)
-- ==========================================

-- Agregar columnas de control a integration_jobs
ALTER TABLE public.integration_jobs 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0, -- 0=Standard, 1=High, 2=Critical
ADD COLUMN IF NOT EXISTS trace_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS worker_id UUID, -- Quién lo procesó
ADD COLUMN IF NOT EXISTS dlq_reason TEXT, -- Por qué murió (Dead Letter)
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE; -- Para evitar doble procesamiento en workers paralelos

-- Constraint de Idempotencia: Un tenant no puede encolar el mismo mensaje dos veces si no ha terminado
-- Opcional: Permitir reintentos si falló, pero bloquear duplicados "en vuelo".
-- Aquí aplicamos unicidad estricta para evitar "Doble Manifiesto".
ALTER TABLE public.integration_jobs 
ADD CONSTRAINT uniq_jobs_idempotency UNIQUE NULLS NOT DISTINCT (tenant_id, idempotency_key);

-- Indices para Alta Concurrencia
CREATE INDEX IF NOT EXISTS idx_jobs_processing ON public.integration_jobs(status, priority DESC, next_run_at) 
WHERE status IN ('queued', 'retrying');

CREATE INDEX IF NOT EXISTS idx_jobs_dlq ON public.integration_jobs(created_at) 
WHERE status = 'dead_letter';


-- ==========================================
-- 2. AUDITORÍA FORENSE ENCADENADA (Hash Chain)
-- ==========================================

-- Agregar columnas de cadena de bloques
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS prev_record_hash TEXT,
ADD COLUMN IF NOT EXISTS chain_sequence BIGINT GENERATED ALWAYS AS IDENTITY;

-- Función Trigger Mejorada: Calcula Hash SHA-256 encadenado
CREATE OR REPLACE FUNCTION public.log_audit_event_secure()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_tenant_id UUID;
    v_user_id UUID;
    v_prev_hash TEXT;
    v_current_hash TEXT;
    v_record_id UUID;
BEGIN
    -- Normalizar Datos
    IF (TG_OP = 'DELETE') THEN
        v_old_data = to_jsonb(OLD);
        v_tenant_id = OLD.tenant_id;
        v_record_id = OLD.id;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data = to_jsonb(OLD);
        v_new_data = to_jsonb(NEW);
        v_tenant_id = NEW.tenant_id;
        v_record_id = NEW.id;
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data = to_jsonb(NEW);
        v_tenant_id = NEW.tenant_id;
        v_record_id = NEW.id;
    END IF;
    
    v_user_id = auth.uid();

    -- Obtener Hash Previo del Tenant (Serialización)
    -- "Locking" implícito por lectura secuencial podría afectar performance masivo,
    -- pero es necesario para garantía de integridad estricta.
    SELECT record_hash INTO v_prev_hash 
    FROM public.audit_logs 
    WHERE tenant_id = v_tenant_id 
    ORDER BY chain_sequence DESC 
    LIMIT 1;

    -- Calcular Nuevo Hash: H(Prev + Time + Actor + Op + Data)
    v_current_hash = encode(digest(
        COALESCE(v_prev_hash, 'genesis') || 
        now()::text || 
        COALESCE(v_user_id::text, 'system') ||
        TG_OP || 
        TG_TABLE_NAME::text ||
        v_record_id::text ||
        COALESCE(v_old_data::text, '') || 
        COALESCE(v_new_data::text, ''), 
        'sha256'), 'hex');

    INSERT INTO public.audit_logs (
        tenant_id, actor_user_id, table_name, record_id, action, old_value, new_value, 
        record_hash, prev_record_hash
    ) VALUES (
        v_tenant_id, v_user_id, TG_TABLE_NAME::TEXT, v_record_id, TG_OP, 
        v_old_data, v_new_data, v_current_hash, v_prev_hash
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reaplicar Triggers Seguros
DROP TRIGGER IF EXISTS audit_vehicles ON public.vehicles;
CREATE TRIGGER audit_vehicles_secure AFTER INSERT OR UPDATE OR DELETE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event_secure();

DROP TRIGGER IF EXISTS audit_drivers ON public.drivers;
CREATE TRIGGER audit_drivers_secure AFTER INSERT OR UPDATE OR DELETE ON public.drivers
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event_secure();

DROP TRIGGER IF EXISTS audit_trips ON public.trips;
CREATE TRIGGER audit_trips_secure AFTER INSERT OR UPDATE OR DELETE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event_secure();

DROP TRIGGER IF EXISTS audit_credentials ON public.tenant_credentials;
CREATE TRIGGER audit_credentials_secure AFTER INSERT OR UPDATE OR DELETE ON public.tenant_credentials
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event_secure();
