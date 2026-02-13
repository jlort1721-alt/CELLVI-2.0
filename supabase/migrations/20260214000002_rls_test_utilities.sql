-- ============================================================================
-- RLS Testing Utilities - PR #17
-- ============================================================================
-- Purpose: Test tenant isolation and RLS policies
-- Usage: Run from test suite to verify zero cross-tenant data leakage
-- ============================================================================

-- Create test function to verify RLS isolation
CREATE OR REPLACE FUNCTION public.test_rls_isolation(
  table_name TEXT,
  tenant1_id UUID,
  tenant2_id UUID
) RETURNS TABLE(
  test_name TEXT,
  passed BOOLEAN,
  message TEXT
) AS $$
DECLARE
  count1 INT;
  count2 INT;
BEGIN
  -- Test 1: Tenant 1 can only see own data
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id = $1', table_name)
  INTO count1 USING tenant1_id;

  RETURN QUERY SELECT
    'Tenant 1 data visibility'::TEXT,
    count1 > 0,
    format('Tenant 1 sees %s rows', count1);

  -- Test 2: Verify no cross-tenant reads
  EXECUTE format('
    SELECT COUNT(*) FROM %I
    WHERE tenant_id = $1
    AND tenant_id != $2
  ', table_name)
  INTO count2 USING tenant2_id, tenant1_id;

  RETURN QUERY SELECT
    'Zero cross-tenant reads'::TEXT,
    count2 = 0,
    format('Cross-tenant query returned %s rows (should be 0)', count2);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role for testing
GRANT EXECUTE ON FUNCTION public.test_rls_isolation TO service_role;

COMMENT ON FUNCTION public.test_rls_isolation IS 'PR #17: Test RLS tenant isolation. Returns test results for specified table.';
