import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { withCors } from "../_shared/cors.ts";
import { enforceRateLimit, getIdentifier, PORTAL_RATE_LIMIT } from "../_shared/rate-limiter.ts";

const handler = async (req: Request): Promise<Response> => {
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ✅ AUTHENTICATION: Extract and validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ RATE LIMITING: 3 requests/minute per user
    const identifier = getIdentifier(req, user.id);
    await enforceRateLimit(supabase, {
      ...PORTAL_RATE_LIMIT,
      identifier,
      endpoint: "customer-portal",
    });

    // Validate Stripe configuration
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Parse and validate request body
    const { returnUrl } = await req.json();

    // ✅ SECURITY: Validate returnUrl to prevent open redirect
    if (returnUrl && typeof returnUrl === "string") {
      try {
        const url = new URL(returnUrl);
        const allowedHosts = [
          "cellvi.com",
          "asegurar.com.co",
          "asegurarltda.com",
          "localhost",
        ];

        const isAllowed = allowedHosts.some(
          (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
        );

        if (!isAllowed) {
          return new Response(
            JSON.stringify({ error: "Invalid return URL domain" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ error: "Malformed return URL" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Find Stripe customer by email
    if (!user.email) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No Stripe customer found",
          message: "Please create a subscription first",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: returnUrl || `https://cellvi.com/platform`,
    });

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("[customer-portal] Error:", error);

    // Handle rate limit errors
    if ((error as any).name === "RateLimitError") {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          message: (error as Error).message,
        }),
        {
          status: (error as any).statusCode || 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String((error as any).result?.retryAfter || 60),
          },
        }
      );
    }

    // Handle Stripe errors
    if ((error as any).type) {
      return new Response(
        JSON.stringify({
          error: "Stripe error",
          message: (error as Error).message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: (error as Error).message || "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Serve with CORS wrapper
serve(withCors(handler));
