/**
 * API Gateway Edge Function - Modular Router Architecture
 *
 * Security Hardening Applied:
 * ✅ Zod schema validation for all endpoints (prevents mass assignment)
 * ✅ tenant_id injected server-side only (never accepted from client)
 * ✅ CORS allowlist (no wildcard)
 * ✅ Modular handler-based routing (replaces 519-line monolith)
 * ✅ Pagination, search, and filtering for all GET endpoints
 * ✅ Full CRUD operations for all resources
 * ✅ Structured error responses
 * ✅ Input sanitization and UUID validation
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { createRouter, RouteContext } from "./router.ts";
import {
  ValidationError,
  formatValidationError,
  createErrorResponse,
} from "./validation.ts";

// Import all handlers
import * as vehiclesHandler from "./handlers/vehicles.ts";
import * as driversHandler from "./handlers/drivers.ts";
import * as tripsHandler from "./handlers/trips.ts";
import * as ordersHandler from "./handlers/orders.ts";
import * as workOrdersHandler from "./handlers/work-orders.ts";
import * as alertsHandler from "./handlers/alerts.ts";
import * as geofencesHandler from "./handlers/geofences.ts";
import * as inventoryHandler from "./handlers/inventory.ts";
import * as fuelLogsHandler from "./handlers/fuel-logs.ts";
import * as webhooksHandler from "./handlers/webhooks.ts";
import * as billingHandler from "./handlers/billing.ts";
import * as authHandler from "./handlers/auth.ts";

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
    "Access-Control-Allow-Methods": "POST, GET, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

function registerRoutes() {
  const router = createRouter();

  // ========================================================================
  // VEHICLES - /vehicles
  // ========================================================================
  router.get("/vehicles", vehiclesHandler.listVehicles);
  router.get("/vehicles/:id", vehiclesHandler.getVehicle);
  router.post("/vehicles", vehiclesHandler.createVehicle);
  router.patch("/vehicles/:id", vehiclesHandler.updateVehicle);
  router.delete("/vehicles/:id", vehiclesHandler.deleteVehicle);

  // ========================================================================
  // DRIVERS - /drivers
  // ========================================================================
  router.get("/drivers", driversHandler.listDrivers);
  router.get("/drivers/:id", driversHandler.getDriver);
  router.post("/drivers", driversHandler.createDriver);
  router.patch("/drivers/:id", driversHandler.updateDriver);
  router.delete("/drivers/:id", driversHandler.deleteDriver);

  // ========================================================================
  // TRIPS - /trips
  // ========================================================================
  router.get("/trips", tripsHandler.listTrips);
  router.get("/trips/:id", tripsHandler.getTrip);
  router.post("/trips", tripsHandler.createTrip);
  router.patch("/trips/:id", tripsHandler.updateTrip);
  router.delete("/trips/:id", tripsHandler.deleteTrip);

  // ========================================================================
  // ORDERS - /orders
  // ========================================================================
  router.get("/orders", ordersHandler.listOrders);
  router.get("/orders/:id", ordersHandler.getOrder);
  router.post("/orders", ordersHandler.createOrder);
  router.patch("/orders/:id", ordersHandler.updateOrder);
  router.delete("/orders/:id", ordersHandler.deleteOrder);

  // ========================================================================
  // WORK ORDERS - /work-orders
  // ========================================================================
  router.get("/work-orders", workOrdersHandler.listWorkOrders);
  router.get("/work-orders/:id", workOrdersHandler.getWorkOrder);
  router.post("/work-orders", workOrdersHandler.createWorkOrder);
  router.patch("/work-orders/:id", workOrdersHandler.updateWorkOrder);
  router.delete("/work-orders/:id", workOrdersHandler.deleteWorkOrder);

  // ========================================================================
  // ALERTS - /alerts
  // ========================================================================
  router.get("/alerts", alertsHandler.listAlerts);
  router.get("/alerts/:id", alertsHandler.getAlert);
  router.post("/alerts", alertsHandler.createAlert);
  router.patch("/alerts/:id/acknowledge", alertsHandler.acknowledgeAlert);
  router.delete("/alerts/:id", alertsHandler.deleteAlert);

  // ========================================================================
  // GEOFENCES - /geofences
  // ========================================================================
  router.get("/geofences", geofencesHandler.listGeofences);
  router.get("/geofences/:id", geofencesHandler.getGeofence);
  router.post("/geofences", geofencesHandler.createGeofence);
  router.patch("/geofences/:id", geofencesHandler.updateGeofence);
  router.delete("/geofences/:id", geofencesHandler.deleteGeofence);

  // ========================================================================
  // INVENTORY - /inventory
  // ========================================================================
  router.get("/inventory", inventoryHandler.listInventory);
  router.get("/inventory/:id", inventoryHandler.getInventoryItem);
  router.post("/inventory", inventoryHandler.createInventoryItem);
  router.patch("/inventory/:id", inventoryHandler.updateInventoryItem);
  router.delete("/inventory/:id", inventoryHandler.deleteInventoryItem);

  // ========================================================================
  // FUEL LOGS - /fuel-logs
  // ========================================================================
  router.get("/fuel-logs", fuelLogsHandler.listFuelLogs);
  router.get("/fuel-logs/:id", fuelLogsHandler.getFuelLog);
  router.post("/fuel-logs", fuelLogsHandler.createFuelLog);
  router.patch("/fuel-logs/:id", fuelLogsHandler.updateFuelLog);
  router.delete("/fuel-logs/:id", fuelLogsHandler.deleteFuelLog);

  // ========================================================================
  // WEBHOOKS - /webhooks
  // ========================================================================
  router.get("/webhooks", webhooksHandler.listWebhooks);
  router.get("/webhooks/:id", webhooksHandler.getWebhook);
  router.post("/webhooks", webhooksHandler.createWebhook);
  router.patch("/webhooks/:id", webhooksHandler.updateWebhook);
  router.delete("/webhooks/:id", webhooksHandler.deleteWebhook);
  router.get("/webhooks/:id/deliveries", webhooksHandler.getWebhookDeliveries);

  // ========================================================================
  // BILLING - /billing
  // ========================================================================
  router.get("/billing/plans", billingHandler.listPlans);
  router.get("/billing/usage", billingHandler.getUsage);
  router.get("/billing/invoices", billingHandler.listInvoices);
  router.post("/billing/upgrade", billingHandler.upgradeSubscription);
  router.post("/billing/cancel", billingHandler.cancelSubscription);

  // ========================================================================
  // AUTH - /auth
  // ========================================================================
  router.post("/auth/login", authHandler.login);
  router.post("/auth/register", authHandler.register);
  router.post("/auth/refresh", authHandler.refresh);
  router.post("/auth/logout", authHandler.logout);

  return router;
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
      const response = createErrorResponse("Missing x-api-key header", 401);
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
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
      const response = createErrorResponse("Invalid API key", 403);
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    }

    // Check tenant status
    if (tenant.status !== "active") {
      const response = createErrorResponse(`Tenant is ${tenant.status}`, 403);
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    }

    // Check API key expiration (if applicable)
    if (tenant.api_key_expires_at) {
      const expiresAt = new Date(tenant.api_key_expires_at);
      if (expiresAt < new Date()) {
        const response = createErrorResponse("API key has expired", 403);
        const newHeaders = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });
        return new Response(response.body, {
          status: response.status,
          headers: newHeaders,
        });
      }
    }

    const tenantId = tenant.id;

    // ========================================================================
    // ROUTING WITH MODULAR ROUTER
    // ========================================================================

    const router = registerRoutes();
    const url = new URL(req.url);

    // Create route context
    const context: RouteContext = {
      tenantId,
      supabase,
      url,
    };

    // Handle request with router
    const handlerResponse = await router.handle(req, context);

    // Add CORS headers to handler response
    const newHeaders = new Headers(handlerResponse.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(handlerResponse.body, {
      status: handlerResponse.status,
      headers: newHeaders,
    });

  } catch (error) {
    console.error("Request error:", error);

    // Handle validation errors
    if (error instanceof ValidationError) {
      const errorBody = formatValidationError(error);
      const newHeaders = new Headers(corsHeaders);
      newHeaders.set("content-type", "application/json");

      return new Response(
        JSON.stringify(errorBody),
        {
          status: 400,
          headers: newHeaders,
        }
      );
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
