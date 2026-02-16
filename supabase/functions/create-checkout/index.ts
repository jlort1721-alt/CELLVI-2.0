import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { withCors } from "../_shared/cors.ts";
import { enforceRateLimit, getIdentifier, CHECKOUT_RATE_LIMIT } from "../_shared/rate-limiter.ts";

const handler = async (req: Request): Promise<Response> => {
  try {
    // Initialize Supabase client for rate limiting
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ✅ RATE LIMITING: 5 requests/minute per IP
    const identifier = getIdentifier(req);
    await enforceRateLimit(supabase, {
      ...CHECKOUT_RATE_LIMIT,
      identifier,
      endpoint: "create-checkout",
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
    const { priceId, quantity, customerEmail, metadata, successUrl, cancelUrl } = await req.json();

    if (!priceId || !quantity || !customerEmail) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          required: ["priceId", "quantity", "customerEmail"],
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate quantity
    if (typeof quantity !== "number" || quantity < 1 || quantity > 100) {
      return new Response(
        JSON.stringify({ error: "Quantity must be between 1 and 100" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      mode: "subscription",
      customer_email: customerEmail,
      metadata: metadata || {},
      success_url: successUrl || `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      tax_id_collection: {
        enabled: true,
      },
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[create-checkout] Error:", error);

    // Handle rate limit errors
    if (error.name === "RateLimitError") {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          message: error.message,
        }),
        {
          status: error.statusCode || 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(error.result?.retryAfter || 60),
          },
        }
      );
    }

    // Handle Stripe errors
    if (error.type) {
      return new Response(
        JSON.stringify({
          error: "Stripe error",
          message: error.message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message || "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Serve with CORS wrapper
serve(withCors(handler));
