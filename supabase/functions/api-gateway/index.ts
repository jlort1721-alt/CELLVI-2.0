
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Config (Use Service Role for bypassing RLS in gateway)
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key"
};

// Simple In-Memory Rate Limit (For demo purposes, use Redis in prod)
const RATE_LIMIT = new Map<string, number>();

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // 1. API Key Validation
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing x-api-key" }), { status: 401, headers: corsHeaders });
  }

  // Validate Key in DB
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('api_key', apiKey)
    .single();

  if (error || !tenant) {
    return new Response(JSON.stringify({ error: "Invalid API Key" }), { status: 403, headers: corsHeaders });
  }

  // 2. Routing Logic
  const url = new URL(req.url);
  const path = url.pathname.replace('/api-gateway', ''); // Remove function prefix

  try {
    if (req.method === "POST" && path === "/orders") {
      const body = await req.json();
      // Insert Logic
      const { data: order, error: insertError } = await supabase
        .from('orders')
        .insert({ ...body, tenant_id: tenant.id })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify(order), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 });
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), { status: 404, headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
