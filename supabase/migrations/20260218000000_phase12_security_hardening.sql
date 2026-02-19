-- ============================================================================
-- Phase 12: Security Hardening Migration
-- ============================================================================
-- 1. Create api_keys table for proper key rotation
-- 2. Create feature_flags table for per-tenant toggles
-- 3. Create notification_preferences table
-- 4. Audit and enforce RLS on all tables
-- 5. Add missing indexes for performance
-- ============================================================================

-- ============================================================================
-- 1. API KEYS TABLE (replaces inline tenant api_key)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'default',
  key_hash TEXT NOT NULL, -- bcrypt hash of the API key (never store plaintext)
  key_prefix TEXT NOT NULL, -- first 8 chars for identification (e.g., "ask_1234")
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read']::TEXT[], -- 'read', 'write', 'admin'
  rate_limit_per_minute INT NOT NULL DEFAULT 60,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  CONSTRAINT api_keys_unique_prefix UNIQUE (tenant_id, key_prefix)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON public.api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys(tenant_id, is_active) WHERE is_active = true;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for api_keys" ON public.api_keys
  FOR ALL USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Admin can manage api_keys" ON public.api_keys
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() IN ('admin', 'owner')
  );

-- Trigger for updated_at
CREATE TRIGGER set_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 2. FEATURE FLAGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  flag_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT feature_flags_unique UNIQUE (tenant_id, flag_name)
);

-- NULL tenant_id = global flag
CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant ON public.feature_flags(tenant_id, flag_name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_global ON public.feature_flags(flag_name) WHERE tenant_id IS NULL;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read feature flags" ON public.feature_flags
  FOR SELECT USING (
    tenant_id IS NULL  -- Global flags readable by all
    OR tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Admin can manage feature flags" ON public.feature_flags
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() IN ('admin', 'owner')
  );

CREATE TRIGGER set_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 3. NOTIFICATION PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'sms', 'in_app')),
  category TEXT NOT NULL CHECK (category IN ('alerts', 'maintenance', 'compliance', 'billing', 'system')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start TIME, -- e.g., '22:00'
  quiet_hours_end TIME,   -- e.g., '07:00'
  min_severity TEXT CHECK (min_severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notification_prefs_unique UNIQUE (user_id, channel, category)
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_tenant ON public.notification_preferences(tenant_id);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification prefs" ON public.notification_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE TRIGGER set_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 4. RLS AUDIT - Ensure all sensitive tables have RLS
-- ============================================================================

-- These ALTER statements are idempotent (safe to re-run)
ALTER TABLE IF EXISTS public.device_messages_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cold_chain_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.compliance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vehicle_last_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vehicle_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.digital_twin_state ENABLE ROW LEVEL SECURITY;

-- RLS policies for device_messages_raw (high-volume IoT data)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'device_messages_raw' AND policyname = 'Tenant isolation for device_messages_raw'
  ) THEN
    CREATE POLICY "Tenant isolation for device_messages_raw" ON public.device_messages_raw
      FOR ALL USING (
        device_id IN (
          SELECT id FROM public.devices WHERE tenant_id = public.get_user_tenant_id()
        )
      );
  END IF;
END $$;

-- RLS policies for vehicle_last_positions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_last_positions' AND policyname = 'Tenant isolation for vehicle_last_positions'
  ) THEN
    CREATE POLICY "Tenant isolation for vehicle_last_positions" ON public.vehicle_last_positions
      FOR SELECT USING (
        vehicle_id IN (
          SELECT id FROM public.vehicles WHERE tenant_id = public.get_user_tenant_id()
        )
      );
  END IF;
END $$;

-- RLS policies for vehicle_telemetry
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_telemetry' AND policyname = 'Tenant isolation for vehicle_telemetry'
  ) THEN
    CREATE POLICY "Tenant isolation for vehicle_telemetry" ON public.vehicle_telemetry
      FOR SELECT USING (
        vehicle_id IN (
          SELECT id FROM public.vehicles WHERE tenant_id = public.get_user_tenant_id()
        )
      );
  END IF;
END $$;

-- RLS policies for digital_twin_state
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'digital_twin_state' AND policyname = 'Tenant isolation for digital_twin_state'
  ) THEN
    CREATE POLICY "Tenant isolation for digital_twin_state" ON public.digital_twin_state
      FOR ALL USING (
        vehicle_id IN (
          SELECT id FROM public.vehicles WHERE tenant_id = public.get_user_tenant_id()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 5. MISSING COMPOSITE INDEXES FOR PERFORMANCE
-- ============================================================================

-- gnss_anomalies: frequently filtered by tenant + time
CREATE INDEX IF NOT EXISTS idx_gnss_anomalies_tenant_time
  ON public.gnss_anomalies(tenant_id, detected_at DESC);

-- rndc_logs: filtered by status + creation time
CREATE INDEX IF NOT EXISTS idx_rndc_logs_status_created
  ON public.rndc_logs(status, created_at DESC);

-- compliance_documents: filtered by status + creation time
CREATE INDEX IF NOT EXISTS idx_compliance_docs_status_created
  ON public.compliance_documents(status, created_at DESC);

-- pesv_inspections: filtered by vehicle + date
CREATE INDEX IF NOT EXISTS idx_pesv_inspections_vehicle_date
  ON public.pesv_inspections(vehicle_id, inspection_date DESC);

-- telemetry_events: high-volume time-series queries
CREATE INDEX IF NOT EXISTS idx_telemetry_events_device_ts
  ON public.telemetry_events(device_id, ts DESC);

-- alerts: frequently filtered by tenant + severity + status
CREATE INDEX IF NOT EXISTS idx_alerts_tenant_severity
  ON public.alerts(tenant_id, severity, status);

-- work_orders: filtered by vehicle + status
CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle_status
  ON public.work_orders(vehicle_id, status);

-- ============================================================================
-- 6. INSERT DEFAULT GLOBAL FEATURE FLAGS
-- ============================================================================

INSERT INTO public.feature_flags (tenant_id, flag_name, is_enabled, metadata) VALUES
  (NULL, 'ai_chatbot', true, '{"description": "Enable AI chatbot (Neuro-Core)"}'),
  (NULL, 'route_optimization', true, '{"description": "Enable Route Genius optimization"}'),
  (NULL, 'fatigue_detection', true, '{"description": "Enable Vision Guard fatigue detection"}'),
  (NULL, 'cold_chain_monitoring', true, '{"description": "Enable cold chain temperature monitoring"}'),
  (NULL, 'predictive_maintenance', false, '{"description": "Enable predictive maintenance ML models"}'),
  (NULL, 'digital_twin', false, '{"description": "Enable 3D digital twin visualization"}')
ON CONFLICT (tenant_id, flag_name) DO NOTHING;

-- ============================================================================
-- DONE
-- ============================================================================
