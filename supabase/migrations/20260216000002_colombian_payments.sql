-- ============================================================================
-- Colombian Payment System Integration (Wompi)
--
-- Supports:
-- - PSE (Pagos Seguros en Línea) - Bank transfers
-- - Nequi - Mobile wallet
-- - Card payments
-- - Payment status tracking
-- - Webhook processing
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE payment_method_type AS ENUM (
  'pse',           -- Bank transfer (Colombian PSE)
  'nequi',         -- Nequi mobile wallet
  'card',          -- Credit/Debit card
  'bancolombia',   -- Bancolombia transfer
  'efecty',        -- Efecty cash payment
  'baloto'         -- Baloto cash payment
);

CREATE TYPE payment_status AS ENUM (
  'pending',       -- Payment initiated, awaiting user action
  'processing',    -- Payment being processed
  'approved',      -- Payment approved
  'declined',      -- Payment declined by processor
  'voided',        -- Payment voided/cancelled
  'error'          -- Error during payment
);

CREATE TYPE payment_currency AS ENUM (
  'COP',           -- Colombian Peso
  'USD'            -- US Dollar (for international)
);

-- ============================================================================
-- PAYMENT TRANSACTIONS
-- ============================================================================

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant & Invoice relationship
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Payment details
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency payment_currency NOT NULL DEFAULT 'COP',
  payment_method payment_method_type NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',

  -- Wompi integration
  wompi_transaction_id TEXT UNIQUE, -- Wompi's transaction reference
  wompi_reference TEXT,              -- Our reference sent to Wompi
  wompi_payment_method_id TEXT,      -- Wompi payment method ID

  -- PSE specific fields
  pse_bank_code TEXT,                -- Bank code for PSE
  pse_bank_name TEXT,                -- Bank name (Bancolombia, Davivienda, etc)
  pse_user_type TEXT,                -- 'NATURAL' or 'JURIDICA'
  pse_user_legal_id_type TEXT,       -- 'CC', 'CE', 'NIT', 'TI', 'PP'
  pse_user_legal_id TEXT,            -- User's ID number
  pse_redirect_url TEXT,             -- PSE bank redirect URL

  -- Nequi specific fields
  nequi_phone_number TEXT,           -- User's Nequi phone number

  -- Card specific fields (if using cards)
  card_last_four TEXT,
  card_brand TEXT,                   -- 'VISA', 'MASTERCARD', 'AMEX'

  -- Customer information
  customer_email TEXT NOT NULL,
  customer_full_name TEXT,
  customer_phone TEXT,
  customer_legal_id TEXT,
  customer_legal_id_type TEXT,

  -- Payment URLs
  payment_link_url TEXT,             -- URL to send to customer
  redirect_url TEXT,                 -- Redirect after payment
  confirmation_url TEXT,             -- Webhook URL

  -- Status tracking
  paid_at TIMESTAMPTZ,
  declined_reason TEXT,
  error_message TEXT,

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Indexes
  CONSTRAINT valid_pse_fields CHECK (
    payment_method != 'pse' OR (
      pse_bank_code IS NOT NULL AND
      pse_user_type IS NOT NULL AND
      pse_user_legal_id_type IS NOT NULL AND
      pse_user_legal_id IS NOT NULL
    )
  ),
  CONSTRAINT valid_nequi_fields CHECK (
    payment_method != 'nequi' OR nequi_phone_number IS NOT NULL
  )
);

-- Indexes for performance
CREATE INDEX idx_payment_transactions_tenant ON payment_transactions(tenant_id);
CREATE INDEX idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_wompi_id ON payment_transactions(wompi_transaction_id);
CREATE INDEX idx_payment_transactions_created ON payment_transactions(created_at DESC);

-- RLS Policies
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant payments"
  ON payment_transactions FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Service role has full access to payments"
  ON payment_transactions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- PAYMENT METHODS (Stored payment methods for recurring payments)
-- ============================================================================

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Method details
  type payment_method_type NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,

  -- Wompi token (for recurring payments)
  wompi_token_id TEXT UNIQUE,

  -- Display information
  display_name TEXT NOT NULL,
  last_four TEXT,

  -- PSE stored info (for display only, not for charging)
  pse_bank_name TEXT,
  pse_user_legal_id_type TEXT,
  pse_user_legal_id_last_four TEXT,

  -- Nequi stored info
  nequi_phone_last_four TEXT,

  -- Card stored info
  card_brand TEXT,
  card_expiry_month INTEGER,
  card_expiry_year INTEGER,

  -- Status
  active BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_payment_methods_tenant ON payment_methods(tenant_id);
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(tenant_id, is_default) WHERE is_default = true;

-- RLS Policies
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert own payment methods"
  ON payment_methods FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own payment methods"
  ON payment_methods FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Service role has full access to payment methods"
  ON payment_methods FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- PAYMENT EVENTS (Audit trail for payment status changes)
-- ============================================================================

CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship
  payment_transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL, -- 'created', 'pending', 'processing', 'approved', 'declined', 'voided', 'error'
  previous_status payment_status,
  new_status payment_status NOT NULL,

  -- Wompi webhook data
  wompi_event_id TEXT,
  wompi_event_type TEXT,

  -- Error tracking
  error_code TEXT,
  error_message TEXT,

  -- Raw data from Wompi
  raw_response JSONB,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_events_transaction ON payment_events(payment_transaction_id);
CREATE INDEX idx_payment_events_tenant ON payment_events(tenant_id);
CREATE INDEX idx_payment_events_created ON payment_events(created_at DESC);

-- RLS Policies
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment events"
  ON payment_events FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Service role has full access to payment events"
  ON payment_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

/**
 * Update payment transaction status and create event
 */
CREATE OR REPLACE FUNCTION update_payment_status(
  p_transaction_id UUID,
  p_new_status payment_status,
  p_wompi_event_id TEXT DEFAULT NULL,
  p_wompi_event_type TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_raw_response JSONB DEFAULT NULL
) RETURNS payment_transactions AS $$
DECLARE
  v_transaction payment_transactions;
  v_previous_status payment_status;
BEGIN
  -- Get current transaction
  SELECT * INTO v_transaction
  FROM payment_transactions
  WHERE id = p_transaction_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
  END IF;

  v_previous_status := v_transaction.status;

  -- Update transaction
  UPDATE payment_transactions
  SET
    status = p_new_status,
    paid_at = CASE WHEN p_new_status = 'approved' THEN now() ELSE paid_at END,
    error_message = COALESCE(p_error_message, error_message),
    updated_at = now()
  WHERE id = p_transaction_id
  RETURNING * INTO v_transaction;

  -- Create event
  INSERT INTO payment_events (
    payment_transaction_id,
    tenant_id,
    event_type,
    previous_status,
    new_status,
    wompi_event_id,
    wompi_event_type,
    error_message,
    raw_response,
    created_at
  ) VALUES (
    p_transaction_id,
    v_transaction.tenant_id,
    p_new_status::text,
    v_previous_status,
    p_new_status,
    p_wompi_event_id,
    p_wompi_event_type,
    p_error_message,
    p_raw_response,
    now()
  );

  -- If approved, update invoice status
  IF p_new_status = 'approved' AND v_transaction.invoice_id IS NOT NULL THEN
    UPDATE invoices
    SET
      status = 'paid',
      paid_at = now(),
      updated_at = now()
    WHERE id = v_transaction.invoice_id;

    -- Activate subscription if pending
    IF v_transaction.subscription_id IS NOT NULL THEN
      UPDATE subscriptions
      SET status = 'active'
      WHERE id = v_transaction.subscription_id
        AND status = 'pending_payment';
    END IF;
  END IF;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get available PSE banks (Colombian banks supporting PSE)
 */
CREATE OR REPLACE FUNCTION get_pse_banks()
RETURNS TABLE (
  code TEXT,
  name TEXT,
  active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.code::TEXT,
    b.name::TEXT,
    b.active::BOOLEAN
  FROM (VALUES
    ('1007', 'Bancolombia', true),
    ('1001', 'Banco de Bogotá', true),
    ('1023', 'Banco de Occidente', true),
    ('1062', 'Banco Falabella', true),
    ('1060', 'Banco Pichincha', true),
    ('1002', 'Banco Popular', true),
    ('1058', 'Banco Procredit', true),
    ('1012', 'Banco GNB Sudameris', true),
    ('1006', 'Banco Corpbanca', true),
    ('1032', 'Banco Caja Social', true),
    ('1019', 'COLPATRIA', true),
    ('1051', 'Davivienda', true),
    ('1052', 'Banco AV Villas', true),
    ('1013', 'BBVA Colombia', true),
    ('1009', 'Citibank', true),
    ('1014', 'ITAU', true),
    ('1022', 'Banco Santander', true),
    ('1040', 'Banco Agrario', true),
    ('1066', 'Banco Cooperativo Coopcentral', true),
    ('1283', 'CFA Cooperativa Financiera', true),
    ('1291', 'Coofinep Cooperativa Financiera', true),
    ('1303', 'Giros y Finanzas', true),
    ('1370', 'Coltefinanciera', true),
    ('1551', 'Daviplata', true),
    ('1801', 'Movii', true),
    ('1551', 'Nequi', true)
  ) AS b(code, name, active);
END;
$$ LANGUAGE plpgsql;

/**
 * Auto-update updated_at timestamp
 */
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to payment tables
CREATE TRIGGER set_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE payment_transactions IS 'Stores all payment transactions processed through Wompi (PSE, Nequi, Cards)';
COMMENT ON TABLE payment_methods IS 'Stored payment methods for recurring payments';
COMMENT ON TABLE payment_events IS 'Audit trail for payment status changes';
COMMENT ON FUNCTION update_payment_status IS 'Updates payment status and creates audit event';
COMMENT ON FUNCTION get_pse_banks IS 'Returns list of Colombian banks supporting PSE';
