import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { checkRateLimit, rateLimitResponse, rateLimitHeaders, VERIFY_LIMIT } from "../_shared/rate-limiter.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // ── Rate Limiting: 20 requests/minute per IP ──
    const rl = checkRateLimit(req, VERIFY_LIMIT);
    if (!rl.allowed) {
        return rateLimitResponse(rl, corsHeaders);
    }

    try {
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeSecretKey) {
            throw new Error("STRIPE_SECRET_KEY not configured");
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
            httpClient: Stripe.createFetchHttpClient(),
        });

        const { sessionId } = await req.json();

        if (!sessionId) {
            return new Response(
                JSON.stringify({ error: "Missing sessionId" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Validate sessionId format (Stripe IDs start with cs_)
        if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
            return new Response(
                JSON.stringify({ error: "Invalid session ID format" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ["subscription", "customer"],
        });

        const status = session.payment_status === "paid"
            ? "completed"
            : session.status === "expired"
                ? "expired"
                : "pending";

        return new Response(
            JSON.stringify({
                id: session.id,
                status,
                amountCents: session.amount_total,
                currency: session.currency?.toUpperCase(),
                customerEmail: (typeof session.customer === "object" && session.customer !== null && "email" in session.customer ? (session.customer as { email?: string }).email : undefined) || session.customer_details?.email,
                planKey: session.metadata?.planKey,
                billingPeriod: session.metadata?.billingPeriod,
                provider: "stripe",
                createdAt: new Date((session.created || 0) * 1000).toISOString(),
                url: session.url,
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
        console.error("[verify-checkout] Error:", errMsg);
        return new Response(
            JSON.stringify({ error: errMsg }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            }
        );
    }
});
