import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { withCors } from "../_shared/cors.ts";
import { enforceRateLimit, getIdentifier, VERIFY_RATE_LIMIT } from "../_shared/rate-limiter.ts";

const handler = async (req: Request): Promise<Response> => {
  try {
    // Initialize Supabase client for rate limiting
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ✅ RATE LIMITING: 10 requests/minute per IP
    const identifier = getIdentifier(req);
    await enforceRateLimit(supabase, {
      ...VERIFY_RATE_LIMIT,
      identifier,
      endpoint: "verify-checkout",
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
    const { sessionId } = await req.json();

    if (!sessionId || typeof sessionId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid sessionId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate sessionId format (Stripe checkout sessions start with cs_)
    if (!sessionId.startsWith("cs_")) {
      return new Response(
        JSON.stringify({ error: "Invalid session ID format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    // Determine status
    const status = session.payment_status === "paid"
      ? "completed"
      : session.status === "expired"
      ? "expired"
      : "pending";

    // Extract customer email (handle both customer object and customer_details)
    const customerEmail =
      (typeof session.customer === "object" && session.customer !== null && "email" in session.customer
        ? (session.customer as { email?: string }).email
        : undefined) || session.customer_details?.email;

    // Return session details
    return new Response(
      JSON.stringify({
        id: session.id,
        status,
        amountCents: session.amount_total,
        currency: session.currency?.toUpperCase(),
        customerEmail,
        planKey: session.metadata?.planKey,
        billingPeriod: session.metadata?.billingPeriod,
        provider: "stripe",
        createdAt: new Date((session.created || 0) * 1000).toISOString(),
        url: session.url,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("[verify-checkout] Error:", error);

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
