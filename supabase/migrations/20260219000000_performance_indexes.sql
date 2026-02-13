-- ============================================================================
-- Performance Indexes - PR #23
-- ============================================================================
-- Purpose: Optimize pagination, Realtime subscriptions, and common queries
-- Context: Supports PR #19-22 (pagination + Realtime subscriptions)
-- ============================================================================

-- ============================================================================
-- SECTION 1: Pagination Query Indexes
-- ============================================================================

-- profiles: Paginated in DashboardAdmin (PR #19)
-- Query: SELECT * FROM profiles ORDER BY created_at DESC LIMIT 20 OFFSET 0
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_created
ON public.profiles(tenant_id, created_at DESC);

-- Composite index for user_roles JOIN
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
ON public.user_roles(user_id, role);

-- telemetry_events: Paginated queries with vehicle filter (PR #20)
-- Query: SELECT * FROM telemetry_events WHERE vehicle_id = ? ORDER BY ts DESC LIMIT 100
CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_ts
ON public.telemetry_events(vehicle_id, ts DESC);

-- telemetry_events: Paginated queries without vehicle filter
-- Query: SELECT * FROM telemetry_events WHERE tenant_id = ? ORDER BY ts DESC LIMIT 100
CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_ts
ON public.telemetry_events(tenant_id, ts DESC);

-- alerts: Paginated queries (PR #20)
-- Query: SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50
CREATE INDEX IF NOT EXISTS idx_alerts_tenant_created
ON public.alerts(tenant_id, created_at DESC);

-- alerts: Filter by severity (common in useSecurityReport)
CREATE INDEX IF NOT EXISTS idx_alerts_severity_created
ON public.alerts(tenant_id, severity, created_at DESC);

-- evidence_records: Paginated queries (PR #20)
-- Query: SELECT * FROM evidence_records ORDER BY sealed_at DESC LIMIT 50
CREATE INDEX IF NOT EXISTS idx_evidence_tenant_sealed
ON public.evidence_records(tenant_id, sealed_at DESC);

-- cold_chain_logs: Paginated queries with vehicle filter (PR #20)
-- Query: SELECT * FROM cold_chain_logs WHERE vehicle_id = ? ORDER BY ts DESC LIMIT 100
CREATE INDEX IF NOT EXISTS idx_cold_chain_vehicle_ts
ON public.cold_chain_logs(vehicle_id, ts DESC);

-- cold_chain_logs: Paginated queries without vehicle filter
CREATE INDEX IF NOT EXISTS idx_cold_chain_tenant_ts
ON public.cold_chain_logs(tenant_id, ts DESC);

-- ============================================================================
-- SECTION 2: Realtime Subscription Optimization
-- ============================================================================

-- Realtime listens on INSERT events filtered by tenant_id
-- These indexes speed up the Postgres trigger evaluation

-- telemetry_events: useRealtimeTelemetry() subscription (PR #22)
-- Supabase Realtime filter: tenant_id=eq.{tenantId}
-- Already covered by idx_telemetry_tenant_ts above

-- alerts: useRealtimeAlerts() subscription (PR #21)
-- Supabase Realtime filter: tenant_id=eq.{tenantId}
-- Already covered by idx_alerts_tenant_created above

-- gnss_anomalies: useRealtimeGnss() subscription
-- Supabase Realtime filter: tenant_id=eq.{tenantId}
CREATE INDEX IF NOT EXISTS idx_gnss_anomalies_tenant_created
ON public.gnss_anomalies(tenant_id, created_at DESC);

-- ============================================================================
-- SECTION 3: Common Query Optimization
-- ============================================================================

-- vehicles: Frequently filtered by active status
-- Query: SELECT * FROM vehicles WHERE active = true ORDER BY plate
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_active
ON public.vehicles(tenant_id, active, plate);

-- drivers: Frequently ordered by score
-- Query: SELECT * FROM drivers ORDER BY score DESC
CREATE INDEX IF NOT EXISTS idx_drivers_tenant_score
ON public.drivers(tenant_id, score DESC);

-- policies: Frequently filtered by status
-- Query: SELECT * FROM policies WHERE status = 'active'
CREATE INDEX IF NOT EXISTS idx_policies_tenant_status
ON public.policies(tenant_id, status, created_at DESC);

-- geofences: Already indexed by geom in 20260217000000_scaling_indexes.sql
-- No additional index needed

-- devices: Frequently filtered by active status
CREATE INDEX IF NOT EXISTS idx_devices_tenant_active
ON public.devices(tenant_id, active, created_at DESC);

-- ============================================================================
-- SECTION 4: Report Query Optimization
-- ============================================================================

-- trips: Used in useOperationalReport for fuel efficiency calculation
-- Query: SELECT * FROM trips WHERE status = 'completed' AND actual_end_at BETWEEN ? AND ?
CREATE INDEX IF NOT EXISTS idx_trips_tenant_status_end
ON public.trips(tenant_id, status, actual_end_at DESC);

-- work_orders: Already indexed by idx_work_orders_composite in previous migration
-- No additional index needed

-- pesv_inspections: Used in useOperationalReport
CREATE INDEX IF NOT EXISTS idx_pesv_inspections_tenant_date
ON public.pesv_inspections(tenant_id, inspection_date DESC);

-- ============================================================================
-- SECTION 5: Foreign Key Index Optimization
-- ============================================================================

-- Foreign keys should always have indexes for JOIN performance

-- devices.vehicle_id (JOIN with vehicles)
CREATE INDEX IF NOT EXISTS idx_devices_vehicle_id
ON public.devices(vehicle_id);

-- alerts.vehicle_id (JOIN with vehicles)
CREATE INDEX IF NOT EXISTS idx_alerts_vehicle_id
ON public.alerts(vehicle_id);

-- alerts.policy_id (JOIN with policies)
CREATE INDEX IF NOT EXISTS idx_alerts_policy_id
ON public.alerts(policy_id);

-- evidence_records.vehicle_id (JOIN with vehicles)
CREATE INDEX IF NOT EXISTS idx_evidence_vehicle_id
ON public.evidence_records(vehicle_id);

-- drivers.assigned_vehicle_id (JOIN with vehicles)
CREATE INDEX IF NOT EXISTS idx_drivers_vehicle_id
ON public.drivers(assigned_vehicle_id);

-- ============================================================================
-- SECTION 6: Partial Indexes for Specific Scenarios
-- ============================================================================

-- Partial index: Only unacknowledged alerts (commonly filtered)
CREATE INDEX IF NOT EXISTS idx_alerts_unacknowledged
ON public.alerts(tenant_id, created_at DESC)
WHERE acknowledged = false;

-- Partial index: Only critical/high alerts (commonly filtered in useSecurityReport)
CREATE INDEX IF NOT EXISTS idx_alerts_critical
ON public.alerts(tenant_id, created_at DESC)
WHERE severity IN ('critical', 'high');

-- Partial index: Only pending trips
CREATE INDEX IF NOT EXISTS idx_trips_pending
ON public.trips(tenant_id, created_at DESC)
WHERE status = 'pending';

-- ============================================================================
-- PERFORMANCE ANALYSIS
-- ============================================================================

-- Query to analyze index usage (run after deployment):
-- SELECT
--   schemaname, tablename, indexname,
--   idx_scan AS index_scans,
--   idx_tup_read AS tuples_read,
--   idx_tup_fetch AS tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Query to find missing indexes (tables without indexes on foreign keys):
-- SELECT
--   c.conrelid::regclass AS table_name,
--   att.attname AS column_name,
--   c.confrelid::regclass AS foreign_table
-- FROM pg_constraint c
-- JOIN pg_attribute att ON att.attrelid = c.conrelid AND att.attnum = ANY(c.conkey)
-- WHERE c.contype = 'f'
-- AND NOT EXISTS (
--   SELECT 1 FROM pg_index i
--   WHERE i.indrelid = c.conrelid
--   AND att.attnum = ANY(i.indkey)
-- );

COMMENT ON INDEX idx_profiles_tenant_created IS 'PR #19: Optimize profiles pagination in DashboardAdmin';
COMMENT ON INDEX idx_telemetry_vehicle_ts IS 'PR #20: Optimize telemetry pagination with vehicle filter';
COMMENT ON INDEX idx_alerts_tenant_created IS 'PR #20: Optimize alerts pagination';
COMMENT ON INDEX idx_alerts_unacknowledged IS 'PR #21: Optimize Realtime alerts - unacknowledged only';
COMMENT ON INDEX idx_trips_tenant_status_end IS 'PR #19: Optimize trips query in useOperationalReport';
