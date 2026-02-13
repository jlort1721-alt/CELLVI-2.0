-- MIGRACIÓN FASE 9: CERTIFICACIÓN Y EVIDENCIA (SLO & AUDITORÍA)

-- 1. Repositorio de Evidencia SLO (Persistencia Legal)
CREATE TABLE IF NOT EXISTS public.slo_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_week DATE NOT NULL, -- Inicio de semana (Lunes)
    
    -- Métricas Críticas (Snapshot congelado)
    metrics JSONB NOT NULL,
    -- Ejemplo: { "rndc_success": 99.8, "worker_p95": 22.5, "uptime": 99.99 }
    
    status TEXT CHECK (status IN ('PASS', 'FAIL', 'WARNING')),
    
    -- Trazabilidad
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by TEXT DEFAULT 'system', -- 'system' o 'auditor_user_id'
    
    -- Integridad
    report_hash TEXT, -- SHA256(metrics::text + report_week::text)
    
    UNIQUE(report_week)
);

-- RLS: Solo lectura para auditores, Insert para system/admin
ALTER TABLE public.slo_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Ops" ON public.slo_reports FOR SELECT USING (true);

-- 2. Vista de Cumplimiento de Rate Limit (Anti-Evasión)
-- Permite auditar si algún Tenant está saltándose los límites
CREATE OR REPLACE VIEW public.audit_ratelimit_compliance AS
SELECT 
    t.name as tenant_name,
    q.rndc_daily_limit,
    q.current_rndc_usage,
    CASE 
        WHEN q.current_rndc_usage > q.rndc_daily_limit THEN 'VIOLATION'
        WHEN q.current_rndc_usage > (q.rndc_daily_limit * 0.9) THEN 'WARNING'
        ELSE 'OK'
    END as compliance_status
FROM public.tenant_quotas q
JOIN public.tenants t ON t.id = q.tenant_id;

-- 3. Índices de Alto Rendimiento para Drill Reports
-- Aceleran las consultas de evidencia durante el Go-Live Drill
CREATE INDEX IF NOT EXISTS idx_integration_jobs_perf 
ON public.integration_jobs(created_at, status) 
INCLUDE (type, attempts);
