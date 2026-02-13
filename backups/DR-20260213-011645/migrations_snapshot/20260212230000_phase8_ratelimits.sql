-- MIGRACIÓN FASE 8: PROTECCIÓN Y GOBERNANZA (RATE LIMITS & SLI)

-- 1. Tabla de Cuotas y Límites por Tenant
CREATE TABLE IF NOT EXISTS public.tenant_quotas (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    tier_name TEXT DEFAULT 'starter', -- 'starter', 'pro', 'enterprise'
    
    -- Límites Diarios (Business Quotas)
    rndc_daily_limit INT DEFAULT 50, -- Jobs RNDC permitidos por día
    storage_daily_mb INT DEFAULT 100, -- MB subidos por día
    
    -- Estado Actual (Leaky Bucket / Reset diario)
    current_rndc_usage INT DEFAULT 0,
    current_storage_usage INT DEFAULT 0,
    quota_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 day')
);

-- habilitar RLS (Admin gestiona, Tenant solo lee su cuota)
ALTER TABLE public.tenant_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants view own quota" ON public.tenant_quotas FOR SELECT USING (tenant_id = get_user_tenant_id());

-- 2. Función de Protección de Rate Limit (Invocar antes de encolar Jobs)
CREATE OR REPLACE FUNCTION public.check_and_consume_quota(
    p_tenant_id UUID, 
    p_resource_type TEXT, -- 'RNDC', 'STORAGE'
    p_cost INT DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    v_quota public.tenant_quotas%ROWTYPE;
BEGIN
    SELECT * INTO v_quota FROM public.tenant_quotas WHERE tenant_id = p_tenant_id;
    
    -- Auto-provisioning para tenants nuevos
    IF v_quota IS NULL THEN
        INSERT INTO public.tenant_quotas (tenant_id) VALUES (p_tenant_id) RETURNING * INTO v_quota;
    END IF;

    -- Reset diario automático si pasó la fecha
    IF NOW() > v_quota.quota_reset_at THEN
        UPDATE public.tenant_quotas 
        SET current_rndc_usage = 0, current_storage_usage = 0, quota_reset_at = (NOW() + INTERVAL '1 day')
        WHERE tenant_id = p_tenant_id;
        
        -- Recargar valores reseteados
        v_quota.current_rndc_usage := 0;
        v_quota.current_storage_usage := 0;
    END IF;

    -- Validación
    IF p_resource_type = 'RNDC' THEN
        IF (v_quota.current_rndc_usage + p_cost) > v_quota.rndc_daily_limit THEN
            RETURN FALSE; -- Bloqueo
        END IF;
        
        UPDATE public.tenant_quotas 
        SET current_rndc_usage = current_rndc_usage + p_cost 
        WHERE tenant_id = p_tenant_id;
        
        RETURN TRUE;
    END IF;
    
    -- Agregar lógica para STORAGE u otros aquí...

    RETURN TRUE; -- Default allow if resource type unknown (or handle logic error)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Vistas para Cálculo de SLOs ( Service Level Objectives )
-- SLI 1: Tasa de Éxito de Jobs RNDC (Ultimos 7 días)
CREATE OR REPLACE VIEW public.slo_rndc_success_rate AS
SELECT 
    DATE_TRUNC('day', created_at) as day,
    COUNT(*) as total_jobs,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success_jobs,
    SUM(CASE WHEN status = 'dead_letter' THEN 1 ELSE 0 END) as failed_jobs,
    ROUND((SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::numeric / COUNT(*)) * 100, 2) as success_rate_percent
FROM public.integration_jobs
WHERE created_at > NOW() - INTERVAL '7 days'
AND type = 'RNDC_SEND_MANIFEST'
GROUP BY 1
ORDER BY 1 DESC;

-- SLI 2: Latencia de Procesamiento (Worker Lag)
CREATE OR REPLACE VIEW public.slo_worker_latency AS
SELECT
    DATE_TRUNC('hour', created_at) as hour,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (updated_at - created_at))) as p95_duration_sec
FROM public.integration_jobs
WHERE status = 'completed' AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1;
