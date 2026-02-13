-- Add missing columns to vehicles table if they don't exist
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS last_location jsonb DEFAULT '{"lat": 4.6097, "lng": -74.0817, "speed": 0, "heading": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS last_status text DEFAULT 'offline';

-- Create an index for faster geospatial queries if needed in future (using GIN on jsonb is one way, or extract to PostGIS)
-- For now, just ensuring the columns exist is enough for the frontend.

-- Insert some dummy data if the table is empty to visualize the map
-- Insert some dummy data if the table is empty to visualize the map
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Check if a tenant exists
    SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;
    
    -- If not, create one
    IF v_tenant_id IS NULL THEN
        INSERT INTO public.tenants (name, slug) VALUES ('Demo Tenant', 'demo-tenant') RETURNING id INTO v_tenant_id;
    END IF;
    
    -- Insert vehicles using this tenant_id
    INSERT INTO public.vehicles (tenant_id, plate, last_location, last_status)
    SELECT v_tenant_id, 'TEST-001', '{"lat": 4.65, "lng": -74.05, "speed": 45, "heading": 90}', 'moving'
    WHERE NOT EXISTS (SELECT 1 FROM public.vehicles WHERE plate = 'TEST-001');

    INSERT INTO public.vehicles (tenant_id, plate, last_location, last_status)
    SELECT v_tenant_id, 'TEST-002', '{"lat": 4.62, "lng": -74.10, "speed": 0, "heading": 0}', 'stopped'
    WHERE NOT EXISTS (SELECT 1 FROM public.vehicles WHERE plate = 'TEST-002');
    
    INSERT INTO public.vehicles (tenant_id, plate, last_location, last_status)
    SELECT v_tenant_id, 'TEST-003', '{"lat": 4.70, "lng": -74.08, "speed": 80, "heading": 180}', 'alert'
    WHERE NOT EXISTS (SELECT 1 FROM public.vehicles WHERE plate = 'TEST-003');

END $$;
