/**
 * Webhook System Migration
 *
 * Creates tables and triggers for enterprise webhook functionality:
 * - webhook_endpoints: Subscriber webhook configurations
 * - webhook_deliveries: Delivery attempts with retry logic
 * - webhook_events: Event log for audit trail
 *
 * Features:
 * - Multi-tenant isolation
 * - Automatic retry with exponential backoff
 * - Event filtering by type
 * - Delivery status tracking
 * - RLS policies for security
 */

-- ============================================================================
-- WEBHOOK ENDPOINTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Endpoint configuration
  url TEXT NOT NULL CHECK (url ~ '^https?://'),
  description TEXT,

  -- Event filtering (array of event types to subscribe to)
  event_types TEXT[] NOT NULL DEFAULT ARRAY['*'], -- '*' means all events

  -- Security
  secret TEXT NOT NULL, -- HMAC signing secret (generate on create)

  -- Status
  active BOOLEAN NOT NULL DEFAULT true,

  -- Retry configuration
  max_retries INTEGER NOT NULL DEFAULT 3,
  retry_delay_seconds INTEGER NOT NULL DEFAULT 60,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ,

  -- Indexes
  UNIQUE(tenant_id, url)
);

CREATE INDEX idx_webhook_endpoints_tenant_id ON webhook_endpoints(tenant_id);
CREATE INDEX idx_webhook_endpoints_active ON webhook_endpoints(active) WHERE active = true;

COMMENT ON TABLE webhook_endpoints IS 'Tenant webhook endpoint configurations with event filtering';

-- ============================================================================
-- WEBHOOK EVENTS TABLE (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Event data
  event_type TEXT NOT NULL, -- 'order.created', 'trip.updated', 'alert.triggered', etc.
  resource_type TEXT NOT NULL, -- 'order', 'trip', 'alert', etc.
  resource_id UUID NOT NULL,
  payload JSONB NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  UNIQUE(tenant_id, event_type, resource_id, created_at) -- Prevent duplicate events
);

CREATE INDEX idx_webhook_events_tenant_id ON webhook_events(tenant_id);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at DESC);

COMMENT ON TABLE webhook_events IS 'Immutable audit trail of all webhook events';

-- ============================================================================
-- WEBHOOK DELIVERIES TABLE (Delivery Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Delivery attempt
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),

  -- Response tracking
  http_status_code INTEGER,
  response_body TEXT,
  error_message TEXT,

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  -- Request details
  request_headers JSONB,
  request_body JSONB NOT NULL,
  response_headers JSONB
);

CREATE INDEX idx_webhook_deliveries_event_id ON webhook_deliveries(event_id);
CREATE INDEX idx_webhook_deliveries_endpoint_id ON webhook_deliveries(endpoint_id);
CREATE INDEX idx_webhook_deliveries_tenant_id ON webhook_deliveries(tenant_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at) WHERE status = 'retrying';

COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery attempts with retry tracking';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Webhook Endpoints Policies
CREATE POLICY "Tenants can view their own webhook endpoints"
  ON webhook_endpoints FOR SELECT
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Tenants can create their own webhook endpoints"
  ON webhook_endpoints FOR INSERT
  WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Tenants can update their own webhook endpoints"
  ON webhook_endpoints FOR UPDATE
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Tenants can delete their own webhook endpoints"
  ON webhook_endpoints FOR DELETE
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

-- Webhook Events Policies (Read-only for tenants)
CREATE POLICY "Tenants can view their own webhook events"
  ON webhook_events FOR SELECT
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

-- Webhook Deliveries Policies (Read-only for tenants)
CREATE POLICY "Tenants can view their own webhook deliveries"
  ON webhook_deliveries FOR SELECT
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

/**
 * Generate a secure webhook secret (32 bytes hex)
 */
CREATE OR REPLACE FUNCTION generate_webhook_secret()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Calculate HMAC signature for webhook payload
 */
CREATE OR REPLACE FUNCTION calculate_webhook_signature(
  secret TEXT,
  payload TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(hmac(payload, secret, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

/**
 * Find webhook endpoints subscribed to an event type
 */
CREATE OR REPLACE FUNCTION find_subscribed_endpoints(
  p_tenant_id UUID,
  p_event_type TEXT
)
RETURNS SETOF webhook_endpoints AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM webhook_endpoints
  WHERE tenant_id = p_tenant_id
    AND active = true
    AND (
      '*' = ANY(event_types) OR
      p_event_type = ANY(event_types)
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-generate secret on webhook endpoint creation
CREATE OR REPLACE FUNCTION auto_generate_webhook_secret()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.secret IS NULL OR NEW.secret = '' THEN
    NEW.secret := generate_webhook_secret();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhook_endpoints_auto_secret
  BEFORE INSERT ON webhook_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_webhook_secret();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_endpoint_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhook_endpoints_update_timestamp
  BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_endpoint_timestamp();

-- ============================================================================
-- EXAMPLE EVENT TYPES
-- ============================================================================

COMMENT ON COLUMN webhook_endpoints.event_types IS
'Event types to subscribe to. Examples:
  - order.created
  - order.updated
  - order.cancelled
  - trip.started
  - trip.completed
  - alert.triggered
  - vehicle.location_updated
  - driver.assigned
  Use ["*"] to subscribe to all events';

-- ============================================================================
-- SEED DATA (Optional - for testing)
-- ============================================================================

-- Example: Create a test webhook endpoint (commented out for production)
-- INSERT INTO webhook_endpoints (tenant_id, url, description, event_types, active)
-- VALUES (
--   'e9259174-275d-4f16-95aa-28267df3c942', -- Replace with actual tenant_id
--   'https://webhook.site/unique-url',
--   'Test webhook endpoint',
--   ARRAY['order.created', 'trip.completed'],
--   true
-- );
