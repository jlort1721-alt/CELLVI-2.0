
-- ═══════════════════════════════════════════════════════════
-- COMPLIANCE MODULE: Ley 1581/2012 + PESV Colombia
-- ═══════════════════════════════════════════════════════════

-- 1. Consent Records (Ley 1581 Art. 9 - Autorización del titular)
CREATE TABLE public.consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  subject_name TEXT NOT NULL,
  subject_id_type TEXT NOT NULL DEFAULT 'CC', -- CC, CE, NIT, PP, TI
  subject_id_number TEXT NOT NULL,
  subject_email TEXT,
  subject_phone TEXT,
  purpose TEXT NOT NULL, -- tracking, cold_chain, evidence, marketing, etc.
  consent_type TEXT NOT NULL DEFAULT 'explicit', -- explicit, implicit, legitimate_interest
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revocation_reason TEXT,
  channel TEXT NOT NULL DEFAULT 'platform', -- platform, paper, email, verbal
  evidence_url TEXT, -- link to signed document
  retention_days INTEGER NOT NULL DEFAULT 1825, -- 5 years default
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members see consents" ON public.consent_records
  FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Admins manage consents" ON public.consent_records
  FOR ALL USING (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
  ));

-- 2. Data Subject Requests (ARCO: Acceso, Rectificación, Cancelación, Oposición)
CREATE TABLE public.data_subject_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  radicado TEXT NOT NULL DEFAULT (('DSR-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6))),
  subject_name TEXT NOT NULL,
  subject_id_number TEXT NOT NULL,
  subject_email TEXT NOT NULL,
  request_type TEXT NOT NULL, -- access, rectification, cancellation, opposition
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received', -- received, in_progress, completed, rejected
  response_text TEXT,
  response_deadline TIMESTAMP WITH TIME ZONE, -- 15 business days per Ley 1581
  responded_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID,
  audit_trail JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members see DSR" ON public.data_subject_requests
  FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Admins manage DSR" ON public.data_subject_requests
  FOR ALL USING (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
  ));

-- 3. PESV Pre-Operational Inspections
CREATE TABLE public.pesv_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  driver_id UUID REFERENCES public.drivers(id),
  inspection_type TEXT NOT NULL DEFAULT 'pre_operational', -- pre_operational, post_operational, periodic
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, observations
  checklist JSONB NOT NULL DEFAULT '[]', -- array of {item, checked, observation}
  overall_score DOUBLE PRECISION,
  observations TEXT,
  evidence_photos TEXT[] DEFAULT '{}',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pesv_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members see inspections" ON public.pesv_inspections
  FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Operators manage inspections" ON public.pesv_inspections
  FOR ALL USING (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'operator'::app_role) OR
    has_role(auth.uid(), 'driver'::app_role)
  ));

-- 4. Preventive Maintenance Logs (PESV)
CREATE TABLE public.maintenance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  maintenance_type TEXT NOT NULL DEFAULT 'preventive', -- preventive, corrective, predictive
  description TEXT NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed, overdue
  cost DOUBLE PRECISION,
  provider TEXT,
  odometer_at_service DOUBLE PRECISION,
  next_service_km DOUBLE PRECISION,
  next_service_date DATE,
  documents TEXT[] DEFAULT '{}',
  observations TEXT,
  completed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members see maintenance" ON public.maintenance_logs
  FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Admins manage maintenance" ON public.maintenance_logs
  FOR ALL USING (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  ));

-- 5. Document Control (Gestión Documental PESV + Ley 1581)
CREATE TABLE public.compliance_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  category TEXT NOT NULL, -- pesv, data_protection, policy, procedure, certificate, license
  subcategory TEXT, -- driver_license, soat, rtm, insurance, privacy_policy, consent_template
  title TEXT NOT NULL,
  description TEXT,
  document_url TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, expired, archived
  effective_date DATE,
  expiry_date DATE,
  responsible_role TEXT,
  review_frequency_days INTEGER DEFAULT 365,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  next_review_at TIMESTAMP WITH TIME ZONE,
  related_vehicle_id UUID REFERENCES public.vehicles(id),
  related_driver_id UUID REFERENCES public.drivers(id),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members see docs" ON public.compliance_documents
  FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Admins manage docs" ON public.compliance_documents
  FOR ALL USING (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  ));

-- 6. Compliance Audit Logs (append-only)
CREATE TABLE public.compliance_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  module TEXT NOT NULL, -- consent, dsr, inspection, maintenance, document
  action TEXT NOT NULL, -- create, update, approve, reject, revoke, export, view
  entity_id UUID,
  entity_type TEXT,
  user_id UUID,
  user_email TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_compliance_audit_tenant_ts ON public.compliance_audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_compliance_audit_module ON public.compliance_audit_logs(module, action);

ALTER TABLE public.compliance_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members see audit logs" ON public.compliance_audit_logs
  FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Service inserts audit logs" ON public.compliance_audit_logs
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

-- Indexes
CREATE INDEX idx_consent_tenant ON public.consent_records(tenant_id, created_at DESC);
CREATE INDEX idx_dsr_tenant ON public.data_subject_requests(tenant_id, created_at DESC);
CREATE INDEX idx_inspections_tenant ON public.pesv_inspections(tenant_id, inspection_date DESC);
CREATE INDEX idx_maintenance_tenant ON public.maintenance_logs(tenant_id, scheduled_date DESC);
CREATE INDEX idx_docs_tenant ON public.compliance_documents(tenant_id, category);

-- Triggers for updated_at
CREATE TRIGGER update_consent_records_updated_at BEFORE UPDATE ON public.consent_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dsr_updated_at BEFORE UPDATE ON public.data_subject_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON public.pesv_inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON public.maintenance_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_docs_updated_at BEFORE UPDATE ON public.compliance_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
