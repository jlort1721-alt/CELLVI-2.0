
-- GNSS Anomaly Detection System
-- Stores detected spoofing/jamming events with confidence scores

CREATE TABLE public.gnss_anomalies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  device_id UUID REFERENCES public.devices(id),
  ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Detection classification
  anomaly_type TEXT NOT NULL DEFAULT 'unknown', -- spoofing, jamming, interference, drift, unknown
  confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0, -- 0.0 to 1.0
  severity TEXT NOT NULL DEFAULT 'low', -- low, medium, high, critical
  
  -- GNSS quality features at detection time
  satellites INTEGER,
  hdop DOUBLE PRECISION,
  snr_avg DOUBLE PRECISION, -- average signal-to-noise ratio
  snr_variance DOUBLE PRECISION,
  
  -- Kinematic features
  speed DOUBLE PRECISION,
  speed_delta DOUBLE PRECISION, -- sudden speed change
  heading DOUBLE PRECISION,
  heading_delta DOUBLE PRECISION, -- sudden heading change
  altitude DOUBLE PRECISION,
  altitude_delta DOUBLE PRECISION,
  
  -- Position coherence
  position_jump_m DOUBLE PRECISION, -- distance from last known position
  expected_max_m DOUBLE PRECISION, -- max plausible distance given speed/time
  route_deviation_m DOUBLE PRECISION, -- deviation from planned route
  
  -- Multi-asset correlation
  fleet_anomaly_count INTEGER DEFAULT 0, -- how many vehicles anomalous simultaneously
  correlated_device_ids UUID[] DEFAULT '{}',
  
  -- Detection details
  features_snapshot JSONB NOT NULL DEFAULT '{}', -- all computed features for ML
  rules_triggered TEXT[] NOT NULL DEFAULT '{}', -- which heuristic rules fired
  ml_model_version TEXT, -- null for heuristic-only detections
  
  -- Response
  status TEXT NOT NULL DEFAULT 'open', -- open, investigating, confirmed, false_positive, resolved
  response_actions TEXT[] DEFAULT '{}', -- actions taken
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_gnss_anomalies_tenant_ts ON public.gnss_anomalies(tenant_id, ts DESC);
CREATE INDEX idx_gnss_anomalies_vehicle ON public.gnss_anomalies(vehicle_id, ts DESC);
CREATE INDEX idx_gnss_anomalies_severity ON public.gnss_anomalies(severity, status);
CREATE INDEX idx_gnss_anomalies_type ON public.gnss_anomalies(anomaly_type);

-- Enable RLS
ALTER TABLE public.gnss_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members see anomalies"
ON public.gnss_anomalies FOR SELECT
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Admins manage anomalies"
ON public.gnss_anomalies FOR UPDATE
USING (tenant_id = get_user_tenant_id() AND (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
));

CREATE POLICY "Service inserts anomalies"
ON public.gnss_anomalies FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());
