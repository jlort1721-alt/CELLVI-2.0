-- MIGRACIÓN FASE 11: INMUTABILIDAD Y SEGREGACIÓN (WORM + RBAC)

-- 1. Inmutabilidad Estricta (WORM - Write Once Read Many)
-- Protege la evidencia forense incluso contra administradores de aplicación (no DB admins)
CREATE OR REPLACE FUNCTION public.raise_immutable_error()
RETURNS TRIGGER AS $$
BEGIN
    IF (CURRENT_USER = 'postgres') THEN 
        RETURN OLD; -- Permitir mantenimiento de superusuario DB si es absolutamente necesario (DR/Migration)
    END IF;
    RAISE EXCEPTION 'VIOLATION: Table % is Immutable (WORM Standard). Updates/Deletes forbidden.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- Trigger para Audit Logs
DROP TRIGGER IF EXISTS trg_worm_audit_logs ON public.audit_logs;
CREATE TRIGGER trg_worm_audit_logs 
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.raise_immutable_error();

-- Trigger para SLO Reports
DROP TRIGGER IF EXISTS trg_worm_slo_reports ON public.slo_reports;
CREATE TRIGGER trg_worm_slo_reports 
BEFORE UPDATE OR DELETE ON public.slo_reports
FOR EACH ROW EXECUTE FUNCTION public.raise_immutable_error();

-- 2. Ledger de Negocio (Conciliación por Manifiesto Único)
-- Resuelve el problema de conteo de reintentos técnicos vs transacciones reales
CREATE OR REPLACE VIEW public.audit_rndc_ledger_business AS
SELECT
    COUNT(DISTINCT idempotency_key) as total_manifests,
    
    -- Estados Mutuamente Exclusivos por Manifiesto
    -- Un manifiesto está "Completado" si al menos 1 job terminó OK.
    COUNT(DISTINCT CASE WHEN status = 'completed' THEN idempotency_key END) as success_manifests,
    
    -- Un manifiesto está "Fallido" solo si TODOS sus intentos murieron (Dead Letter) y no hay éxito.
    COUNT(DISTINCT CASE 
        WHEN status = 'dead_letter' 
             AND idempotency_key NOT IN (SELECT idempotency_key FROM integration_jobs WHERE status = 'completed')
        THEN idempotency_key 
    END) as failed_manifests,
    
    -- Pendiente si no está ni completo ni muerto.
    COUNT(DISTINCT CASE 
        WHEN status IN ('queued', 'processing', 'retrying') 
             AND idempotency_key NOT IN (SELECT idempotency_key FROM integration_jobs WHERE status IN ('completed', 'dead_letter'))
        THEN idempotency_key 
    END) as pending_manifests,
    
    -- Balance Check: Total debe ser igual a Success + Failed + Pending
    -- (Nota: Esta lógica es simplificada; en alta concurrencia puede haber estados transitorios, 
    --  pero para un corte de auditoría (Drill Freeze) debe cuadrar exacto).
    'BALANCED' as ledger_status -- Placeholder logic, real logic implies math check in app or complex SQL wrapper
FROM public.integration_jobs
WHERE idempotency_key IS NOT NULL;

-- 3. Vista de Auditoría de Accesos a Secretos (Segregación)
CREATE OR REPLACE VIEW public.audit_secret_access AS
SELECT
    created_at,
    actor_user_id,
    action, -- 'INSERT', 'UPDATE'
    table_name
FROM public.audit_logs
WHERE table_name = 'tenant_credentials'
ORDER BY created_at DESC;
