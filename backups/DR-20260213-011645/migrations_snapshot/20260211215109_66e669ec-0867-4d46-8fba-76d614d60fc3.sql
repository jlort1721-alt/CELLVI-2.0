-- ═══════════════════════════════════════════════════════════
-- Device Gateway: Store & Forward + Deduplication Pipeline
-- ═══════════════════════════════════════════════════════════

-- Raw message store for store & forward pattern
CREATE TABLE public.device_messages_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  device_id uuid REFERENCES public.devices(id),
  imei text NOT NULL,
  protocol text NOT NULL DEFAULT 'unknown',
  raw_payload jsonb NOT NULL,
  normalized_payload jsonb,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  next_retry_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  error_message text,
  event_count integer NOT NULL DEFAULT 0,
  sequence_number bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for idempotency / deduplication
CREATE UNIQUE INDEX idx_device_messages_dedup ON public.device_messages_raw(idempotency_key);

-- Retry queue index: find pending/failed messages ready for retry
CREATE INDEX idx_device_messages_retry ON public.device_messages_raw(status, next_retry_at)
  WHERE status IN ('pending', 'failed');

-- Protocol + IMEI index for device lookups
CREATE INDEX idx_device_messages_imei ON public.device_messages_raw(imei, created_at DESC);

-- Tenant partition index
CREATE INDEX idx_device_messages_tenant ON public.device_messages_raw(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.device_messages_raw ENABLE ROW LEVEL SECURITY;

-- Service role can insert (from edge functions)
CREATE POLICY "Service inserts raw messages"
  ON public.device_messages_raw FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- Tenant members can view their messages
CREATE POLICY "Tenant members see raw messages"
  ON public.device_messages_raw FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Service can update status (retries, processing)
CREATE POLICY "Service updates raw messages"
  ON public.device_messages_raw FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

-- ═══════════════════════════════════════════════════════════
-- Protocol registry: track supported protocols and versions
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.protocol_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  status text NOT NULL DEFAULT 'active',
  parser_config jsonb NOT NULL DEFAULT '{}',
  field_mapping jsonb NOT NULL DEFAULT '{}',
  sample_payload jsonb,
  devices_count integer NOT NULL DEFAULT 0,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.protocol_registry ENABLE ROW LEVEL SECURITY;

-- Protocols are globally readable by authenticated users
CREATE POLICY "Authenticated users see protocols"
  ON public.protocol_registry FOR SELECT
  TO authenticated USING (true);

-- Only super_admins manage protocols
CREATE POLICY "Super admins manage protocols"
  ON public.protocol_registry FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- Seed initial protocol configurations
INSERT INTO public.protocol_registry (protocol_name, display_name, version, parser_config, field_mapping) VALUES
  ('teltonika', 'Teltonika FM', '1.0', 
    '{"codec": "codec8e", "tcp_port": 5027, "batch_support": true}',
    '{"io_68": "speed", "io_66": "fuel_level", "io_72": "temperature", "io_239": "ignition"}'
  ),
  ('queclink', 'Queclink GL', '1.0',
    '{"format": "csv", "tcp_port": 5028, "delimiter": ",", "header_prefix": "+RESP"}',
    '{"field_4": "latitude", "field_5": "longitude", "field_6": "altitude", "field_7": "speed"}'
  ),
  ('concox', 'Concox/Jimi', '1.0',
    '{"format": "binary", "tcp_port": 5029, "login_packet": true}',
    '{"byte_12": "latitude", "byte_16": "longitude", "byte_20": "speed", "byte_22": "heading"}'
  ),
  ('generic_json', 'API JSON Genérico', '1.0',
    '{"format": "json", "auth": "api_key", "batch_support": true}',
    '{"lat": "latitude", "lng": "longitude", "spd": "speed", "hdg": "heading"}'
  ),
  ('obd2', 'OBD-II Bluetooth', '1.0',
    '{"format": "json", "connection": "bluetooth", "pids": ["0C", "0D", "05"]}',
    '{"pid_0C": "rpm", "pid_0D": "speed", "pid_05": "coolant_temp"}'
  );

-- Add protocol column to devices if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'devices' AND column_name = 'protocol_version'
  ) THEN
    ALTER TABLE public.devices ADD COLUMN protocol_version text DEFAULT '1.0';
  END IF;
END $$;

-- Trigger for updated_at on protocol_registry
CREATE TRIGGER update_protocol_registry_updated_at
  BEFORE UPDATE ON public.protocol_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();