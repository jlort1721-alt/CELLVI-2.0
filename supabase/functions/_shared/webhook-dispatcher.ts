/**
 * Webhook Dispatcher - Shared Utility
 *
 * Handles webhook event dispatching with:
 * - HMAC signature generation
 * - Retry logic with exponential backoff
 * - Delivery tracking
 * - Error handling
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// ============================================================================
// TYPES
// ============================================================================

export interface WebhookEvent {
  event_type: string;
  resource_type: string;
  resource_id: string;
  payload: Record<string, any>;
  tenant_id: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  max_retries: number;
  retry_delay_seconds: number;
}

export interface DeliveryResult {
  success: boolean;
  http_status_code?: number;
  response_body?: string;
  error_message?: string;
}

// ============================================================================
// HMAC SIGNATURE GENERATION
// ============================================================================

/**
 * Generates HMAC SHA-256 signature for webhook payload
 */
async function generateSignature(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);

  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ============================================================================
// WEBHOOK DELIVERY
// ============================================================================

/**
 * Delivers webhook to a single endpoint
 */
export async function deliverWebhook(
  endpoint: WebhookEndpoint,
  event: WebhookEvent,
  attemptNumber: number = 1
): Promise<DeliveryResult> {
  const payload = JSON.stringify({
    event_type: event.event_type,
    resource_type: event.resource_type,
    resource_id: event.resource_id,
    data: event.payload,
    timestamp: new Date().toISOString(),
  });

  try {
    // Generate HMAC signature
    const signature = await generateSignature(endpoint.secret, payload);

    // Send webhook request
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": event.event_type,
        "X-Webhook-Attempt": String(attemptNumber),
        "User-Agent": "CELLVI-Webhooks/1.0",
      },
      body: payload,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const responseBody = await response.text().catch(() => "");

    return {
      success: response.ok,
      http_status_code: response.status,
      response_body: responseBody.substring(0, 1000), // Limit to 1000 chars
    };
  } catch (error) {
    return {
      success: false,
      error_message: (error as Error).message || "Unknown error",
    };
  }
}

// ============================================================================
// WEBHOOK DISPATCHER
// ============================================================================

/**
 * Dispatches a webhook event to all subscribed endpoints
 *
 * @param supabase - Supabase client
 * @param event - Webhook event to dispatch
 */
export async function dispatchWebhook(
  supabase: SupabaseClient,
  event: WebhookEvent
): Promise<void> {
  console.log(`[webhook-dispatcher] Dispatching event: ${event.event_type} for ${event.resource_type}:${event.resource_id}`);

  try {
    // 1. Create event record (audit trail)
    const { data: eventRecord, error: eventError } = await supabase
      .from("webhook_events")
      .insert({
        tenant_id: event.tenant_id,
        event_type: event.event_type,
        resource_type: event.resource_type,
        resource_id: event.resource_id,
        payload: event.payload,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (eventError) {
      console.error("[webhook-dispatcher] Failed to create event record:", eventError);
      return;
    }

    // 2. Find subscribed endpoints
    const { data: endpoints, error: endpointsError } = await supabase.rpc(
      "find_subscribed_endpoints",
      {
        p_tenant_id: event.tenant_id,
        p_event_type: event.event_type,
      }
    );

    if (endpointsError) {
      console.error("[webhook-dispatcher] Failed to find endpoints:", endpointsError);
      return;
    }

    if (!endpoints || endpoints.length === 0) {
      console.log(`[webhook-dispatcher] No subscribers for event: ${event.event_type}`);
      return;
    }

    console.log(`[webhook-dispatcher] Found ${endpoints.length} subscribed endpoint(s)`);

    // 3. Deliver to each endpoint
    for (const endpoint of endpoints) {
      // Deliver asynchronously (don't await to avoid blocking)
      deliverToEndpoint(supabase, eventRecord.id, endpoint, event).catch((error) => {
        console.error(`[webhook-dispatcher] Delivery error for ${endpoint.url}:`, error);
      });
    }
  } catch (error) {
    console.error("[webhook-dispatcher] Unexpected error:", error);
  }
}

/**
 * Delivers webhook to a specific endpoint with retry logic
 */
async function deliverToEndpoint(
  supabase: SupabaseClient,
  eventId: string,
  endpoint: WebhookEndpoint,
  event: WebhookEvent
): Promise<void> {
  const maxAttempts = endpoint.max_retries + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await deliverWebhook(endpoint, event, attempt);

    // Record delivery attempt
    const deliveryRecord = {
      event_id: eventId,
      endpoint_id: endpoint.id,
      tenant_id: event.tenant_id,
      attempt_number: attempt,
      status: result.success ? "success" : (attempt < maxAttempts ? "retrying" : "failed"),
      http_status_code: result.http_status_code,
      response_body: result.response_body,
      error_message: result.error_message,
      created_at: new Date().toISOString(),
      delivered_at: result.success ? new Date().toISOString() : null,
      next_retry_at: !result.success && attempt < maxAttempts
        ? new Date(Date.now() + endpoint.retry_delay_seconds * 1000 * attempt).toISOString()
        : null,
      request_body: {
        event_type: event.event_type,
        resource_type: event.resource_type,
        resource_id: event.resource_id,
        data: event.payload,
      },
    };

    await supabase.from("webhook_deliveries").insert(deliveryRecord);

    // If successful, break the retry loop
    if (result.success) {
      console.log(`[webhook-dispatcher] ✅ Delivered to ${endpoint.url} (attempt ${attempt})`);

      // Update last_triggered_at for endpoint
      await supabase
        .from("webhook_endpoints")
        .update({ last_triggered_at: new Date().toISOString() })
        .eq("id", endpoint.id);

      break;
    }

    // If not the last attempt, wait before retrying (exponential backoff)
    if (attempt < maxAttempts) {
      const delayMs = endpoint.retry_delay_seconds * 1000 * attempt;
      console.log(`[webhook-dispatcher] ⏳ Retrying ${endpoint.url} in ${delayMs}ms (attempt ${attempt}/${maxAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } else {
      console.log(`[webhook-dispatcher] ❌ Failed to deliver to ${endpoint.url} after ${maxAttempts} attempts`);
    }
  }
}

/**
 * Helper function to dispatch common event types
 */
export function createWebhookEvent(
  tenantId: string,
  resourceType: string,
  resourceId: string,
  action: "created" | "updated" | "deleted" | "completed" | "cancelled",
  payload: Record<string, any>
): WebhookEvent {
  return {
    tenant_id: tenantId,
    event_type: `${resourceType}.${action}`,
    resource_type: resourceType,
    resource_id: resourceId,
    payload,
  };
}
