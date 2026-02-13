/**
 * Shared CORS Configuration - PR #12
 *
 * Security: NEVER use "*" wildcard in production
 * Only allow explicitly whitelisted origins
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export const ALLOWED_ORIGINS = [
  // Production domains
  "https://cellvi.com",
  "https://www.cellvi.com",
  "https://asegurar.com.co",
  "https://www.asegurar.com.co",

  // Staging environments
  "https://staging.cellvi.com",
  "https://preview.cellvi.com",

  // Development (from env var)
  Deno.env.get("DEV_ORIGIN"), // e.g., "http://localhost:8080"
].filter((origin): origin is string => Boolean(origin));

export interface CorsOptions {
  allowCredentials?: boolean;
  allowedMethods?: string[];
  allowedHeaders?: string[];
  maxAge?: number;
}

// ============================================================================
// CORS UTILITIES
// ============================================================================

/**
 * Get CORS headers for a request
 * Only returns allowed origin if in whitelist
 */
export function getCorsHeaders(
  requestOrigin: string | null,
  options: CorsOptions = {}
): HeadersInit {
  const {
    allowCredentials = false,
    allowedMethods = ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders = ["authorization", "x-client-info", "apikey", "content-type", "x-api-key"],
    maxAge = 86400, // 24 hours
  } = options;

  // ✅ SECURITY: Only allow whitelisted origins
  const allowedOrigin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : "";

  const headers: HeadersInit = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": allowedMethods.join(", "),
    "Access-Control-Allow-Headers": allowedHeaders.join(", "),
    "Access-Control-Max-Age": maxAge.toString(),
  };

  if (allowCredentials && allowedOrigin) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

/**
 * Handle preflight OPTIONS request
 */
export function handleCorsPreflightRequest(
  requestOrigin: string | null,
  options?: CorsOptions
): Response {
  const headers = getCorsHeaders(requestOrigin, options);
  return new Response(null, { status: 204, headers });
}

/**
 * Wrapper for edge function handlers with automatic CORS
 */
export function withCors(
  handler: (req: Request) => Promise<Response>,
  options: CorsOptions = {}
) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get("origin");

    // Handle preflight
    if (req.method === "OPTIONS") {
      return handleCorsPreflightRequest(origin, options);
    }

    // Call handler
    const response = await handler(req);

    // Add CORS headers to response
    const corsHeaders = getCorsHeaders(origin, options);
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}
