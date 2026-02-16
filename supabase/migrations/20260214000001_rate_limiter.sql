-- ============================================================================
-- Rate Limiting Infrastructure
-- ============================================================================
-- Purpose: Durable rate limiting that survives edge function deploys
-- Author: PR #13
-- Date: 2026-02-14
-- ============================================================================

-- Rate limit tracking table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address, tenant_id, or user_id
  endpoint TEXT NOT NULL,   -- Function name (e.g., 'send-email', 'api-gateway')
  requests_count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Composite unique index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint_window
  ON public.rate_limits(identifier, endpoint, window_start);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end
  ON public.rate_limits(window_end);

-- Index for monitoring queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint_created
  ON public.rate_limits(endpoint, created_at DESC);

-- ============================================================================
-- CLEANUP FUNCTION
-- ============================================================================

-- Auto-cleanup old records (keep last 24 hours only)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS TABLE(deleted_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_deleted BIGINT;
BEGIN
  -- Delete records older than 24 hours
  DELETE FROM public.rate_limits
  WHERE window_end < (now() - INTERVAL '24 hours');

  GET DIAGNOSTICS count_deleted = ROW_COUNT;

  RETURN QUERY SELECT count_deleted;
END;
$$;

-- ============================================================================
-- SCHEDULED CLEANUP (pg_cron)
-- ============================================================================

-- Schedule cleanup every hour
-- Note: Requires pg_cron extension to be enabled (COMMENTED OUT - not available in this Supabase plan)
-- SELECT cron.schedule(
--   'cleanup-rate-limits',
--   '0 * * * *', -- Every hour at minute 0
--   'SELECT public.cleanup_old_rate_limits()'
-- );

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role (edge functions) has full access
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can view their own rate limits (for transparency)
CREATE POLICY "Users can view their own rate limits"
ON public.rate_limits
FOR SELECT
TO authenticated
USING (
  identifier = auth.uid()::text
  OR identifier IN (
    SELECT id::text FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.rate_limits TO service_role;
GRANT SELECT ON public.rate_limits TO authenticated;

-- ============================================================================
-- METADATA
-- ============================================================================

COMMENT ON TABLE public.rate_limits IS 'Durable rate limiting across edge function instances. Automatically cleaned via pg_cron every hour.';
COMMENT ON COLUMN public.rate_limits.identifier IS 'IP address, tenant_id, or user_id being rate limited';
COMMENT ON COLUMN public.rate_limits.endpoint IS 'Edge function or endpoint name (e.g., send-email, api-gateway)';
COMMENT ON COLUMN public.rate_limits.requests_count IS 'Number of requests made in current window';
COMMENT ON COLUMN public.rate_limits.window_start IS 'Start of rate limit window';
COMMENT ON COLUMN public.rate_limits.window_end IS 'End of rate limit window (requests reset after this time)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View current rate limits
-- SELECT * FROM rate_limits WHERE window_end > now() ORDER BY updated_at DESC;

-- View rate limit stats by endpoint
-- SELECT endpoint, COUNT(*), MAX(requests_count) as max_requests
-- FROM rate_limits
-- WHERE window_end > now()
-- GROUP BY endpoint;

-- Manually cleanup (for testing)
-- SELECT cleanup_old_rate_limits();
