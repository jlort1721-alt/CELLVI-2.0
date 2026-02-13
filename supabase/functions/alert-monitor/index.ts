
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Get Health Metrics (SQL View)
        const { data: health, error } = await supabase
            .from("ops_system_health")
            .select("*")
            .single();

        if (error) throw error;
        if (!health) return new Response("No health data", { status: 404 });

        const alerts = [];

        // 2. CHECK THRESHOLDS
        if (health.dlq_hourly_spike > 5) {
            alerts.push(`🚨 CRITICAL: RNDC DLQ Spike (${health.dlq_hourly_spike} failures/hour)`);
        } else if (health.dlq_hourly_spike > 0) {
            alerts.push(`⚠️ WARNING: RNDC DLQ Active (${health.dlq_hourly_spike} failures)`);
        }

        if (health.jobs_lagged_5m > 50) {
            alerts.push(`🚨 CRITICAL: Worker Lag (${health.jobs_lagged_5m} jobs waiting > 5m). Check integration-worker!`);
        }

        // 3. DISPATCH ALERTS (Mock via Console Log for MVP, Slack Webhook for Prod)
        if (alerts.length > 0) {
            const message = `[CELLVI OPS] ${alerts.join("\n")}`;
            console.error(message);

            // Slack Webhook Integration (Uncomment for prod)
            /*
            await fetch(Deno.env.get("SLACK_WEBHOOK_URL"), {
                method: "POST",
                body: JSON.stringify({ text: message }) 
            });
            */

            return new Response(JSON.stringify({ status: "ALERT_SENT", alerts }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({ status: "HEALTHY", metrics: health }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
