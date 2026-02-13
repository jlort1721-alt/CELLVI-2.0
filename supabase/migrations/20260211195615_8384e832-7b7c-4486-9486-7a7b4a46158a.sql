
-- =============================================
-- CELLVI 2.0 — Multi-Tenant Architecture Schema
-- =============================================

-- 1. TENANTS
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'basic',
  config JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{"events_per_day": 100000, "retention_days": 90, "max_vehicles": 50, "max_users": 10}',
  features JSONB NOT NULL DEFAULT '{"cold_chain": false, "satellite": false, "evidence_export": false, "policy_engine": true}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. Link profiles to tenants
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 3. VEHICLES
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  vin TEXT,
  type TEXT NOT NULL DEFAULT 'truck',
  brand TEXT,
  model TEXT,
  year INT,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_vehicles_tenant ON public.vehicles(tenant_id);
CREATE UNIQUE INDEX idx_vehicles_plate_tenant ON public.vehicles(tenant_id, plate);

-- 4. DEVICES
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  imei TEXT NOT NULL UNIQUE,
  serial_number TEXT,
  protocol TEXT NOT NULL DEFAULT 'teltonika',
  connectivity TEXT NOT NULL DEFAULT '4g',
  firmware_version TEXT,
  last_seen_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_devices_tenant ON public.devices(tenant_id);
CREATE INDEX idx_devices_imei ON public.devices(imei);

-- 5. TELEMETRY_EVENTS (time-series style)
CREATE TABLE public.telemetry_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id),
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  speed DOUBLE PRECISION DEFAULT 0,
  heading DOUBLE PRECISION DEFAULT 0,
  altitude DOUBLE PRECISION,
  fuel_level DOUBLE PRECISION,
  engine_on BOOLEAN,
  odometer DOUBLE PRECISION,
  satellites INT DEFAULT 0,
  hdop DOUBLE PRECISION,
  extras JSONB NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'gnss',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_telemetry_tenant_ts ON public.telemetry_events(tenant_id, ts DESC);
CREATE INDEX idx_telemetry_vehicle_ts ON public.telemetry_events(vehicle_id, ts DESC);

-- 6. COLD_CHAIN_LOGS
CREATE TABLE public.cold_chain_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  sensor_id TEXT,
  temperature DOUBLE PRECISION NOT NULL,
  humidity DOUBLE PRECISION,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  in_range BOOLEAN NOT NULL DEFAULT true,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  extras JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cold_chain_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cold_chain_tenant_ts ON public.cold_chain_logs(tenant_id, ts DESC);
CREATE INDEX idx_cold_chain_vehicle_ts ON public.cold_chain_logs(vehicle_id, ts DESC);

-- 7. POLICIES (rule engine)
CREATE TABLE public.policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  logic TEXT NOT NULL DEFAULT 'AND',
  status TEXT NOT NULL DEFAULT 'draft',
  category TEXT NOT NULL DEFAULT 'custom',
  trigger_count INT NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_policies_tenant ON public.policies(tenant_id);
CREATE INDEX idx_policies_status ON public.policies(tenant_id, status);

-- 8. ALERTS
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  policy_id UUID REFERENCES public.policies(id) ON DELETE SET NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_alerts_tenant_created ON public.alerts(tenant_id, created_at DESC);
CREATE INDEX idx_alerts_severity ON public.alerts(tenant_id, severity);

-- 9. EVIDENCE_RECORDS (immutable audit trail)
CREATE TABLE public.evidence_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_id UUID,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  sha256_hash TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'gnss',
  sealed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  access_log JSONB NOT NULL DEFAULT '[]',
  verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evidence_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_evidence_tenant ON public.evidence_records(tenant_id, sealed_at DESC);
CREATE INDEX idx_evidence_hash ON public.evidence_records(sha256_hash);

-- 10. GEOFENCES
CREATE TABLE public.geofences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'polygon',
  coordinates JSONB NOT NULL DEFAULT '[]',
  radius DOUBLE PRECISION,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_geofences_tenant ON public.geofences(tenant_id);

-- 11. DRIVERS
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  license_number TEXT,
  license_expiry DATE,
  phone TEXT,
  email TEXT,
  score DOUBLE PRECISION NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_drivers_tenant ON public.drivers(tenant_id);

-- =============================================
-- RLS POLICIES — Multi-tenant isolation
-- =============================================

-- Helper function: get tenant_id for current user
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- TENANTS RLS
CREATE POLICY "Users see own tenant" ON public.tenants
  FOR SELECT USING (id = public.get_user_tenant_id());
CREATE POLICY "Super admins manage tenants" ON public.tenants
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- VEHICLES RLS
CREATE POLICY "Tenant members see vehicles" ON public.vehicles
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Admins manage vehicles" ON public.vehicles
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- DEVICES RLS
CREATE POLICY "Tenant members see devices" ON public.devices
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Admins manage devices" ON public.devices
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  );

-- TELEMETRY_EVENTS RLS
CREATE POLICY "Tenant members see telemetry" ON public.telemetry_events
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Service inserts telemetry" ON public.telemetry_events
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

-- COLD_CHAIN_LOGS RLS
CREATE POLICY "Tenant members see cold chain" ON public.cold_chain_logs
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Service inserts cold chain" ON public.cold_chain_logs
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

-- POLICIES RLS
CREATE POLICY "Tenant members see policies" ON public.policies
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Admins manage policies" ON public.policies
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- ALERTS RLS
CREATE POLICY "Tenant members see alerts" ON public.alerts
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Tenant members manage alerts" ON public.alerts
  FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Service inserts alerts" ON public.alerts
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

-- EVIDENCE_RECORDS RLS
CREATE POLICY "Tenant members see evidence" ON public.evidence_records
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Auditors see evidence" ON public.evidence_records
  FOR SELECT USING (public.has_role(auth.uid(), 'auditor'));

-- GEOFENCES RLS
CREATE POLICY "Tenant members see geofences" ON public.geofences
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Admins manage geofences" ON public.geofences
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- DRIVERS RLS
CREATE POLICY "Tenant members see drivers" ON public.drivers
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Admins manage drivers" ON public.drivers
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- Update timestamps triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_geofences_updated_at BEFORE UPDATE ON public.geofences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cold_chain_logs;
