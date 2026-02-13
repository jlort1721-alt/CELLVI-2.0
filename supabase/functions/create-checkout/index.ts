import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { checkRateLimit, rateLimitResponse, rateLimitHeaders, CHECKOUT_LIMIT } from "../_shared/rate-limiter.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // ── Rate Limiting: 5 requests/minute per IP ──
    const rl = checkRateLimit(req, CHECKOUT_LIMIT);
    if (!rl.allowed) {
        return rateLimitResponse(rl, corsHeaders);
    }

    try {
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeSecretKey) {
            throw new Error("STRIPE_SECRET_KEY not configured in environment");
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
            httpClient: Stripe.createFetchHttpClient(),
        });

        const { priceId, quantity, customerEmail, metadata, successUrl, cancelUrl } = await req.json();

        if (!priceId || !quantity || !customerEmail) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: priceId, quantity, customerEmail" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
            return new Response(
                JSON.stringify({ error: "Invalid email format" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Validate quantity
        if (typeof quantity !== "number" || quantity < 1 || quantity > 10000) {
            return new Response(
                JSON.stringify({ error: "Quantity must be between 1 and 10,000" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create or retrieve Stripe Customer
        const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 });
        let customerId: string;

        if (existingCustomers.data.length > 0) {
            customerId = existingCustomers.data[0].id;
        } else {
            const newCustomer = await stripe.customers.create({
                email: customerEmail,
                metadata: {
                    source: "cellvi_platform",
                    ...metadata,
                },
            });
            customerId = newCustomer.id;
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: quantity,
                },
            ],
            mode: "subscription",
            success_url: successUrl || "https://cellvi.com/platform?checkout=success&session_id={CHECKOUT_SESSION_ID}",
            cancel_url: cancelUrl || "https://cellvi.com/#pricing",
            metadata: {
                ...metadata,
                created_via: "cellvi_edge_function",
            },
            subscription_data: {
                metadata: {
                    ...metadata,
                },
            },
            allow_promotion_codes: true,
            billing_address_collection: "required",
            tax_id_collection: {
                enabled: true,
            },
        });

        return new Response(
            JSON.stringify({
                url: session.url,
                sessionId: session.id,
            }),
            {
                headers: {
                    ...corsHeaders,
                    ...rateLimitHeaders(rl),
                    "Content-Type": "application/json",
                },
                status: 200,
            }
        );
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Internal error";
        console.error("[create-checkout] Error:", errMsg);
        return new Response(
            JSON.stringify({ error: errMsg }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            }
        );
    }
});
