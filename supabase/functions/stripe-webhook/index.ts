import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req: Request) => {
    // CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseKey) {
            throw new Error("Missing required environment variables");
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
            httpClient: Stripe.createFetchHttpClient(),
        });

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Verify webhook signature
        const body = await req.text();
        const signature = req.headers.get("stripe-signature");

        if (!signature) {
            return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Unknown error";
            console.error("[stripe-webhook] Signature verification failed:", errMsg);
            return new Response(JSON.stringify({ error: "Invalid signature" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        console.log(`[stripe-webhook] Processing event: ${event.type} (${event.id})`);

        // ── Handle Events ──
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const customerEmail = session.customer_details?.email || session.customer_email;

                // Update subscription status in database
                const { error } = await supabase.from("subscriptions").upsert({
                    stripe_session_id: session.id,
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: session.subscription as string,
                    customer_email: customerEmail,
                    status: "active",
                    plan_key: session.metadata?.planKey || "unknown",
                    billing_period: session.metadata?.billingPeriod || "monthly",
                    amount_total: session.amount_total,
                    currency: session.currency?.toUpperCase(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: "stripe_customer_id",
                });

                if (error) {
                    console.error("[stripe-webhook] DB upsert error:", error);
                } else {
                    console.log(`[stripe-webhook] Subscription activated for ${customerEmail}`);
                }

                // Grant platform access
                if (customerEmail) {
                    const { data: user } = await supabase
                        .from("profiles")
                        .select("id")
                        .eq("email", customerEmail)
                        .single();

                    if (user) {
                        await supabase.from("profiles").update({
                            subscription_status: "active",
                            subscription_plan: session.metadata?.planKey,
                            updated_at: new Date().toISOString(),
                        }).eq("id", user.id);
                    }
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                const status = subscription.status === "active" ? "active"
                    : subscription.status === "past_due" ? "past_due"
                        : subscription.status === "canceled" ? "canceled"
                            : subscription.status;

                await supabase.from("subscriptions").update({
                    status,
                    current_period_start: new Date((subscription.current_period_start || 0) * 1000).toISOString(),
                    current_period_end: new Date((subscription.current_period_end || 0) * 1000).toISOString(),
                    cancel_at_period_end: subscription.cancel_at_period_end,
                    updated_at: new Date().toISOString(),
                }).eq("stripe_subscription_id", subscription.id);

                console.log(`[stripe-webhook] Subscription updated: ${subscription.id} -> ${status}`);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;

                await supabase.from("subscriptions").update({
                    status: "canceled",
                    canceled_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }).eq("stripe_subscription_id", subscription.id);

                // Revoke access
                const { data: sub } = await supabase
                    .from("subscriptions")
                    .select("customer_email")
                    .eq("stripe_subscription_id", subscription.id)
                    .single();

                if (sub?.customer_email) {
                    await supabase.from("profiles").update({
                        subscription_status: "canceled",
                        updated_at: new Date().toISOString(),
                    }).eq("email", sub.customer_email);
                }

                console.log(`[stripe-webhook] Subscription canceled: ${subscription.id}`);
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice;

                // Log successful payment
                await supabase.from("payment_events").insert({
                    stripe_invoice_id: invoice.id,
                    stripe_customer_id: invoice.customer as string,
                    stripe_subscription_id: invoice.subscription as string,
                    amount: invoice.amount_paid,
                    currency: invoice.currency?.toUpperCase(),
                    status: "succeeded",
                    created_at: new Date().toISOString(),
                });

                console.log(`[stripe-webhook] Payment succeeded: ${invoice.id}`);
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;

                // Log failed payment
                await supabase.from("payment_events").insert({
                    stripe_invoice_id: invoice.id,
                    stripe_customer_id: invoice.customer as string,
                    stripe_subscription_id: invoice.subscription as string,
                    amount: invoice.amount_due,
                    currency: invoice.currency?.toUpperCase(),
                    status: "failed",
                    failure_message: invoice.last_finalization_error?.message,
                    created_at: new Date().toISOString(),
                });

                // Update subscription status
                await supabase.from("subscriptions").update({
                    status: "past_due",
                    updated_at: new Date().toISOString(),
                }).eq("stripe_subscription_id", invoice.subscription as string);

                console.log(`[stripe-webhook] Payment failed: ${invoice.id}`);
                break;
            }

            default:
                console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true, type: event.type }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Internal error";
        console.error("[stripe-webhook] Error:", errMsg);
        return new Response(JSON.stringify({ error: errMsg }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
