import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Escalation Worker
// Triggered periodically (e.g., hourly via pg_cron)
// Finds alerts older than 2 hours that are still open and escalates them to fleet managers.

interface Alert {
    id: string;
    tenant_id: string;
    type: string;
    message: string;
    created_at: string;
    severity: string;
    status: string;
}

Deno.serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, serviceKey);

        console.log("Starting Escalation Check...");

        // 1. Find stale alerts (Open > 2 hours)
        // Supabase query: status=open AND created_at < NOW() - 2 hours
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

        const { data: staleAlerts, error: fetchErr } = await supabase
            .from("alerts")
            .select("id, tenant_id, type, message, created_at, severity, status")
            .eq("status", "open")
            .lt("created_at", twoHoursAgo)
            .limit(50); // Batch size

        if (fetchErr) {
            console.error("Fetch error:", fetchErr);
            throw fetchErr;
        }

        if (!staleAlerts || staleAlerts.length === 0) {
            return new Response(JSON.stringify({ message: "No stale alerts found requiring escalation." }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // 2. Filter out alerts already escalated
        // (This requires a join or separate query. For simplicity in Edge Function, we query logs)
        const alertIds = staleAlerts.map((a: Alert) => a.id);
        const { data: existingLogs } = await supabase
            .from("escalation_logs")
            .select("alert_id")
            .in("alert_id", alertIds);

        const escalatedSet = new Set(existingLogs?.map((l: { alert_id: string }) => l.alert_id));
        const toEscalate = staleAlerts.filter((a: Alert) => !escalatedSet.has(a.id));

        console.log(`Found ${staleAlerts.length} stale alerts, ${toEscalate.length} pending escalation.`);

        const results = [];

        // 3. Process Escalations
        for (const alert of toEscalate) {
            // In a real system, we'd look up the tenant's escalation contact/settings
            // For Phase 1 we use a placeholder or check if user is admin
            const managerEmail = "manager@example.com";

            // Log the escalation first (idempotency)
            const { error: logErr } = await supabase
                .from("escalation_logs")
                .insert({
                    tenant_id: alert.tenant_id,
                    alert_id: alert.id,
                    escalated_to_email: managerEmail,
                    escalation_level: 1,
                    triggered_at: new Date().toISOString()
                });

            if (!logErr) {
                // Here we would invoke the send-email function
                // await fetch(`${supabaseUrl}/functions/v1/send-email`, { body: ... })
                console.log(`Escalated alert ${alert.id} to ${managerEmail}`);
                results.push({ id: alert.id, status: "escalated", email: managerEmail });
            } else {
                console.error(`Failed to log escalation for ${alert.id}:`, logErr);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            processed_count: staleAlerts.length,
            escalated_count: results.length,
            details: results
        }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("Internal Error:", err);
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
    }
});
