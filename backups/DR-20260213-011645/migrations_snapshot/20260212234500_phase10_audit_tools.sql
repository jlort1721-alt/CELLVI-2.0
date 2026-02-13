-- MIGRACIÓN FASE 10: HERRAMIENTAS DE AUDITORÍA (TYPE 2 READY)

-- 1. Vista de Cumplimiento de Rate Limit (Definición Oficial)
DROP VIEW IF EXISTS public.audit_ratelimit_compliance CASCADE;
CREATE OR REPLACE VIEW public.audit_ratelimit_compliance AS
SELECT 
    t.name as tenant_name,
    t.id as tenant_id,
    COALESCE(q.rndc_daily_limit, 100) as limit_configured,
    COALESCE(q.current_rndc_usage, 0) as current_usage,
    CASE 
        WHEN COALESCE(q.current_rndc_usage, 0) > COALESCE(q.rndc_daily_limit, 100) THEN 'VIOLATION'
        WHEN COALESCE(q.current_rndc_usage, 0) > (COALESCE(q.rndc_daily_limit, 100) * 0.9) THEN 'WARNING'
        ELSE 'PASS'
    END as compliance_status
FROM public.tenants t
LEFT JOIN public.tenant_quotas q ON t.id = q.tenant_id;

-- 2. Conciliación de Integridad RNDC (Ledger)
-- Verifica que no existan Jobs "perdidos" (creados pero no encolados/finalizados)
CREATE OR REPLACE VIEW public.audit_rndc_ledger AS
SELECT
    COUNT(*) as total_jobs,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success,
    SUM(CASE WHEN status = 'dead_letter' THEN 1 ELSE 0 END) as failed,
    SUM(CASE WHEN status IN ('queued', 'processing', 'retrying') THEN 1 ELSE 0 END) as pending,
    
    -- Integridad: Si (Success + Failed + Pending) != Total, hay data corrupta
    CASE 
        WHEN (
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) +
            SUM(CASE WHEN status = 'dead_letter' THEN 1 ELSE 0 END) +
            SUM(CASE WHEN status IN ('queued', 'processing', 'retrying') THEN 1 ELSE 0 END)
        ) = COUNT(*) THEN 'BALANCED'
        ELSE 'IMBALANCED'
    END as ledger_status
FROM public.integration_jobs
WHERE created_at > NOW() - INTERVAL '24 hours';
