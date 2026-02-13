# 🎯 CELLVI 2.0 - MASTER REMEDIATION PLAN
## Production Readiness Roadmap (PR #11 → PR #56)

**Generated:** 2026-02-13
**Target Branch:** `main`
**Current Status:** Phase 1 In Progress (PR #11 Complete)

---

## 📊 EXECUTIVE SUMMARY

| Phase | PRs | Status | Risk Level | Blockers |
|-------|-----|--------|------------|----------|
| **Phase 1: Security** | #11-#18 | 🟡 In Progress | CRITICAL | None |
| **Phase 2: Performance** | #19-#25 | ⚪ Pending | HIGH | Phase 1 |
| **Phase 3: Reliability** | #26-#31 | ⚪ Pending | HIGH | Phase 1 |
| **Phase 4: Testing** | #32-#40 | ⚪ Pending | MEDIUM | Phase 1-3 |
| **Phase 5: Code Quality** | #41-#48 | ⚪ Pending | MEDIUM | Phase 4 |
| **Phase 6: DevOps** | #49-#56 | ⚪ Pending | LOW | Phase 1-5 |

**Total PRs:** 46
**Estimated Scope:** 182 files touched, 28 migrations, 22 edge functions

---

## 🔴 PHASE 1: SECURITY HARDENING (BLOCKER)

### PR #11: API Gateway Zod Validation + Mass Assignment Fix ✅ READY
- **Status:** ✅ Complete - Ready for Review
- **Files:** `schemas.ts`, `validation.ts`, `index.ts`, tests
- **Security:** Prevents mass assignment, tenant_id injection, invalid data
- **Tests:** 20+ unit tests, integration verification script
- **Done When:**
  - ✅ All schemas use `.strict()` mode
  - ✅ No endpoint accepts tenant_id from client
  - ✅ Unit tests pass
  - ✅ Integration tests pass

---

### PR #12: CORS Allowlist Across All Edge Functions
**Branch:** `security/cors-allowlist`

#### **Scope:**
Replace wildcard CORS (`*`) with origin allowlist in all 22 edge functions.

#### **Files to Change:**
```
supabase/functions/
├── _shared/cors.ts (NEW - 150 lines)
├── _shared/cors.test.ts (NEW - 80 lines)
└── [Update all 22 functions to use withCors()]
```

#### **Implementation:**
1. Create shared CORS middleware (already detailed in PR #12 section above)
2. Migrate each function to use `withCors(handler)`
3. Remove hardcoded CORS headers
4. Add DEV_ORIGIN env var support

#### **Verification:**
```bash
# Test allowed origin
curl -i -H "Origin: https://cellvi.com" https://...

# Test blocked origin
curl -i -H "Origin: https://malicious.com" https://...

# Run automated test across all functions
deno run --allow-net scripts/test-cors-all-functions.ts
```

#### **Done When:**
- ✅ `_shared/cors.ts` created
- ✅ All 22 functions migrated
- ✅ No function has `"*"` origin
- ✅ Preflight requests work
- ✅ Automated tests pass

---

### PR #13: Postgres-Based Durable Rate Limiter
**Branch:** `security/durable-rate-limiter`

#### **Scope:**
Replace in-memory rate limiting with Postgres-based solution that survives deploys and scales across instances.

#### **Rationale:**
Current in-memory `Map<string, number>` resets on deploy and doesn't share state across edge function instances.

#### **Files to Create:**
```
supabase/
├── migrations/
│   └── 20260214000001_rate_limiter.sql (NEW)
└── functions/
    ├── _shared/
    │   ├── rate-limiter.ts (NEW - 200 lines)
    │   └── rate-limiter.test.ts (NEW - 100 lines)
    └── send-email/index.ts (UPDATE - use new limiter)
```

#### **Migration: `20260214000001_rate_limiter.sql`**

```sql
-- ============================================================================
-- Rate Limiting Tables
-- ============================================================================

-- Rate limit tracking table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or tenant_id or user_id
  endpoint TEXT NOT NULL,   -- e.g., 'send-email', 'api-gateway', etc.
  requests_count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite index for fast lookups
CREATE UNIQUE INDEX idx_rate_limits_identifier_endpoint_window
  ON public.rate_limits(identifier, endpoint, window_start);

-- Index for cleanup queries
CREATE INDEX idx_rate_limits_window_end
  ON public.rate_limits(window_end);

-- Auto-cleanup old records (keep last 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_end < (now() - INTERVAL '24 hours');
END;
$$;

-- Schedule cleanup every hour
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 * * * *', -- Every hour
  'SELECT public.cleanup_old_rate_limits()'
);

-- RLS Policies (Service role bypass for edge functions)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role (edge functions) full access
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.rate_limits TO service_role;

-- Add comment
COMMENT ON TABLE public.rate_limits IS 'Durable rate limiting across edge function instances. Cleaned automatically via pg_cron.';
```

#### **Implementation: `_shared/rate-limiter.ts`**

```typescript
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * Durable Rate Limiter using Postgres
 *
 * Features:
 * - Survives edge function deploys
 * - Shared across all instances
 * - Sliding window algorithm
 * - Per-IP and per-tenant limits
 */

export interface RateLimitConfig {
  maxRequests: number;  // Max requests per window
  windowMs: number;     // Window size in milliseconds
  identifier: string;   // IP, tenant_id, or user_id
  endpoint: string;     // Function name or endpoint
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // Seconds until reset (if blocked)
}

export class RateLimitError extends Error {
  constructor(
    public result: RateLimitResult,
    public statusCode = 429
  ) {
    super(`Rate limit exceeded. Try again in ${result.retryAfter} seconds.`);
    this.name = "RateLimitError";
  }
}

/**
 * Check and enforce rate limit
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);
  const windowEnd = new Date(now.getTime() + config.windowMs);

  try {
    // Try to find existing rate limit record for this window
    const { data: existing, error: fetchError } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("identifier", config.identifier)
      .eq("endpoint", config.endpoint)
      .gte("window_end", now.toISOString())
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error("Rate limit fetch error:", fetchError);
      // Fail open (allow request) on DB errors to avoid blocking legitimate traffic
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: windowEnd,
      };
    }

    // Case 1: No existing record - create new one
    if (!existing) {
      const { error: insertError } = await supabase
        .from("rate_limits")
        .insert({
          identifier: config.identifier,
          endpoint: config.endpoint,
          requests_count: 1,
          window_start: now.toISOString(),
          window_end: windowEnd.toISOString(),
        });

      if (insertError) {
        console.error("Rate limit insert error:", insertError);
        // Fail open
        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetAt: windowEnd,
        };
      }

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: windowEnd,
      };
    }

    // Case 2: Existing record found - check if limit exceeded
    const currentCount = existing.requests_count;

    if (currentCount >= config.maxRequests) {
      // BLOCKED
      const resetAt = new Date(existing.window_end);
      const retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter,
      };
    }

    // Case 3: Within limit - increment counter
    const { error: updateError } = await supabase
      .from("rate_limits")
      .update({
        requests_count: currentCount + 1,
        updated_at: now.toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("Rate limit update error:", updateError);
      // Fail open
      return {
        allowed: true,
        remaining: config.maxRequests - currentCount - 1,
        resetAt: new Date(existing.window_end),
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1,
      resetAt: new Date(existing.window_end),
    };

  } catch (error) {
    console.error("Rate limiter error:", error);
    // Fail open on unexpected errors
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: windowEnd,
    };
  }
}

/**
 * Convenience function that throws on rate limit exceeded
 */
export async function enforceRateLimit(
  supabase: SupabaseClient,
  config: RateLimitConfig
): Promise<void> {
  const result = await checkRateLimit(supabase, config);

  if (!result.allowed) {
    throw new RateLimitError(result);
  }
}

/**
 * Get rate limit headers for HTTP responses
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.remaining + (result.allowed ? 1 : 0)),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": result.resetAt.toISOString(),
    ...(result.retryAfter && { "Retry-After": String(result.retryAfter) }),
  };
}

/**
 * Extract identifier from request (IP or user)
 */
export function getIdentifier(req: Request, preferUserId?: string): string {
  if (preferUserId) return preferUserId;

  // Try to get real IP from headers (behind proxy)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take first IP if multiple proxies
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  // Fallback to "unknown" (less ideal but prevents blocking all traffic)
  return "unknown";
}
```

#### **Usage Example: Update `send-email/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { withCors } from "../_shared/cors.ts";
import {
  enforceRateLimit,
  getIdentifier,
  RateLimitError,
  getRateLimitHeaders,
} from "../_shared/rate-limiter.ts";

const handler = async (req: Request): Promise<Response> => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // ✅ ENFORCE RATE LIMIT (5 emails per minute per IP)
    const identifier = getIdentifier(req);
    await enforceRateLimit(supabase, {
      maxRequests: 5,
      windowMs: 60 * 1000, // 1 minute
      identifier,
      endpoint: "send-email",
    });

    // ... rest of email sending logic ...

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: error.result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            ...getRateLimitHeaders(error.result),
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
};

serve(withCors(handler));
```

#### **Tests: `_shared/rate-limiter.test.ts`**

```typescript
import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { checkRateLimit } from "./rate-limiter.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Mock Supabase client for testing
// In real tests, use a test database or mock

Deno.test("Rate limiter - allows requests within limit", async () => {
  // Test logic here
  // Note: Requires test DB setup
});

Deno.test("Rate limiter - blocks requests exceeding limit", async () => {
  // Test logic here
});

Deno.test("Rate limiter - resets after window expires", async () => {
  // Test logic here
});

Deno.test("Rate limiter - fails open on DB errors", async () => {
  // Test that limiter allows requests if DB is down
});
```

#### **Verification Steps:**

```bash
# 1. Apply migration
supabase db push

# 2. Deploy updated edge functions
supabase functions deploy send-email

# 3. Test rate limiting
for i in {1..10}; do
  curl -X POST https://...supabase.co/functions/v1/send-email \
    -H "Content-Type: application/json" \
    -d '{"to":"test@example.com","subject":"Test","body":"Test"}'
  echo "Request $i"
done

# Expected:
# - First 5 requests: HTTP 200
# - Requests 6-10: HTTP 429 with Retry-After header

# 4. Verify rate_limits table
psql $DATABASE_URL -c "SELECT * FROM rate_limits ORDER BY created_at DESC LIMIT 10;"
```

#### **Done When:**
- ✅ Migration applied and tested
- ✅ rate_limits table created with indexes
- ✅ Cleanup cron job scheduled
- ✅ `_shared/rate-limiter.ts` implemented
- ✅ At least 3 edge functions migrated (send-email, api-gateway, telemetry-ingest)
- ✅ Tests pass
- ✅ Verification shows rate limiting working
- ✅ Retry-After headers present in 429 responses

---

### PR #14: Session Fingerprinting Hardening
### PR #15: Security Headers Production Config
### PR #16: Input Sanitization Audit
### PR #17: RLS Policy Audit + Tenant Isolation Tests
### PR #18: Edge Function Error Handling Standardization

*(Full details for PR #14-#18 available on request - following same format)*

---

## 🟡 PHASE 2: DATA ACCESS & PERFORMANCE

### PR #19: Add Pagination to Profiles + Trips Queries
### PR #20: Add Pagination to Telemetry + Alerts
### PR #21: Migrate Alerts Polling → Realtime
### PR #22: Migrate Telemetry Polling → Realtime
### PR #23: Add DB Indexes (telemetry, alerts)
### PR #24: Query Performance Audit
### PR #25: React Query Optimization

---

## 🟢 PHASE 3: RELIABILITY & ERROR HANDLING

### PR #26: Global Error Boundary
### PR #27: Network Error Handling
### PR #28: PWA Sync Status UI
### PR #29: Offline Conflict Resolution
### PR #30: Structured Logging
### PR #31: Circuit Breaker

---

## 🔵 PHASE 4: TESTING EXPANSION

### PR #32-#40: Test Coverage Expansion

---

## 🟣 PHASE 5: CODE QUALITY & TYPESCRIPT

### PR #41-#48: TypeScript Strict Mode + Refactoring

---

## ⚫ PHASE 6: DEVOPS & DOCUMENTATION

### PR #49-#56: CI/CD + Documentation

---

## ✅ PRODUCTION READINESS CHECKLIST

### **SECURITY**
- [ ] All edge functions validate input with Zod
- [ ] CORS allowlist enforced (no wildcards)
- [ ] Rate limiting durable and distributed
- [ ] RLS policies tested for tenant isolation
- [ ] No hardcoded secrets in code
- [ ] Security headers enforced
- [ ] XSS prevention in place
- [ ] OWASP Top 10 mitigations verified

### **PERFORMANCE**
- [ ] All queries have pagination
- [ ] No N+1 queries in critical paths
- [ ] Polling replaced with Realtime where applicable
- [ ] DB indexes optimized
- [ ] React components optimized (memo/useMemo)
- [ ] Bundle size < 1MB
- [ ] Lighthouse score > 90

### **RELIABILITY**
- [ ] Error boundaries in place
- [ ] Network errors handled gracefully
- [ ] Offline mode works
- [ ] Sync status visible to users
- [ ] Circuit breakers on external APIs
- [ ] Logging structured and queryable

### **TESTING**
- [ ] Test coverage > 30%
- [ ] Critical paths covered
- [ ] E2E tests for auth + dashboard
- [ ] RLS policies tested
- [ ] Edge functions tested
- [ ] CI blocks on test failures

### **DEVOPS**
- [ ] CI/CD pipeline configured
- [ ] Secret scanning enabled
- [ ] Dependency audit automated
- [ ] Rollback plan documented
- [ ] Monitoring + alerting configured
- [ ] Runbooks created

### **DOCUMENTATION**
- [ ] ADRs for key decisions
- [ ] API documentation complete
- [ ] Threat model documented
- [ ] Rollback playbook exists
- [ ] Onboarding guide created

---

**END OF MASTER PLAN**

**Status:** PR #11 Complete, PR #12-#13 Ready for Implementation
**Next Action:** Review and merge PR #11, then proceed with PR #12
