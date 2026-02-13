-- AUDITORÍA FORENSE GLOBAL
-- Tabla inmutable para rastrear cambios críticos
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    actor_user_id UUID DEFAULT auth.uid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    record_hash TEXT -- SHA256 para integridad
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo lectura (append-only conceptual) para tenants
CREATE POLICY "Tenants can view their own audit logs" ON public.audit_logs
    FOR SELECT USING (tenant_id = (select auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Trigger Function para auditoría automática
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_tenant_id UUID;
    v_user_id UUID;
BEGIN
    -- Determinar Tenant ID
    IF (TG_OP = 'DELETE') THEN
        v_old_data = to_jsonb(OLD);
        v_tenant_id = OLD.tenant_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data = to_jsonb(OLD);
        v_new_data = to_jsonb(NEW);
        v_tenant_id = NEW.tenant_id;
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data = to_jsonb(NEW);
        v_tenant_id = NEW.tenant_id;
    END IF;

    v_user_id = auth.uid();

    INSERT INTO public.audit_logs (
        tenant_id, actor_user_id, table_name, record_id, action, old_value, new_value, record_hash
    ) VALUES (
        v_tenant_id,
        v_user_id,
        TG_TABLE_NAME::TEXT,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        v_old_data,
        v_new_data,
        md5(v_old_data::text || v_new_data::text || now()::text) -- Simple integrity hash
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar Triggers a tablas críticas
DROP TRIGGER IF EXISTS audit_vehicles ON public.vehicles;
CREATE TRIGGER audit_vehicles AFTER INSERT OR UPDATE OR DELETE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_drivers ON public.drivers;
CREATE TRIGGER audit_drivers AFTER INSERT OR UPDATE OR DELETE ON public.drivers
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_trips ON public.trips;
CREATE TRIGGER audit_trips AFTER INSERT OR UPDATE OR DELETE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();


-- SISTEMA DE COLAS (WORKER PATTERN)
-- Tabla para trabajos asíncronos (RNDC, RUNT)
CREATE TABLE IF NOT EXISTS public.integration_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    type TEXT NOT NULL, -- 'RNDC_SEND', 'RUNT_VALIDATE'
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed', 'max_retries'
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    next_run_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indices para el worker
CREATE INDEX IF NOT EXISTS idx_jobs_status_next ON public.integration_jobs(status, next_run_at);

-- Bitácora de ejecución de jobs
CREATE TABLE IF NOT EXISTS public.integration_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.integration_jobs(id) ON DELETE CASCADE,
    request_payload JSONB,
    response_payload JSONB,
    http_status INT,
    duration_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.integration_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_job_logs ENABLE ROW LEVEL SECURITY;

-- GESTIÓN DE SECRETOS (VAULT)
CREATE TABLE IF NOT EXISTS public.tenant_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
    service TEXT NOT NULL, -- 'RNDC', 'RUNT'
    encrypted_username TEXT,
    encrypted_password TEXT,
    api_key TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id, service)
);

ALTER TABLE public.tenant_credentials ENABLE ROW LEVEL SECURITY;
-- Solo admins pueden ver o editar credenciales via funciones seguras
-- Las policies aqui deben ser restrictivas.

