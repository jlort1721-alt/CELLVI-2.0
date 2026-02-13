import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, rateLimitResponse, rateLimitHeaders, PORTAL_LIMIT } from "../_shared/rate-limiter.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // ── Rate Limiting: 10 requests/minute per IP ──
    const rl = checkRateLimit(req, PORTAL_LIMIT);
    if (!rl.allowed) {
        return rateLimitResponse(rl, corsHeaders);
    }

    try {
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!stripeSecretKey || !supabaseUrl || !supabaseKey) {
            throw new Error("Missing environment variables");
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
            httpClient: Stripe.createFetchHttpClient(),
        });

        // Extract Auth token
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "No authorization header" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { returnUrl } = await req.json();

        // Validate returnUrl (prevent open redirect)
        if (returnUrl && typeof returnUrl === "string") {
            try {
                const url = new URL(returnUrl);
                const allowedHosts = ["cellvi.com", "asegurarltda.com", "localhost"];
                if (!allowedHosts.some((h) => url.hostname === h || url.hostname.endsWith("." + h))) {
                    return new Response(
                        JSON.stringify({ error: "Invalid return URL" }),
                        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }
            } catch {
                return new Response(
                    JSON.stringify({ error: "Malformed return URL" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        // Find customer by email
        const customers = await stripe.customers.list({ email: user.email!, limit: 1 });

        if (customers.data.length === 0) {
            return new Response(
                JSON.stringify({ error: "No Stripe customer found for this account" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customers.data[0].id,
            return_url: returnUrl || "https://cellvi.com/platform",
        });

        return new Response(
            JSON.stringify({ url: portalSession.url }),
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
        console.error("[customer-portal] Error:", errMsg);
        return new Response(
            JSON.stringify({ error: errMsg }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            }
        );
    }
});
