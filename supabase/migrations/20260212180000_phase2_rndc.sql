-- Integración RNDC (Registro Nacional de Despachos de Carga)
-- Tabla para auditoría de transmisión de datos al Ministerio de Transporte

CREATE TABLE IF NOT EXISTS public.rndc_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id),
    operation_type TEXT NOT NULL, -- 'MANIFIESTO', 'CUMPLIDO', 'REMESA'
    xml_generated TEXT, -- El XML exacto enviado
    response_ministry TEXT, -- Respuesta cruda del servicio SOAP
    radicado TEXT, -- Número de radicado devuelto por RNDC
    status TEXT DEFAULT 'pending', -- 'pending', 'success', 'error'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_rndc_logs_trip ON public.rndc_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_rndc_logs_tenant ON public.rndc_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rndc_logs_status ON public.rndc_logs(status);

-- RLS
ALTER TABLE public.rndc_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own rndc logs" ON public.rndc_logs
    FOR SELECT USING (tenant_id = (select auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Tenants can insert rndc logs" ON public.rndc_logs
    FOR INSERT WITH CHECK (tenant_id = (select auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
