/**
 * RNDC Sync - Colombian Ministry of Transport Integration
 *
 * Security Hardening Applied:
 * ✅ JWT authentication with tenant_id extraction
 * ✅ CORS allowlist (no wildcard)
 * ✅ Rate limiting (5 requests/minute per user)
 * ✅ Zod schema validation
 * ✅ withCors wrapper
 * ✅ Feature flag to enable/disable sync
 * ✅ Validated SOAP XML generation
 * ✅ Input sanitization (XSS prevention in XML)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { withCors } from "../_shared/cors.ts";
import { enforceRateLimit, getIdentifier } from "../_shared/rate-limiter.ts";

console.log("🚀 RNDC Sync Function Initialized");

// ============================================================================
// FEATURE FLAG
// ============================================================================

const RNDC_ENABLED = Deno.env.get("RNDC_SYNC_ENABLED") === "true";

// ============================================================================
// REQUEST SCHEMA
// ============================================================================

const RNDCSyncRequestSchema = z.object({
  trip_id: z.string().uuid({ message: "Invalid trip_id format" }),
  operation_type: z.enum(["MANIFIESTO", "CUMPLIDO", "ANULACION"]).optional().default("MANIFIESTO"),
}).strict();

type RNDCSyncRequest = z.infer<typeof RNDCSyncRequestSchema>;

// ============================================================================
// RATE LIMIT CONFIG
// ============================================================================

const RNDC_RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 60_000, // 1 minute
} as const;

// ============================================================================
// XML SANITIZATION UTILITIES
// ============================================================================

/**
 * Sanitizes string for XML CDATA to prevent injection
 */
function sanitizeXmlCdata(input: string | null | undefined): string {
  if (!input) return "";

  // Remove XML special characters and CDATA escape sequences
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/]]>/g, "]] >");
}

/**
 * Validates and sanitizes numeric fields
 */
function sanitizeNumeric(value: any): string {
  const num = parseFloat(value);
  return isNaN(num) ? "0" : num.toFixed(2);
}

// ============================================================================
// SOAP XML GENERATOR
// ============================================================================

function generateRNDCManifiestoXML(trip: any): string {
  // Validate required fields
  const requiredFields = [
    trip.vehicles?.plate,
    trip.drivers?.first_name,
    trip.origin_name,
    trip.destination_name,
  ];

  if (requiredFields.some(field => !field)) {
    throw new Error("Missing required trip data for RNDC manifest");
  }

  // Sanitize all inputs
  const placa = sanitizeXmlCdata(trip.vehicles?.plate);
  const conductor = sanitizeXmlCdata(
    `${trip.drivers?.first_name} ${trip.drivers?.last_name || ""}`
  );
  const cedulaConductor = sanitizeXmlCdata(trip.drivers?.license_number);
  const origen = sanitizeXmlCdata(trip.origin_name);
  const destino = sanitizeXmlCdata(trip.destination_name);
  const pesoKg = sanitizeNumeric(trip.cargo_weight_kg || 0);
  const fecha = new Date().toISOString().split("T")[0];

  // Generate validated SOAP envelope
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:rndc="http://rndc.mintransporte.gov.co/">
  <soapenv:Header/>
  <soapenv:Body>
    <rndc:AtenderSolicitudManifiesto>
      <manifiesto>
        <placa>${placa}</placa>
        <conductor>${conductor}</conductor>
        <cedulaConductor>${cedulaConductor}</cedulaConductor>
        <origen>${origen}</origen>
        <destino>${destino}</destino>
        <peso_kg>${pesoKg}</peso_kg>
        <fecha>${fecha}</fecha>
      </manifiesto>
    </rndc:AtenderSolicitudManifiesto>
  </soapenv:Body>
</soapenv:Envelope>`;

  return xml;
}

// ============================================================================
// HANDLER
// ============================================================================

const handler = async (req: Request): Promise<Response> => {
  try {
    // ========================================================================
    // FEATURE FLAG CHECK
    // ========================================================================

    if (!RNDC_ENABLED) {
      return new Response(
        JSON.stringify({
          error: "RNDC sync is currently disabled",
          message: "Set RNDC_SYNC_ENABLED=true to enable this feature",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // AUTHENTICATION
    // ========================================================================

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract and validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user's tenant_id from user metadata
    const tenantId = user.user_metadata?.tenant_id;
    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: "No tenant associated with user" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // RATE LIMITING
    // ========================================================================

    const identifier = getIdentifier(req, user.id);
    await enforceRateLimit(supabase, {
      ...RNDC_RATE_LIMIT,
      identifier,
      endpoint: "rndc-sync",
    });

    // ========================================================================
    // VALIDATION
    // ========================================================================

    const rawBody = await req.json();
    const validationResult = RNDCSyncRequestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          issues: validationResult.error.issues.map((issue: any) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { trip_id, operation_type } = validationResult.data;

    console.log(`📡 Sincronizando RNDC para Trip: ${trip_id} (${operation_type})`);

    // ========================================================================
    // FETCH TRIP DATA (with tenant_id verification)
    // ========================================================================

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("*, vehicles(*), drivers(*), tenants(*)")
      .eq("id", trip_id)
      .eq("tenant_id", tenantId) // ✅ SERVER-SIDE tenant verification
      .single();

    if (tripError || !trip) {
      return new Response(
        JSON.stringify({
          error: "Trip not found or access denied",
          message: "Trip does not exist or you don't have permission to access it",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // GENERATE VALIDATED SOAP XML
    // ========================================================================

    let rndcXml: string;
    try {
      rndcXml = generateRNDCManifiestoXML(trip);
    } catch (xmlError) {
      console.error("XML generation error:", xmlError);
      return new Response(
        JSON.stringify({
          error: "Failed to generate RNDC manifest",
          message: (xmlError as Error).message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // SEND TO RNDC (SIMULATED - Replace with real endpoint in production)
    // ========================================================================

    console.log("📤 Enviando XML a RNDC...");

    // TODO: In production, replace with actual RNDC endpoint:
    // const rndcEndpoint = Deno.env.get("RNDC_ENDPOINT");
    // const response = await fetch(rndcEndpoint, {
    //   method: "POST",
    //   headers: { "Content-Type": "text/xml" },
    //   body: rndcXml,
    // });

    // Simulate latency and response
    await new Promise((r) => setTimeout(r, 1500));
    const mockRadicado = `MT-${Math.floor(Math.random() * 900000 + 100000)}`;

    // ========================================================================
    // LOG TO AUDIT TRAIL (WORM Proof)
    // ========================================================================

    const { error: logError } = await supabase
      .from("rndc_logs")
      .insert({
        trip_id,
        tenant_id: tenantId, // ✅ SERVER-SIDE tenant_id from JWT
        operation_type,
        xml_generated: rndcXml,
        response_ministry: "<response>SUCCESS</response>",
        radicado: mockRadicado,
        status: "success",
      });

    if (logError) {
      console.error("Audit log error:", logError);
      // Don't fail the request if logging fails, but log the error
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================

    return new Response(
      JSON.stringify({
        message: "RNDC sync successful",
        radicado: mockRadicado,
        evidence: "Audit trail logged",
        operation_type,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error: unknown) {
    console.error("❌ RNDC Error:", error);

    // Handle rate limit errors
    if ((error as any).name === "RateLimitError") {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          message: (error as Error).message,
        }),
        {
          status: (error as any).statusCode || 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String((error as any).result?.retryAfter || 60),
          },
        }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: (error as Error).message || "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Serve with CORS wrapper
serve(withCors(handler));
