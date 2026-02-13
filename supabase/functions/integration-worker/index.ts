
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. FETCH CANDIDATE JOBS (Optimistic Concurrency)
        // We fetch jobs that are queued/retrying AND not currently locked by another worker (timeout logic)
        const { data: jobs, error } = await supabase
            .from("integration_jobs")
            .select("*")
            .in("status", ["queued", "retrying"])
            .lte("next_run_at", new Date().toISOString())
            .limit(5);

        if (error) throw error;
        if (!jobs || jobs.length === 0) {
            return new Response(JSON.stringify({ message: "No pending jobs found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const results = [];

        // 2. PROCESS LOOP
        for (const job of jobs) {
            const workerId = crypto.randomUUID();

            // Try to lock the job
            // In a real pg environment we would use 'FOR UPDATE SKIP LOCKED', but via API we try optimistic update
            // If another worker picked it up, this update might fail or return 0 rows if we added versioning.
            // Here we assume low contention for MVP.

            const { error: lockError } = await supabase.from("integration_jobs")
                .update({
                    status: "processing",
                    attempts: (job.attempts || 0) + 1,
                    executed_by: workerId,
                    locked_until: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min lock
                })
                .eq("id", job.id)
                .eq("status", job.status); // Optimistic lock

            if (lockError) {
                console.warn(`Could not lock job ${job.id}, skipping.`);
                continue;
            }

            let success = false;
            let dlqReason = null;
            const startTime = Date.now();

            try {
                // --- IDEMPOTENCY CHECK ---
                // If this manifest has already been processed successfully (check by idempotency_key in completed jobs)
                if (job.idempotency_key) {
                    const { data: existing } = await supabase.from("integration_jobs")
                        .select("id")
                        .eq("idempotency_key", job.idempotency_key)
                        .eq("status", "completed")
                        .neq("id", job.id) // Not this job
                        .single();

                    if (existing) {
                        // Optimization: Mark as completed immediately without re-running logic
                        console.log(`Job ${job.id} is duplicate of ${existing.id}. Marking completed.`);
                        await supabase.from("integration_jobs").update({ status: "completed", dlq_reason: "Duplicate handled" }).eq("id", job.id);
                        results.push({ job: job.id, status: "skipped_duplicate" });
                        continue;
                    }
                }

                // --- BUSINESS LOGIC DISPATCHER ---
                if (job.type === "RNDC_SEND_MANIFEST") {
                    // Validate Payload
                    if (!job.payload || !job.payload.radicado_id && !job.payload.placaVehiculo) {
                        throw new Error("Invalid Payload: Missing mandatory fields"); // Non-retryable
                    }

                    // Simulate RNDC call
                    await new Promise((resolve) => setTimeout(resolve, 1500));

                    // Simulate failure
                    if (job.payload?.force_fail) throw new Error("Simulated RNDC Timeout 504");
                    if (job.payload?.force_fatal) throw new Error("FATAL: Invalid Schema XML");

                    success = true;
                } else if (job.type === "FIRE_TEST_JOB") {
                    success = true;
                } else {
                    throw new Error(`Unknown Job Type: ${job.type}`); // Non-retryable
                }

                // --- SUCCESS HANDLER ---
                if (success) {
                    await supabase.from("integration_jobs")
                        .update({ status: "completed", last_error: null, locked_until: null })
                        .eq("id", job.id);

                    await supabase.from("integration_job_logs").insert({
                        job_id: job.id,
                        request_payload: job.payload,
                        http_status: 200,
                        duration_ms: Date.now() - startTime
                    });

                    results.push({ job: job.id, status: "success" });
                }

            } catch (err: any) {
                // --- ERROR HANDLER ---
                const isFatal = err.message.startsWith("FATAL") || err.message.includes("Unknown Job Type") || err.message.includes("Invalid Payload");
                const nextAttempt = (job.attempts || 0) + 1;
                const maxAttempts = job.max_attempts || 3;

                let newStatus = "queued"; // Default to retry
                let nextRun = new Date();

                if (isFatal || nextAttempt >= maxAttempts) {
                    newStatus = "dead_letter";
                    dlqReason = isFatal ? `FATAL ERROR: ${err.message}` : `MAX ARRIES REACHED (${maxAttempts})`;
                } else {
                    // Exponential backoff: 30s, 60s, 120s...
                    const delaySeconds = 30 * Math.pow(2, nextAttempt);
                    nextRun = new Date(Date.now() + delaySeconds * 1000);
                    // If retryable, status goes back to 'retrying' (or queued) and locked_until is cleared
                }

                await supabase.from("integration_jobs").update({
                    status: newStatus === 'queued' ? 'retrying' : newStatus,
                    last_error: err.message,
                    dlq_reason: dlqReason,
                    next_run_at: nextRun.toISOString(),
                    locked_until: null
                }).eq("id", job.id);

                results.push({ job: job.id, status: newStatus, error: err.message });
            }
        }

        return new Response(JSON.stringify({ processed: results.length, details: results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
