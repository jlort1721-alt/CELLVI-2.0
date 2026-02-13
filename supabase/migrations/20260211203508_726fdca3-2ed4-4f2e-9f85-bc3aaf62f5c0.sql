
-- =====================================================
-- IMMUTABLE AUDIT SYSTEM: Hash Chaining + Merkle Trees
-- =====================================================

-- 1. Device Certificates table (key rotation tracking)
CREATE TABLE public.device_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  fingerprint TEXT NOT NULL, -- SHA-256 of public key
  public_key_pem TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'ECDSA-P256-SHA256',
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revocation_reason TEXT,
  predecessor_id UUID REFERENCES public.device_certificates(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rotated', 'revoked', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_certs_device ON public.device_certificates(device_id);
CREATE INDEX idx_device_certs_fingerprint ON public.device_certificates(fingerprint);
CREATE UNIQUE INDEX idx_device_certs_active ON public.device_certificates(device_id) WHERE status = 'active';

ALTER TABLE public.device_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members see certs" ON public.device_certificates
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Admins manage certs" ON public.device_certificates
  FOR ALL USING (
    tenant_id = get_user_tenant_id() AND (
      has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
    )
  );

-- 2. Add hash-chain columns to evidence_records
ALTER TABLE public.evidence_records
  ADD COLUMN IF NOT EXISTS prev_hash TEXT,
  ADD COLUMN IF NOT EXISTS chain_index BIGINT,
  ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS device_signature TEXT,
  ADD COLUMN IF NOT EXISTS merkle_root_id UUID,
  ADD COLUMN IF NOT EXISTS merkle_leaf_index INTEGER;

CREATE INDEX idx_evidence_chain ON public.evidence_records(tenant_id, chain_index);
CREATE INDEX idx_evidence_merkle ON public.evidence_records(merkle_root_id);

-- 3. Merkle Roots table (batch integrity anchors)
CREATE TABLE public.merkle_roots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  root_hash TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'SHA-256',
  leaf_count INTEGER NOT NULL,
  first_chain_index BIGINT NOT NULL,
  last_chain_index BIGINT NOT NULL,
  first_event_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_event_at TIMESTAMP WITH TIME ZONE NOT NULL,
  tree_depth INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.merkle_roots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members see merkle roots" ON public.merkle_roots
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Auditors see merkle roots" ON public.merkle_roots
  FOR SELECT USING (has_role(auth.uid(), 'auditor'));

-- 4. Evidence Exports table (audit trail for exports)
CREATE TABLE public.evidence_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  exported_by UUID,
  record_count INTEGER NOT NULL,
  merkle_root_ids UUID[] NOT NULL DEFAULT '{}',
  bundle_hash TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'json',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.evidence_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members see exports" ON public.evidence_exports
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Auditors see exports" ON public.evidence_exports
  FOR SELECT USING (has_role(auth.uid(), 'auditor'));

-- 5. Sequence for chain index (per-tenant append-only counter)
CREATE OR REPLACE FUNCTION public.next_chain_index(p_tenant_id UUID)
RETURNS BIGINT
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(chain_index), 0) + 1
  FROM public.evidence_records
  WHERE tenant_id = p_tenant_id
$$;

-- 6. Function to get latest hash in chain
CREATE OR REPLACE FUNCTION public.get_latest_chain_hash(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sha256_hash
  FROM public.evidence_records
  WHERE tenant_id = p_tenant_id
  ORDER BY chain_index DESC NULLS LAST
  LIMIT 1
$$;
