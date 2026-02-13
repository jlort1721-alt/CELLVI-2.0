-- ============================================================================
-- Query Performance Monitoring Script - PR #24
-- ============================================================================
-- Purpose: Monitor and analyze query performance in production
-- Usage: Run this script weekly to identify performance regressions
-- ============================================================================

-- Enable pg_stat_statements if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Reset statistics (optional - use carefully in production)
-- SELECT pg_stat_statements_reset();

-- ============================================================================
-- SECTION 1: Slowest Queries
-- ============================================================================

\echo '======================================================================'
\echo 'TOP 20 SLOWEST QUERIES (by mean execution time)'
\echo '======================================================================'

SELECT
  LEFT(query, 100) AS query_preview,
  calls,
  ROUND(total_exec_time::numeric, 2) AS total_time_ms,
  ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
  ROUND(max_exec_time::numeric, 2) AS max_time_ms,
  ROUND(stddev_exec_time::numeric, 2) AS stddev_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%' -- Exclude monitoring queries
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ============================================================================
-- SECTION 2: Most Frequent Queries
-- ============================================================================

\echo ''
\echo '======================================================================'
\echo 'TOP 20 MOST FREQUENT QUERIES (by call count)'
\echo '======================================================================'

SELECT
  LEFT(query, 100) AS query_preview,
  calls,
  ROUND(total_exec_time::numeric, 2) AS total_time_ms,
  ROUND((total_exec_time / calls)::numeric, 2) AS avg_time_ms,
  ROUND((calls * 100.0 / SUM(calls) OVER ())::numeric, 2) AS percentage
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY calls DESC
LIMIT 20;

-- ============================================================================
-- SECTION 3: Queries Consuming Most CPU Time
-- ============================================================================

\echo ''
\echo '======================================================================'
\echo 'TOP 20 QUERIES CONSUMING MOST TOTAL TIME'
\echo '======================================================================'

SELECT
  LEFT(query, 100) AS query_preview,
  calls,
  ROUND(total_exec_time::numeric, 2) AS total_time_ms,
  ROUND((total_exec_time / calls)::numeric, 2) AS avg_time_ms,
  ROUND((total_exec_time * 100.0 / SUM(total_exec_time) OVER ())::numeric, 2) AS percentage
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY total_exec_time DESC
LIMIT 20;

-- ============================================================================
-- SECTION 4: Index Usage Statistics
-- ============================================================================

\echo ''
\echo '======================================================================'
\echo 'INDEX USAGE STATISTICS (most scanned)'
\echo '======================================================================'

SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;

-- ============================================================================
-- SECTION 5: Unused Indexes (Candidates for Removal)
-- ============================================================================

\echo ''
\echo '======================================================================'
\echo 'UNUSED INDEXES (never scanned, consider dropping)'
\echo '======================================================================'

SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS wasted_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0
AND indexname NOT LIKE '%_pkey' -- Exclude primary keys
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- SECTION 6: Table Statistics
-- ============================================================================

\echo ''
\echo '======================================================================'
\echo 'TABLE STATISTICS (sequential scans vs index scans)'
\echo '======================================================================'

SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins AS inserts,
  n_tup_upd AS updates,
  n_tup_del AS deletes,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  CASE
    WHEN seq_scan + idx_scan = 0 THEN 0
    ELSE ROUND((idx_scan::numeric / (seq_scan + idx_scan)) * 100, 2)
  END AS index_usage_pct
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC
LIMIT 20;

-- ============================================================================
-- SECTION 7: Tables Needing VACUUM
-- ============================================================================

\echo ''
\echo '======================================================================'
\echo 'TABLES NEEDING VACUUM (high dead tuple count)'
\echo '======================================================================'

SELECT
  schemaname,
  tablename,
  n_live_tup AS live_tuples,
  n_dead_tup AS dead_tuples,
  ROUND((n_dead_tup::numeric / NULLIF(n_live_tup, 0)) * 100, 2) AS dead_pct,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND n_dead_tup > 1000
ORDER BY dead_pct DESC;

-- ============================================================================
-- SECTION 8: Database Size and Growth
-- ============================================================================

\echo ''
\echo '======================================================================'
\echo 'DATABASE SIZE BY TABLE'
\echo '======================================================================'

SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- ============================================================================
-- SECTION 9: Cache Hit Ratio
-- ============================================================================

\echo ''
\echo '======================================================================'
\echo 'CACHE HIT RATIO (should be > 99%)'
\echo '======================================================================'

SELECT
  'index hit rate' AS name,
  ROUND((SUM(idx_blks_hit) / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0)) * 100, 2) AS ratio
FROM pg_statio_user_indexes
UNION ALL
SELECT
  'table hit rate' AS name,
  ROUND((SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0)) * 100, 2) AS ratio
FROM pg_statio_user_tables;

-- ============================================================================
-- SECTION 10: Connection Statistics
-- ============================================================================

\echo ''
\echo '======================================================================'
\echo 'DATABASE CONNECTIONS'
\echo '======================================================================'

SELECT
  state,
  COUNT(*) AS connection_count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;

-- ============================================================================
-- SECTION 11: Realtime Performance (Custom)
-- ============================================================================

\echo ''
\echo '======================================================================'
\echo 'REALTIME SUBSCRIPTION PERFORMANCE'
\echo '======================================================================'

-- Check how fast Realtime filters execute
EXPLAIN ANALYZE
SELECT * FROM alerts
WHERE tenant_id = (SELECT id FROM tenants LIMIT 1);

EXPLAIN ANALYZE
SELECT * FROM telemetry_events
WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)
LIMIT 1;

-- ============================================================================
-- RECOMMENDATIONS
-- ============================================================================

\echo ''
\echo '======================================================================'
\echo 'RECOMMENDATIONS'
\echo '======================================================================'

-- Find tables with high sequential scan ratio
\echo '1. Tables with high sequential scan ratio (> 50%):'
SELECT
  tablename,
  seq_scan,
  idx_scan,
  ROUND((seq_scan::numeric / NULLIF(seq_scan + idx_scan, 0)) * 100, 2) AS seq_scan_pct
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND seq_scan + idx_scan > 100 -- Filter low-activity tables
AND seq_scan > idx_scan
ORDER BY seq_scan_pct DESC
LIMIT 10;

-- Find missing indexes on foreign keys
\echo ''
\echo '2. Foreign keys without indexes:'
SELECT
  c.conrelid::regclass AS table_name,
  att.attname AS column_name,
  c.confrelid::regclass AS referenced_table
FROM pg_constraint c
JOIN pg_attribute att ON att.attrelid = c.conrelid
  AND att.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
AND NOT EXISTS (
  SELECT 1 FROM pg_index i
  WHERE i.indrelid = c.conrelid
  AND att.attnum = ANY(i.indkey)
)
LIMIT 10;

-- Find bloated tables
\echo ''
\echo '3. Bloated tables (high dead tuple ratio):'
SELECT
  tablename,
  n_dead_tup AS dead_tuples,
  ROUND((n_dead_tup::numeric / NULLIF(n_live_tup, 0)) * 100, 2) AS bloat_pct
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND n_dead_tup > 1000
ORDER BY bloat_pct DESC
LIMIT 10;

\echo ''
\echo '======================================================================'
\echo 'END OF PERFORMANCE REPORT'
\echo '======================================================================'
