import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * Durable Rate Limiter using Postgres - PR #13
 * Survives deploys, shared across instances, fail-open strategy
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string;
  endpoint: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export class RateLimitError extends Error {
  constructor(public result: RateLimitResult, public statusCode = 429) {
    super(`Rate limit exceeded. Retry after ${result.retryAfter} seconds.`);
    this.name = "RateLimitError";
  }
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + config.windowMs);

  try {
    const { data: existing, error: fetchError } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("identifier", config.identifier)
      .eq("endpoint", config.endpoint)
      .gte("window_end", now.toISOString())
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("[RateLimiter] Fetch error (failing open):", fetchError);
      return { allowed: true, remaining: config.maxRequests - 1, resetAt: windowEnd };
    }

    if (!existing) {
      const { error: insertError } = await supabase.from("rate_limits").insert({
        identifier: config.identifier,
        endpoint: config.endpoint,
        requests_count: 1,
        window_start: now.toISOString(),
        window_end: windowEnd.toISOString(),
      });

      if (insertError) {
        console.error("[RateLimiter] Insert error (failing open):", insertError);
        return { allowed: true, remaining: config.maxRequests - 1, resetAt: windowEnd };
      }

      return { allowed: true, remaining: config.maxRequests - 1, resetAt: windowEnd };
    }

    const currentCount = existing.requests_count;
    const resetAt = new Date(existing.window_end);

    if (currentCount >= config.maxRequests) {
      const retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);
      return { allowed: false, remaining: 0, resetAt, retryAfter: Math.max(retryAfter, 1) };
    }

    const { error: updateError } = await supabase
      .from("rate_limits")
      .update({ requests_count: currentCount + 1, updated_at: now.toISOString() })
      .eq("id", existing.id);

    if (updateError) {
      console.error("[RateLimiter] Update error (failing open):", updateError);
      return { allowed: true, remaining: config.maxRequests - currentCount - 1, resetAt };
    }

    return { allowed: true, remaining: config.maxRequests - currentCount - 1, resetAt };

  } catch (error) {
    console.error("[RateLimiter] Unexpected error (failing open):", error);
    return { allowed: true, remaining: config.maxRequests, resetAt: windowEnd };
  }
}

export async function enforceRateLimit(supabase: SupabaseClient, config: RateLimitConfig): Promise<void> {
  const result = await checkRateLimit(supabase, config);
  if (!result.allowed) throw new RateLimitError(result);
}

export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: HeadersInit = {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": result.resetAt.toISOString(),
  };
  if (result.retryAfter) headers["Retry-After"] = String(result.retryAfter);
  return headers;
}

export function getIdentifier(req: Request, preferUserId?: string): string {
  if (preferUserId) return `user:${preferUserId}`;
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return `ip:${forwardedFor.split(",")[0].trim()}`;
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return `ip:${realIp}`;
  return "ip:unknown";
}

// ============================================================================
// COMPATIBILITY PRESETS - For payment functions migration
// ============================================================================

/**
 * Rate limit preset for checkout creation
 * 5 requests per minute per IP
 */
export const CHECKOUT_RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 60_000, // 1 minute
} as const;

/**
 * Rate limit preset for checkout verification
 * 10 requests per minute per IP
 */
export const VERIFY_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60_000,
} as const;

/**
 * Rate limit preset for customer portal
 * 3 requests per minute per IP
 */
export const PORTAL_RATE_LIMIT = {
  maxRequests: 3,
  windowMs: 60_000,
} as const;
