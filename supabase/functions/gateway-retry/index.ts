import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ═══════════════════════════════════════════════════════════
// Gateway Retry Processor
// Processes failed/pending messages from device_messages_raw
// Should be called periodically (e.g., every 60s via cron)
// ═══════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date().toISOString();

    // Fetch messages ready for retry (failed + past next_retry_at)
    const { data: pendingMessages, error: fetchErr } = await supabase
      .from("device_messages_raw")
      .select("*")
      .in("status", ["pending", "failed"])
      .lte("next_retry_at", now)
      .lt("attempts", 5) // respect max_attempts
      .order("created_at", { ascending: true })
      .limit(50); // batch size

    if (fetchErr) {
      return new Response(JSON.stringify({ error: "Failed to fetch pending messages", details: fetchErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No pending messages" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let failed = 0;
    let dead_lettered = 0;

    for (const msg of pendingMessages) {
      const attempt = msg.attempts + 1;

      try {
        // If it's an orphan (no device), try to find device again
        if (msg.status === "orphan" || !msg.device_id) {
          const { data: device } = await supabase
            .from("devices")
            .select("id, vehicle_id, tenant_id")
            .eq("imei", msg.imei)
            .eq("active", true)
            .single();

          if (!device) {
            // Still orphan, exponential backoff
            const backoffMs = Math.min(30000 * Math.pow(2, attempt), 3600000); // max 1 hour
            await supabase.from("device_messages_raw").update({
              attempts: attempt,
              next_retry_at: new Date(Date.now() + backoffMs).toISOString(),
              status: attempt >= 5 ? "dead_letter" : "orphan",
            }).eq("id", msg.id);

            if (attempt >= 5) dead_lettered++;
            else failed++;
            continue;
          }

          // Device found! Update and continue
          await supabase.from("device_messages_raw").update({
            device_id: device.id,
            tenant_id: device.tenant_id,
          }).eq("id", msg.id);

          msg.device_id = device.id;
          msg.tenant_id = device.tenant_id;
        }

        // Re-forward to the device-gateway for full processing
        const gatewayUrl = `${supabaseUrl}/functions/v1/device-gateway`;
        const payload = msg.raw_payload;

        const response = await fetch(gatewayUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
            "x-idempotency-key": msg.idempotency_key,
            "x-protocol": msg.protocol,
          },
          body: JSON.stringify(payload),
        });

        const body = await response.text();

        if (response.ok) {
          processed++;
        } else {
          // Exponential backoff for next retry
          const backoffMs = Math.min(30000 * Math.pow(2, attempt), 3600000);

          if (attempt >= msg.max_attempts) {
            // Move to dead letter
            await supabase.from("device_messages_raw").update({
              status: "dead_letter",
              attempts: attempt,
              error_message: `Max attempts reached. Last error: ${body}`,
            }).eq("id", msg.id);
            dead_lettered++;
          } else {
            await supabase.from("device_messages_raw").update({
              status: "failed",
              attempts: attempt,
              next_retry_at: new Date(Date.now() + backoffMs).toISOString(),
              error_message: body,
            }).eq("id", msg.id);
            failed++;
          }
        }
      } catch (msgErr) {
        const backoffMs = Math.min(30000 * Math.pow(2, attempt), 3600000);
        await supabase.from("device_messages_raw").update({
          status: attempt >= msg.max_attempts ? "dead_letter" : "failed",
          attempts: attempt,
          next_retry_at: new Date(Date.now() + backoffMs).toISOString(),
          error_message: String(msgErr),
        }).eq("id", msg.id);

        if (attempt >= msg.max_attempts) dead_lettered++;
        else failed++;
      }
    }

    return new Response(JSON.stringify({
      total_fetched: pendingMessages.length,
      processed,
      failed,
      dead_lettered,
      timestamp: now,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Gateway retry error:", err);
    return new Response(JSON.stringify({ error: "Internal error", message: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
