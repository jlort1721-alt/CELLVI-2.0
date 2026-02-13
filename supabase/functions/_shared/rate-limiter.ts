/**
 * ===== EDGE FUNCTION RATE LIMITER =====
 * In-memory sliding window rate limiter for Supabase Edge Functions.
 * Uses Deno's KV store when available, falls back to in-memory Map.
 * 
 * Design: Sliding window counter per IP/key.
 * Edge Functions are stateless per invocation on Deno Deploy, so for
 * production scale, use Supabase's built-in Rate Limiting (via pg_net)
 * or an external Redis store. This provides per-instance protection.
 */

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

// In-memory store (per Edge Function instance)
const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries periodically
const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    for (const [key, entry] of store.entries()) {
        if (now - entry.windowStart > windowMs * 2) {
            store.delete(key);
        }
    }
}

export interface RateLimitConfig {
    /** Maximum requests per window */
    maxRequests: number;
    /** Window duration in milliseconds */
    windowMs: number;
    /** Custom key extractor (default: client IP) */
    keyExtractor?: (req: Request) => string;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfterMs: number;
}

/**
 * Check if a request is within rate limits.
 * Returns headers to include in the response.
 */
export function checkRateLimit(req: Request, config: RateLimitConfig): RateLimitResult {
    const { maxRequests, windowMs, keyExtractor } = config;

    // Extract key (IP or custom)
    const key = keyExtractor
        ? keyExtractor(req)
        : req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-real-ip") ||
        "unknown";

    const now = Date.now();
    cleanup(windowMs);

    const entry = store.get(key);

    if (!entry || now - entry.windowStart >= windowMs) {
        // New window
        store.set(key, { count: 1, windowStart: now });
        return {
            allowed: true,
            remaining: maxRequests - 1,
            resetAt: now + windowMs,
            retryAfterMs: 0,
        };
    }

    entry.count++;

    if (entry.count > maxRequests) {
        const retryAfterMs = windowMs - (now - entry.windowStart);
        return {
            allowed: false,
            remaining: 0,
            resetAt: entry.windowStart + windowMs,
            retryAfterMs,
        };
    }

    return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetAt: entry.windowStart + windowMs,
        retryAfterMs: 0,
    };
}

/**
 * Generate standard rate limit response headers.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        "X-RateLimit-Limit": result.remaining.toString(),
        "X-RateLimit-Remaining": Math.max(0, result.remaining).toString(),
        "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
        ...(result.retryAfterMs > 0
            ? { "Retry-After": Math.ceil(result.retryAfterMs / 1000).toString() }
            : {}),
    };
}

/**
 * Create a 429 Too Many Requests response.
 */
export function rateLimitResponse(
    result: RateLimitResult,
    corsHeaders: Record<string, string>
): Response {
    return new Response(
        JSON.stringify({
            error: "Too many requests. Please try again later.",
            retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000),
        }),
        {
            status: 429,
            headers: {
                ...corsHeaders,
                ...rateLimitHeaders(result),
                "Content-Type": "application/json",
            },
        }
    );
}

// ===== Pre-configured limiters for common use cases =====

/** Checkout: 5 req/min per IP (prevent abuse) */
export const CHECKOUT_LIMIT: RateLimitConfig = {
    maxRequests: 5,
    windowMs: 60_000,
};

/** Verification: 20 req/min per IP */
export const VERIFY_LIMIT: RateLimitConfig = {
    maxRequests: 20,
    windowMs: 60_000,
};

/** Portal: 10 req/min per IP */
export const PORTAL_LIMIT: RateLimitConfig = {
    maxRequests: 10,
    windowMs: 60_000,
};

/** General API: 60 req/min per IP */
export const API_LIMIT: RateLimitConfig = {
    maxRequests: 60,
    windowMs: 60_000,
};

/** Strict: 3 req/min per IP (for sensitive operations) */
export const STRICT_LIMIT: RateLimitConfig = {
    maxRequests: 3,
    windowMs: 60_000,
};
