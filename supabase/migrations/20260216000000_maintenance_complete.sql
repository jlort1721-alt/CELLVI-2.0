-- Phase 3 Completion: Advanced Maintenance & Inventory
-- 2026-02-16

-- 1. SPARE PARTS (Inventario de Repuestos)
CREATE TABLE IF NOT EXISTS public.spare_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  part_number TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'filter', 'brake', 'fluid', 'tire', 'electrical'
  brand TEXT,
  current_stock DOUBLE PRECISION NOT NULL DEFAULT 0,
  min_stock_level DOUBLE PRECISION DEFAULT 5,
  unit_cost DOUBLE PRECISION DEFAULT 0,
  location_in_warehouse TEXT,
  supplier_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. MAINTENANCE PLANS (Mantenimiento Preventivo/Predictivo)
CREATE TABLE IF NOT EXISTS public.maintenance_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- e.g., "Cambio de Aceite 5000km"
  description TEXT,
  interval_km INTEGER, -- Run every X km
  interval_days INTEGER, -- Run every X days
  last_performed_at TIMESTAMPTZ,
  last_performed_odo DOUBLE PRECISION,
  status TEXT DEFAULT 'active', -- active, paused
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for spare_parts" ON public.spare_parts;
CREATE POLICY "Tenant isolation for spare_parts" ON public.spare_parts
    USING (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for maintenance_plans" ON public.maintenance_plans;
CREATE POLICY "Tenant isolation for maintenance_plans" ON public.maintenance_plans USING (tenant_id = get_user_tenant_id());

-- Indexes
CREATE INDEX idx_spare_parts_tenant ON public.spare_parts(tenant_id);
CREATE INDEX idx_maint_plans_vehicle ON public.maintenance_plans(vehicle_id);

-- Trigger for Updated At
CREATE TRIGGER update_spare_parts_updated_at BEFORE UPDATE ON public.spare_parts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_plans_updated_at BEFORE UPDATE ON public.maintenance_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
