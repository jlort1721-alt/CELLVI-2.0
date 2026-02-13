
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { encode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Fetch SLIs
        const { data: rndcSLI } = await supabase.from("slo_rndc_success_rate").select("*").limit(7);
        const { data: latencySLI } = await supabase.from("slo_worker_latency").select("*").limit(24);

        // 2. Metrics Calculation
        const sloTarget = 99.5;
        const latencyTarget = 30.0;

        const today = new Date();
        const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1)).toISOString().split('T')[0];

        const yesterdaySLI = rndcSLI && rndcSLI.length > 0 ? rndcSLI[0] : { success_rate_percent: 100 };
        const p95 = latencySLI && latencySLI.length > 0 ? latencySLI[0].p95_duration_sec : 0;

        const overallStatus = (yesterdaySLI.success_rate_percent >= sloTarget && p95 < latencyTarget) ? "PASS" : "FAIL";

        const reportMetrics = {
            rndc_success: yesterdaySLI.success_rate_percent,
            worker_p95: p95,
            target_success: sloTarget,
            target_p95: latencyTarget
        };

        // 3. Hash Generator (Evidence Integrity)
        const msgUint8 = new TextEncoder().encode(JSON.stringify(reportMetrics) + monday);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashHex = new TextDecoder().decode(encode(new Uint8Array(hashBuffer)));

        // 4. Persistence (Audit Trail)
        const { error: persistError } = await supabase.from("slo_reports").upsert({
            report_week: monday,
            metrics: reportMetrics,
            status: overallStatus,
            report_hash: hashHex,
            generated_at: new Date().toISOString()
        });

        if (persistError) throw persistError;

        // 5. Response
        return new Response(JSON.stringify({
            action: "REPORT_GENERATED",
            week: monday,
            status: overallStatus,
            hash: hashHex
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});
