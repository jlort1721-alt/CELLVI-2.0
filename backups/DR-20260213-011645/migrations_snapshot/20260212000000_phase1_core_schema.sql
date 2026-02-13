-- Phase 1 Core Schema Expansion: Operations, FUEC, Work Orders
-- 2026-02-12
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";

-- 1. TRIPS (Viajes)
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  driver_id UUID REFERENCES public.drivers(id),
  contract_id UUID, -- Link to FUEC contract if special transport
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, active, paused, completed, cancelled
  scheduled_start_at TIMESTAMPTZ,
  actual_start_at TIMESTAMPTZ,
  actual_end_at TIMESTAMPTZ,
  origin_name TEXT,
  origin_coords GEOGRAPHY(POINT),
  destination_name TEXT,
  destination_coords GEOGRAPHY(POINT),
  route_polyline GEOGRAPHY(LINESTRING),
  distance_expected_km DOUBLE PRECISION,
  distance_actual_km DOUBLE PRECISION,
  fuel_consumed_gal DOUBLE PRECISION,
  cargo_type TEXT,
  weight_kg DOUBLE PRECISION,
  manifest_ref TEXT, -- RNDC Manifest ID
  client_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TRIP EVENTS (Checkpoints, Stoppages)
CREATE TABLE public.trip_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- checkpoint, rest_stop, loading, unloading, anomaly
  status TEXT NOT NULL DEFAULT 'completed',
  coords GEOGRAPHY(POINT),
  location_name TEXT,
  notes TEXT,
  evidence_urls TEXT[],
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. FUEC CONTRACTS (Contratos Transporte Especial)
CREATE TABLE public.fuec_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_nit TEXT,
  object_description TEXT,
  route_origin TEXT,
  route_destination TEXT,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, suspended
  pdf_url TEXT,
  signed_by UUID, -- Authentication user
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link trips to contracts
ALTER TABLE public.trips ADD FOREIGN KEY (contract_id) REFERENCES public.fuec_contracts(id);

-- 4. WORK ORDERS (Ordenes de Trabajo)
CREATE TABLE public.work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  type TEXT NOT NULL DEFAULT 'preventive', -- preventive, corrective, predictive
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, waiting_parts, completed, cancelled
  priority TEXT NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  odometer_reading DOUBLE PRECISION,
  provider_name TEXT,
  total_cost DOUBLE PRECISION DEFAULT 0,
  invoice_ref TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_to UUID, -- internal mechanic if any
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. WORK ORDER ITEMS (Line Items)
CREATE TABLE public.work_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL DEFAULT 1,
  unit_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'part', -- part, labor, consumable
  sku TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TRIP COMMENTS (Chat por Entidad)
CREATE TABLE public.trip_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  attachments TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ESCALATION LOGS (For Escalation Service)
CREATE TABLE public.escalation_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
    escalated_to_email TEXT NOT NULL,
    escalation_level INT NOT NULL DEFAULT 1,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS & Indexing
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuec_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_logs ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_trips_tenant ON public.trips(tenant_id, status);
CREATE INDEX idx_trips_vehicle ON public.trips(vehicle_id);
CREATE INDEX idx_contracts_tenant ON public.fuec_contracts(tenant_id, valid_until);
CREATE INDEX idx_work_orders_tenant ON public.work_orders(tenant_id, status);
CREATE INDEX idx_trip_comments_trip ON public.trip_comments(trip_id, created_at);

-- RLS Policies (Simplified for Phase 1)
-- Tenant Isolation
CREATE POLICY "Tenant isolation for trips" ON public.trips USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant isolation for events" ON public.trip_events USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant isolation for contracts" ON public.fuec_contracts USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant isolation for work orders" ON public.work_orders USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant isolation for work items" ON public.work_order_items USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant isolation for comments" ON public.trip_comments USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant isolation for logs" ON public.escalation_logs USING (tenant_id = get_user_tenant_id());

-- Update Triggers
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fuec_contracts_updated_at BEFORE UPDATE ON public.fuec_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
