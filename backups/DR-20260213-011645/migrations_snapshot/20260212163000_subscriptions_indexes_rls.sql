-- =====================================================================
-- Migration: Subscriptions, Payment Events, Performance Indexes & RLS
-- CELLVI 2.0 — Stripe integration + DB security hardening
-- =====================================================================

-- ── Subscriptions table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  customer_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  plan_key TEXT,
  billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  amount_total BIGINT,
  currency TEXT DEFAULT 'COP',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Payment events (invoice log) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_invoice_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  amount BIGINT,
  currency TEXT,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending')),
  failure_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Performance indexes ─────────────────────────────────────────────

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_email ON public.subscriptions (customer_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON public.subscriptions (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON public.subscriptions (created_at DESC);

-- Payment events indexes
CREATE INDEX IF NOT EXISTS idx_payment_events_customer_id ON public.payment_events (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_status ON public.payment_events (status);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON public.payment_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_events_invoice_id ON public.payment_events (stripe_invoice_id);

-- Profiles indexes (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email)';
    EXECUTE 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT ''free''';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles (subscription_status)';
  END IF;
END $$;

-- Telemetry indexes (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'telemetry_events') THEN
    EXECUTE 'ALTER TABLE public.telemetry_events ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW()';
    EXECUTE 'ALTER TABLE public.telemetry_events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT ''unknown''';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_id ON public.telemetry_events (vehicle_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON public.telemetry_events (timestamp DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_telemetry_event_type ON public.telemetry_events (event_type)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_timestamp ON public.telemetry_events (vehicle_id, timestamp DESC)';
  END IF;
END $$;

-- Alerts indexes (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alerts') THEN
    EXECUTE 'ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT ''info''';
    EXECUTE 'ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()';
    EXECUTE 'ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT FALSE';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_alerts_vehicle_id ON public.alerts (vehicle_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts (severity)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts (created_at DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON public.alerts (acknowledged)';
  END IF;
END $$;

-- Geofences indexes (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'geofences') THEN
    EXECUTE 'ALTER TABLE public.geofences ADD COLUMN IF NOT EXISTS organization_id UUID';
    EXECUTE 'ALTER TABLE public.geofences ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_geofences_org_id ON public.geofences (organization_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_geofences_active ON public.geofences (is_active)';
  END IF;
END $$;

-- ── Row Level Security (RLS) ────────────────────────────────────────

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access on subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Authenticated users can read their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.jwt() ->> 'email' = customer_email);

-- Enable RLS on payment_events
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access on payment_events"
  ON public.payment_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- Users can read their own payment events
CREATE POLICY "Users can view own payments"
  ON public.payment_events
  FOR SELECT
  USING (
    stripe_customer_id IN (
      SELECT stripe_customer_id FROM public.subscriptions
      WHERE customer_email = auth.jwt() ->> 'email'
    )
  );

-- ── Updated_at trigger ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ── Realtime subscriptions ──────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_events;
