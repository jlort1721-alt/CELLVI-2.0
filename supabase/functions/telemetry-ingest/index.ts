
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // 1. CORS Preflight
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 2. Auth Check (Simplificado: Requiere Service Role o Anon Key en MVP)
    // En prod real: Validar JWT de dispositivo IoT.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization Header");

    // 3. Parse Payload
    const payload = await req.json();
    const { vehicle_id, lat, lng, speed, acc, heading, events, metadata } = payload;

    // Validación de Schema (Fast Fail)
    if (!vehicle_id || lat === undefined || lng === undefined) {
      throw new Error("Invalid Payload: Missing mandatory GPS fields");
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error("Invalid Coordinates (Out of Range)");
    }

    // 4. Ingest (Write to DB)
    // Usamos Service Role para evitar chequeos RLS costosos en alta frecuencia (confiamos en el Token del dispositivo)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Insertar en tabla de telemetría (Raw Data)
    const { error: insertError } = await supabaseAdmin
      .from("vehicle_telemetry")
      .insert({
        vehicle_id,
        time: new Date().toISOString(), // O usar payload.timestamp si confiamos en el reloj del dispositivo
        latitude: lat,
        longitude: lng,
        speed: speed || 0,
        heading: heading || 0,
        accuracy: acc || 10,
        metadata: metadata || {},
        events: events || []
      });

    if (insertError) throw insertError;

    // 5. Response (201 Created)
    return new Response(JSON.stringify({
      success: true,
      message: "Telemetry Accepted",
      server_time: new Date().toISOString()
    }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, // Bad Request usually
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
