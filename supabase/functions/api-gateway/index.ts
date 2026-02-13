/**
 * API Gateway Edge Function
 *
 * Security Hardening Applied:
 * ✅ Zod schema validation for all endpoints (prevents mass assignment)
 * ✅ tenant_id injected server-side only (never accepted from client)
 * ✅ CORS allowlist (no wildcard)
 * ✅ Structured error responses
 * ✅ Input sanitization
 * ✅ UUID validation
 * ✅ Enum validation for controlled values
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { schemas } from "./schemas.ts";
import {
  validateRequest,
  ValidationError,
  formatValidationError,
  createErrorResponse,
  createSuccessResponse,
} from "./validation.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// CORS Allowlist - NEVER use "*" in production
const ALLOWED_ORIGINS = [
  "https://cellvi.com",
  "https://www.cellvi.com",
  "https://asegurar.com.co",
  "https://www.asegurar.com.co",
  "https://staging.cellvi.com",
  "https://preview.cellvi.com",
  Deno.env.get("DEV_ORIGIN"), // For local development (e.g., http://localhost:8080)
].filter((origin): origin is string => Boolean(origin));

// ============================================================================
// CORS UTILITIES
// ============================================================================

function getCorsHeaders(requestOrigin: string | null): HeadersInit {
  const allowedOrigin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : "";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, GET, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // ========================================================================
    // AUTHENTICATION & AUTHORIZATION
    // ========================================================================

    // Check for API key
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return createErrorResponse("Missing x-api-key header", 401);
    }

    // Validate API key and get tenant
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, status, api_key_expires_at")
      .eq("api_key", apiKey)
      .single();

    if (tenantError || !tenant) {
      console.error("Invalid API key attempt:", { error: tenantError?.message });
      return createErrorResponse("Invalid API key", 403);
    }

    // Check tenant status
    if (tenant.status !== "active") {
      return createErrorResponse(`Tenant is ${tenant.status}`, 403);
    }

    // Check API key expiration (if applicable)
    if (tenant.api_key_expires_at) {
      const expiresAt = new Date(tenant.api_key_expires_at);
      if (expiresAt < new Date()) {
        return createErrorResponse("API key has expired", 403);
      }
    }

    const tenantId = tenant.id;

    // ========================================================================
    // ROUTING
    // ========================================================================

    const url = new URL(req.url);
    const path = url.pathname.replace("/api-gateway", "");
    const method = req.method;

    // ========================================================================
    // POST /orders - Create Order
    // ========================================================================
    if (method === "POST" && path === "/orders") {
      const rawBody = await req.json();

      // ✅ CRITICAL: Validate BEFORE touching database
      const validatedData = validateRequest(schemas["POST /orders"], rawBody);

      // Insert with server-side tenant_id (never from client)
      const { data: order, error: insertError } = await supabase
        .from("orders")
        .insert({
          ...validatedData,
          tenant_id: tenantId, // ✅ SERVER-SIDE ONLY
          status: "pending",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Order insert error:", insertError);
        return createErrorResponse("Failed to create order", 500, {
          details: insertError.message,
        });
      }

      return createSuccessResponse(order, 201);
    }

    // ========================================================================
    // POST /trips - Create Trip
    // ========================================================================
    if (method === "POST" && path === "/trips") {
      const rawBody = await req.json();
      const validatedData = validateRequest(schemas["POST /trips"], rawBody);

      const { data: trip, error: insertError } = await supabase
        .from("trips")
        .insert({
          ...validatedData,
          tenant_id: tenantId,
          status: "scheduled",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Trip insert error:", insertError);
        return createErrorResponse("Failed to create trip", 500, {
          details: insertError.message,
        });
      }

      return createSuccessResponse(trip, 201);
    }

    // ========================================================================
    // POST /work-orders - Create Work Order
    // ========================================================================
    if (method === "POST" && path === "/work-orders") {
      const rawBody = await req.json();
      const validatedData = validateRequest(schemas["POST /work-orders"], rawBody);

      const { data: workOrder, error: insertError } = await supabase
        .from("work_orders")
        .insert({
          ...validatedData,
          tenant_id: tenantId,
          status: "pending",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Work order insert error:", insertError);
        return createErrorResponse("Failed to create work order", 500, {
          details: insertError.message,
        });
      }

      return createSuccessResponse(workOrder, 201);
    }

    // ========================================================================
    // POST /vehicles - Create Vehicle
    // ========================================================================
    if (method === "POST" && path === "/vehicles") {
      const rawBody = await req.json();
      const validatedData = validateRequest(schemas["POST /vehicles"], rawBody);

      const { data: vehicle, error: insertError } = await supabase
        .from("vehicles")
        .insert({
          ...validatedData,
          tenant_id: tenantId,
          status: "active",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Vehicle insert error:", insertError);
        return createErrorResponse("Failed to create vehicle", 500, {
          details: insertError.message,
        });
      }

      return createSuccessResponse(vehicle, 201);
    }

    // ========================================================================
    // PATCH /vehicles/:id - Update Vehicle
    // ========================================================================
    if (method === "PATCH" && path.startsWith("/vehicles/")) {
      const vehicleId = path.split("/")[2];
      if (!vehicleId) {
        return createErrorResponse("Missing vehicle ID", 400);
      }

      const rawBody = await req.json();
      const validatedData = validateRequest(schemas["PATCH /vehicles/:id"], rawBody);

      // Ensure tenant owns this vehicle
      const { data: existing, error: fetchError } = await supabase
        .from("vehicles")
        .select("id")
        .eq("id", vehicleId)
        .eq("tenant_id", tenantId)
        .single();

      if (fetchError || !existing) {
        return createErrorResponse("Vehicle not found", 404);
      }

      const { data: vehicle, error: updateError } = await supabase
        .from("vehicles")
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vehicleId)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (updateError) {
        console.error("Vehicle update error:", updateError);
        return createErrorResponse("Failed to update vehicle", 500, {
          details: updateError.message,
        });
      }

      return createSuccessResponse(vehicle, 200);
    }

    // ========================================================================
    // POST /drivers - Create Driver
    // ========================================================================
    if (method === "POST" && path === "/drivers") {
      const rawBody = await req.json();
      const validatedData = validateRequest(schemas["POST /drivers"], rawBody);

      const { data: driver, error: insertError } = await supabase
        .from("drivers")
        .insert({
          ...validatedData,
          tenant_id: tenantId,
          status: "active",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Driver insert error:", insertError);
        return createErrorResponse("Failed to create driver", 500, {
          details: insertError.message,
        });
      }

      return createSuccessResponse(driver, 201);
    }

    // ========================================================================
    // POST /alerts - Create Alert
    // ========================================================================
    if (method === "POST" && path === "/alerts") {
      const rawBody = await req.json();
      const validatedData = validateRequest(schemas["POST /alerts"], rawBody);

      const { data: alert, error: insertError } = await supabase
        .from("alerts")
        .insert({
          ...validatedData,
          tenant_id: tenantId,
          status: "open",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Alert insert error:", insertError);
        return createErrorResponse("Failed to create alert", 500, {
          details: insertError.message,
        });
      }

      return createSuccessResponse(alert, 201);
    }

    // ========================================================================
    // PATCH /alerts/:id/acknowledge - Acknowledge Alert
    // ========================================================================
    if (method === "PATCH" && path.match(/^\/alerts\/[^/]+\/acknowledge$/)) {
      const alertId = path.split("/")[2];
      const rawBody = await req.json();
      const validatedData = validateRequest(schemas["PATCH /alerts/:id/acknowledge"], rawBody);

      // Ensure tenant owns this alert
      const { data: existing, error: fetchError } = await supabase
        .from("alerts")
        .select("id")
        .eq("id", alertId)
        .eq("tenant_id", tenantId)
        .single();

      if (fetchError || !existing) {
        return createErrorResponse("Alert not found", 404);
      }

      const { data: alert, error: updateError } = await supabase
        .from("alerts")
        .update({
          status: "acknowledged",
          acknowledged_at: new Date().toISOString(),
          notes: validatedData.notes,
        })
        .eq("id", alertId)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (updateError) {
        console.error("Alert acknowledge error:", updateError);
        return createErrorResponse("Failed to acknowledge alert", 500, {
          details: updateError.message,
        });
      }

      return createSuccessResponse(alert, 200);
    }

    // ========================================================================
    // POST /geofences - Create Geofence
    // ========================================================================
    if (method === "POST" && path === "/geofences") {
      const rawBody = await req.json();
      const validatedData = validateRequest(schemas["POST /geofences"], rawBody);

      const { data: geofence, error: insertError } = await supabase
        .from("geofences")
        .insert({
          ...validatedData,
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Geofence insert error:", insertError);
        return createErrorResponse("Failed to create geofence", 500, {
          details: insertError.message,
        });
      }

      return createSuccessResponse(geofence, 201);
    }

    // ========================================================================
    // POST /inventory - Create Inventory Item
    // ========================================================================
    if (method === "POST" && path === "/inventory") {
      const rawBody = await req.json();
      const validatedData = validateRequest(schemas["POST /inventory"], rawBody);

      const { data: item, error: insertError } = await supabase
        .from("inventory_items")
        .insert({
          ...validatedData,
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Inventory insert error:", insertError);
        return createErrorResponse("Failed to create inventory item", 500, {
          details: insertError.message,
        });
      }

      return createSuccessResponse(item, 201);
    }

    // ========================================================================
    // POST /fuel-logs - Create Fuel Log
    // ========================================================================
    if (method === "POST" && path === "/fuel-logs") {
      const rawBody = await req.json();
      const validatedData = validateRequest(schemas["POST /fuel-logs"], rawBody);

      const { data: fuelLog, error: insertError } = await supabase
        .from("fuel_logs")
        .insert({
          ...validatedData,
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Fuel log insert error:", insertError);
        return createErrorResponse("Failed to create fuel log", 500, {
          details: insertError.message,
        });
      }

      return createSuccessResponse(fuelLog, 201);
    }

    // ========================================================================
    // 404 - Route Not Found
    // ========================================================================
    return createErrorResponse("Endpoint not found", 404, {
      path,
      method,
      availableEndpoints: [
        "POST /orders",
        "POST /trips",
        "POST /work-orders",
        "POST /vehicles",
        "PATCH /vehicles/:id",
        "POST /drivers",
        "POST /alerts",
        "PATCH /alerts/:id/acknowledge",
        "POST /geofences",
        "POST /inventory",
        "POST /fuel-logs",
      ],
    });

  } catch (error) {
    console.error("Request error:", error);

    // Handle validation errors
    if (error instanceof ValidationError) {
      const response = new Response(
        JSON.stringify(formatValidationError(error)),
        {
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
      return response;
    }

    // Handle other errors
    const errorResponse = createErrorResponse(
      "Internal server error",
      500,
      {
        message: error instanceof Error ? error.message : "Unknown error",
      }
    );

    const newHeaders = new Headers(errorResponse.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(errorResponse.body, {
      status: errorResponse.status,
      headers: newHeaders,
    });
  }
});
