# CELLVI 2.0 Rollback Playbook

**Version**: 1.0.0
**Last Updated**: 2026-02-13
**Status**: Production Ready
**SLA**: Rollback completion within 30 minutes for P0 incidents

## Table of Contents

1. [Emergency Contacts](#emergency-contacts)
2. [Application Rollback](#application-rollback)
3. [Database Migration Rollback](#database-migration-rollback)
4. [Feature Flag Management](#feature-flag-management)
5. [Storage Rollback](#storage-rollback)
6. [Incident Response Workflow](#incident-response-workflow)
7. [Post-Rollback Verification](#post-rollback-verification)
8. [Rollback Scenarios](#rollback-scenarios)

---

## Emergency Contacts

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| **On-Call Engineer** | Rotation | +57 XXX XXX XXXX | 24/7 |
| **DevOps Lead** | TBD | devops@cellvi.com | Business hours |
| **Security Lead** | TBD | security@cellvi.com | Business hours |
| **Product Owner** | TBD | product@cellvi.com | Business hours |

**Escalation Path**: On-Call → DevOps Lead → CTO

**External Support**:
- Supabase Support: support@supabase.com (SLA: 1-hour response for Pro plan)
- Vercel Support: support@vercel.com (SLA: 2-hour response for Pro plan)

---

## Application Rollback

### 1. Vercel Deployment Rollback

**Use Case**: Critical bug in frontend (React app) or Edge Functions deployed via Vercel

**Prerequisites**:
- Vercel CLI installed: `npm install -g vercel`
- Authentication: `vercel login`

#### Step-by-Step Procedure

**Option A: Instant Rollback (Recommended for P0)**

```bash
# 1. List recent deployments
vercel list

# Output:
# Production Deployments:
# cellvi-2-0-abc123xyz.vercel.app  (Current)  2026-02-13 10:30:00
# cellvi-2-0-def456uvw.vercel.app  (Previous) 2026-02-12 15:45:00
# cellvi-2-0-ghi789rst.vercel.app            2026-02-11 09:20:00

# 2. Promote previous deployment to production
vercel promote cellvi-2-0-def456uvw.vercel.app

# Expected output:
# ✓ Deployment cellvi-2-0-def456uvw.vercel.app promoted to production
# ✓ https://cellvi.com is now serving the previous version

# 3. Verify (should take < 30 seconds to propagate globally)
curl https://cellvi.com/api/health
# Expected: { "status": "ok", "version": "previous-version" }
```

**Option B: Redeploy from Git**

```bash
# 1. Identify working commit
git log --oneline -n 10

# 2. Checkout working commit
git checkout <commit-hash>

# 3. Deploy to production
vercel --prod

# 4. Return to main branch
git checkout main
```

**Rollback Time**: ~2-5 minutes

#### Verification

```bash
# Check deployment status
vercel inspect cellvi-2-0-def456uvw.vercel.app

# Test critical paths
curl https://cellvi.com/admin/dashboard | grep "Dashboard Admin"
curl https://cellvi.com/api/health

# Check error rate in Vercel Analytics
vercel logs --since=5m
```

### 2. Supabase Edge Function Rollback

**Use Case**: Critical bug in `api-gateway`, `send-email`, or other Edge Functions

**Prerequisites**:
- Supabase CLI: `npm install -g supabase`
- Authentication: `supabase login`

#### Step-by-Step Procedure

```bash
# 1. Navigate to project directory
cd /Users/ADMIN/Documents/CELLVI 2.0/CELLVI-2.0

# 2. Checkout previous working version
git checkout <commit-hash> -- supabase/functions/<function-name>

# 3. Deploy specific function
supabase functions deploy <function-name> --project-ref <project-ref>

# Example: Rollback api-gateway
git checkout abc123 -- supabase/functions/api-gateway
supabase functions deploy api-gateway --project-ref rmxlckpmybbtkqtkkqnx

# 4. Verify deployment
supabase functions list --project-ref rmxlckpmybbtkqtkkqnx

# 5. Test endpoint
curl -X POST https://rmxlckpmybbtkqtkkqnx.supabase.co/functions/v1/api-gateway \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{"action":"health"}'
```

**Rollback Time**: ~1-3 minutes

---

## Database Migration Rollback

### Philosophy

- All migrations MUST include a `down` migration for rollback
- Destructive migrations (DROP, DELETE) require manual approval
- Schema changes tested in staging before production

### Migration Rollback Procedure

#### 1. Identify Migration to Rollback

```bash
# List applied migrations
supabase migration list --db-url "postgresql://postgres:[password]@db.rmxlckpmybbtkqtkkqnx.supabase.co:5432/postgres"

# Output:
# 20260214000001_rate_limiter.sql          APPLIED  2026-02-13 08:00:00
# 20260219000000_performance_indexes.sql   APPLIED  2026-02-13 09:15:00
# 20260220000000_new_feature.sql           APPLIED  2026-02-13 10:30:00 ← Rollback this
```

#### 2. Create Down Migration

**Example: Rollback `20260220000000_new_feature.sql`**

```sql
-- supabase/migrations/20260220000001_rollback_new_feature.sql

-- Reverse changes from 20260220000000_new_feature.sql

-- 1. Drop new table
DROP TABLE IF EXISTS public.new_feature_data CASCADE;

-- 2. Remove new columns
ALTER TABLE public.orders DROP COLUMN IF EXISTS new_feature_flag;

-- 3. Drop new indexes
DROP INDEX IF EXISTS idx_new_feature_lookup;

-- 4. Revert RLS policies
DROP POLICY IF EXISTS "new_feature_policy" ON public.orders;

-- 5. Remove functions
DROP FUNCTION IF EXISTS public.calculate_new_metric(UUID);

-- 6. Restore previous state (if data migration occurred)
-- IMPORTANT: Only if you have a backup or can safely restore
-- UPDATE public.orders SET status = 'pending' WHERE status = 'new_status';
```

#### 3. Apply Down Migration

```bash
# 1. Test in local database (Docker)
supabase db reset
supabase migration up --db-url "postgresql://postgres:postgres@localhost:54322/postgres"

# 2. Apply to production (requires confirmation)
supabase migration up --db-url "postgresql://postgres:[password]@db.rmxlckpmybbtkqtkkqnx.supabase.co:5432/postgres"

# Expected output:
# Applying migration 20260220000001_rollback_new_feature.sql...
# ✓ Migration applied successfully
```

**Rollback Time**: ~5-15 minutes (depends on data volume)

#### 4. Data Backup Before Risky Rollbacks

```bash
# Create point-in-time backup (Supabase Dashboard)
# Navigate to: Project Settings → Backups → Create Backup

# Or via SQL dump
pg_dump "postgresql://postgres:[password]@db.rmxlckpmybbtkqtkkqnx.supabase.co:5432/postgres" \
  --schema=public \
  --no-owner \
  --no-acl \
  > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Migration Rollback Examples

#### Example 1: Rollback Added Column

**Original Migration**:
```sql
-- 20260220_add_priority_column.sql
ALTER TABLE orders ADD COLUMN priority TEXT DEFAULT 'normal';
CREATE INDEX idx_orders_priority ON orders(priority);
```

**Rollback Migration**:
```sql
-- 20260220_rollback_add_priority_column.sql
DROP INDEX IF EXISTS idx_orders_priority;
ALTER TABLE orders DROP COLUMN IF EXISTS priority;
```

#### Example 2: Rollback Data Migration

**Original Migration**:
```sql
-- 20260220_migrate_status_values.sql
UPDATE orders SET status = 'in_transit' WHERE status = 'shipped';
```

**Rollback Migration**:
```sql
-- 20260220_rollback_migrate_status_values.sql
UPDATE orders SET status = 'shipped' WHERE status = 'in_transit';
```

#### Example 3: Rollback RLS Policy

**Original Migration**:
```sql
-- 20260220_restrict_order_updates.sql
DROP POLICY IF EXISTS "allow_order_updates" ON orders;
CREATE POLICY "allow_order_updates" ON orders
  FOR UPDATE USING (created_by = auth.uid());
```

**Rollback Migration**:
```sql
-- 20260220_rollback_restrict_order_updates.sql
DROP POLICY IF EXISTS "allow_order_updates" ON orders;
CREATE POLICY "allow_order_updates" ON orders
  FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

---

## Feature Flag Management

### Philosophy

- Use environment variables for feature flags
- Default to OFF for new features
- Gradual rollout: staging → 10% production → 100% production

### Feature Flag Locations

```bash
# Vercel environment variables
vercel env ls

# Supabase Edge Function environment
# Dashboard → Edge Functions → Environment Variables
```

### Flag Naming Convention

```
ENABLE_<FEATURE_NAME>=true|false

Examples:
- ENABLE_REALTIME=true
- ENABLE_OFFLINE_MODE=true
- ENABLE_NEW_DASHBOARD=false
```

### Rollback via Feature Flag

#### 1. Disable Feature Immediately

```bash
# Vercel (Frontend flags)
vercel env rm ENABLE_NEW_DASHBOARD production
vercel env add ENABLE_NEW_DASHBOARD production
# Enter value: false

# Redeploy to apply changes
vercel --prod

# Supabase (Backend flags)
# Dashboard → Edge Functions → api-gateway → Environment Variables
# Set: ENABLE_RATE_LIMITING=false
```

**Propagation Time**: ~10-30 seconds

#### 2. Verify Flag Status

```typescript
// Frontend check
const NEW_DASHBOARD_ENABLED = import.meta.env.VITE_ENABLE_NEW_DASHBOARD === 'true';

if (NEW_DASHBOARD_ENABLED) {
  console.log('New dashboard: ENABLED');
} else {
  console.log('New dashboard: DISABLED (rollback active)');
}

// Backend check
const RATE_LIMITING_ENABLED = Deno.env.get('ENABLE_RATE_LIMITING') !== 'false';
```

### Gradual Rollout Strategy

```typescript
// Percentage-based rollout
function isFeatureEnabled(userId: string, featureName: string, rolloutPercent: number): boolean {
  if (import.meta.env[`VITE_ENABLE_${featureName}`] === 'false') {
    return false; // Feature flag disabled
  }

  // Hash user ID to deterministic 0-99
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bucket = hash % 100;

  return bucket < rolloutPercent;
}

// Usage: 10% rollout
if (isFeatureEnabled(user.id, 'NEW_DASHBOARD', 10)) {
  return <NewDashboard />;
} else {
  return <OldDashboard />;
}
```

**Rollback**: Set `rolloutPercent` to `0` or disable flag entirely

---

## Storage Rollback

### Use Case

- Malicious file upload detected
- Corrupted files breaking application
- Accidental mass deletion

### Procedure

#### 1. Restore from Backup

**Supabase Storage** has no built-in versioning. Implement application-level versioning:

```sql
-- Create file_versions table (preventive)
CREATE TABLE file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  version INT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id),
  metadata JSONB
);
```

#### 2. Delete Malicious Files

```typescript
// Delete specific file
const { error } = await supabase.storage
  .from('vehicle-photos')
  .remove(['tenant-uuid/vehicles/malicious-file.exe']);

// Delete all files in path
const { data: files } = await supabase.storage
  .from('vehicle-photos')
  .list('tenant-uuid/vehicles');

const filesToRemove = files.map(file => `tenant-uuid/vehicles/${file.name}`);
await supabase.storage.from('vehicle-photos').remove(filesToRemove);
```

#### 3. Block File Types

```typescript
// Update bucket policy (Supabase Dashboard)
// Navigate to: Storage → vehicle-photos → Policies → Update

// Add MIME type restriction
CREATE POLICY "restrict_file_types" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vehicle-photos' AND
    (storage.mimetype(name) = ANY(ARRAY['image/jpeg', 'image/png', 'application/pdf']))
  );
```

**Rollback Time**: ~2-10 minutes

---

## Incident Response Workflow

### Severity Levels

| Level | Description | Response Time | Notification |
|-------|-------------|---------------|--------------|
| **P0 - Critical** | Total outage, data breach, security incident | < 15 min | All stakeholders |
| **P1 - High** | Partial outage, degraded performance | < 30 min | Engineering + Product |
| **P2 - Medium** | Non-critical feature broken | < 2 hours | Engineering |
| **P3 - Low** | Minor bug, cosmetic issue | < 1 day | Engineering |

### Rollback Decision Matrix

| Incident Type | First Response | Rollback Required? |
|---------------|---------------|-------------------|
| **Frontend crash** | Rollback Vercel deployment | Yes |
| **API endpoint 500 errors** | Check Edge Function logs → Rollback if needed | Likely |
| **Database slow queries** | Check pg_stat_statements → Add index | Unlikely |
| **RLS policy too restrictive** | Review policy → Rollback migration | Yes |
| **File upload failing** | Check storage bucket policy | Maybe |
| **Realtime disconnect spike** | Check Supabase status page | No (external) |

### Rollback Workflow

```
┌─────────────────┐
│ Incident Detected│
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ Assess Severity │ (P0/P1/P2/P3)
└────────┬─────────┘
         │
         ▼
    ┌────────┐
    │ P0/P1? │───No──▶ Investigate + Fix Forward
    └────┬───┘
         │Yes
         ▼
┌─────────────────┐
│ Rollback Type?  │
├─────────────────┤
│ 1. App          │───▶ Vercel promote previous
│ 2. Database     │───▶ Apply down migration
│ 3. Feature Flag │───▶ Set ENABLE_*=false
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ Execute Rollback│ (< 30 min SLA)
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ Verify Recovery │ (Run smoke tests)
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ Post-Mortem     │ (Within 48 hours)
└─────────────────┘
```

---

## Post-Rollback Verification

### Smoke Tests

**Critical Path Tests** (must pass before declaring rollback successful):

```bash
# 1. Health checks
curl https://cellvi.com/api/health
# Expected: { "status": "ok" }

curl https://rmxlckpmybbtkqtkkqnx.supabase.co/functions/v1/api-gateway \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{"action":"health"}'
# Expected: { "status": "ok" }

# 2. Database connectivity
psql "postgresql://postgres:[password]@db.rmxlckpmybbtkqtkkqnx.supabase.co:5432/postgres" \
  -c "SELECT COUNT(*) FROM orders;"
# Expected: Numeric count

# 3. Authentication
curl -X POST https://rmxlckpmybbtkqtkkqnx.supabase.co/auth/v1/token \
  -d '{"email":"test@cellvi.com","password":"test123"}' \
  -H "Content-Type: application/json"
# Expected: { "access_token": "..." }

# 4. Realtime connection
# Open browser console:
const { data, error } = await supabase
  .channel('test')
  .on('broadcast', { event: 'test' }, (payload) => console.log(payload))
  .subscribe((status) => console.log('Status:', status));
// Expected: Status: SUBSCRIBED

# 5. Storage upload
const { data, error } = await supabase.storage
  .from('vehicle-photos')
  .upload('test.txt', new Blob(['test']));
// Expected: { path: 'test.txt' }
```

### Monitoring Dashboard

**Check metrics for 15 minutes post-rollback**:

1. **Vercel Analytics**:
   - Error rate < 1%
   - p95 latency < 500ms
   - Visitors not dropping off

2. **Supabase Dashboard**:
   - Database CPU < 50%
   - Active connections < 20
   - Query time p95 < 100ms

3. **User Reports**:
   - Zero support tickets mentioning errors
   - No Slack alerts from monitoring

---

## Rollback Scenarios

### Scenario 1: Frontend Build Breaks Production

**Symptoms**: White screen, React errors, 404 on assets

**Root Cause**: Vite build config error, missing environment variable

**Rollback**:
```bash
# Immediate (< 2 minutes)
vercel list
vercel promote <previous-deployment-url>

# Verify
curl https://cellvi.com | grep "CELLVI"
```

**Prevention**: Add pre-deployment smoke tests in CI

---

### Scenario 2: Database Migration Causes RLS Violations

**Symptoms**: Users getting "Policy violation" errors, data not loading

**Root Cause**: RLS policy too restrictive after migration

**Rollback**:
```bash
# Create down migration
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_rollback_rls.sql << EOF
DROP POLICY IF EXISTS "new_restrictive_policy" ON orders;
-- Restore previous policy
CREATE POLICY "allow_tenant_access" ON orders
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
EOF

# Apply
supabase migration up --db-url $DATABASE_URL
```

**Verification**:
```sql
-- Check policy is active
SELECT * FROM pg_policies WHERE tablename = 'orders';

-- Test with user JWT
SET LOCAL jwt.claims.tenant_id = 'tenant-uuid';
SELECT COUNT(*) FROM orders; -- Should return tenant's order count
```

---

### Scenario 3: Realtime Subscription Causes Memory Leak

**Symptoms**: Browser tab crashes, slow UI, high memory usage

**Root Cause**: Subscription not properly cleaned up

**Rollback**:
```bash
# Disable Realtime via feature flag
vercel env add VITE_ENABLE_REALTIME production
# Value: false

# Redeploy
vercel --prod
```

**Verification**:
```javascript
// Check flag
console.log(import.meta.env.VITE_ENABLE_REALTIME); // "false"

// Verify no subscriptions
supabase.getChannels(); // Should return []
```

---

### Scenario 4: Rate Limiter Blocks Legitimate Traffic

**Symptoms**: Users getting 429 errors, cannot log in

**Root Cause**: Rate limit too aggressive (e.g., 5/min instead of 5/15min)

**Rollback**:
```bash
# Disable rate limiting temporarily
# Supabase Dashboard → Edge Functions → api-gateway → Environment Variables
# Set: ENABLE_RATE_LIMITING=false

# Or update limits
UPDATE rate_limits SET requests_count = 0 WHERE endpoint = '/api/login';
```

**Verification**:
```bash
# Attempt 10 logins (should all succeed with flag disabled)
for i in {1..10}; do
  curl -X POST https://cellvi.com/api/login \
    -d '{"email":"test@test.com","password":"test123"}'
done
# Expected: All return 200 or 401 (not 429)
```

---

## Post-Rollback Actions

### 1. Root Cause Analysis (Within 48 hours)

**Template**:
```markdown
## Incident Report: [Title]

**Date**: 2026-02-13
**Severity**: P1
**Duration**: 35 minutes (10:30 - 11:05)
**Impacted Users**: ~50 (5% of active users)

### What Happened
Brief description of incident

### Root Cause
Technical explanation of what went wrong

### Why It Wasn't Caught
- [ ] Missing test coverage
- [ ] No staging environment test
- [ ] Insufficient monitoring

### Rollback Performed
- Vercel deployment rolled back from abc123 to def456
- Database migration reverted via down migration
- Feature flag disabled: ENABLE_NEW_FEATURE=false

### Preventive Measures
- [ ] Add integration test for X
- [ ] Update rollback playbook with new scenario
- [ ] Improve monitoring for Y metric

### Timeline
- 10:30 - Deployment to production
- 10:35 - First user report of errors
- 10:40 - On-call engineer paged
- 10:45 - Rollback initiated
- 11:05 - Rollback verified, incident closed
```

### 2. Update Rollback Playbook

Add new scenario to this document if not already covered.

### 3. Improve Monitoring

Add alerts for metrics that would have detected the issue earlier.

---

## Rollback Testing Schedule

**Quarterly Rollback Drills** (Required):

- Q1 2026: Test Vercel deployment rollback
- Q2 2026: Test database migration rollback
- Q3 2026: Test feature flag emergency disable
- Q4 2026: Full disaster recovery (restore from backup)

**Success Criteria**:
- Rollback completed within 30-minute SLA
- All smoke tests pass
- Zero data loss
- Documentation updated with lessons learned

---

## Appendix: Emergency Scripts

### Quick Health Check

```bash
#!/bin/bash
# scripts/health-check.sh

echo "=== CELLVI Health Check ==="

# 1. Frontend
echo "1. Frontend..."
curl -sf https://cellvi.com/api/health || echo "❌ Frontend DOWN"

# 2. Database
echo "2. Database..."
psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null && echo "✅ Database OK" || echo "❌ Database DOWN"

# 3. Auth
echo "3. Auth..."
curl -sf "$SUPABASE_URL/auth/v1/health" || echo "❌ Auth DOWN"

# 4. Realtime
echo "4. Realtime..."
curl -sf "$SUPABASE_URL/realtime/v1/health" || echo "❌ Realtime DOWN"

# 5. Storage
echo "5. Storage..."
curl -sf "$SUPABASE_URL/storage/v1/healthcheck" || echo "❌ Storage DOWN"

echo "=== Health Check Complete ==="
```

### Emergency Rollback Script

```bash
#!/bin/bash
# scripts/emergency-rollback.sh

set -e

echo "⚠️  EMERGENCY ROLLBACK INITIATED"

# Prompt for confirmation
read -p "Are you sure you want to rollback production? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Rollback cancelled."
  exit 0
fi

# Get previous deployment
PREV_DEPLOY=$(vercel list --format json | jq -r '.[1].url')

echo "Rolling back to: $PREV_DEPLOY"

# Execute rollback
vercel promote "$PREV_DEPLOY" --yes

echo "✅ Rollback complete. Verifying..."

# Verify
sleep 10
curl -f https://cellvi.com/api/health && echo "✅ Health check passed" || echo "❌ Health check failed"

echo "=== Rollback Complete ===" ```

---

**Document Owner**: DevOps Team
**Next Review**: 2026-03-13 (monthly)
**Version History**:
- v1.0.0 (2026-02-13): Initial rollback playbook
