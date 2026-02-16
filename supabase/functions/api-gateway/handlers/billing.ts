import { RouteHandler } from "../router.ts";
import { createErrorResponse, createSuccessResponse } from "../validation.ts";
import {
  parsePaginationParams,
  applyPagination,
  createPaginatedResponse,
} from "../pagination.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * Billing & Subscription Handlers
 *
 * Endpoints:
 * - GET /billing/plans - List available subscription plans
 * - GET /billing/usage - Current usage metrics for tenant
 * - GET /billing/invoices - Invoice history
 * - POST /billing/upgrade - Upgrade subscription plan
 * - POST /billing/cancel - Cancel subscription
 */

// ============================================================================
// SCHEMAS
// ============================================================================

const UpgradeSubscriptionSchema = z.object({
  plan_id: z.string().uuid("Invalid plan ID format"),
  billing_cycle: z.enum(["monthly", "annual"]).optional().default("monthly"),
  payment_method_id: z.string().optional(), // For Stripe/Wompi
}).strict();

const CancelSubscriptionSchema = z.object({
  reason: z.string().max(500).optional(),
  cancel_at_period_end: z.boolean().optional().default(true),
}).strict();

// ============================================================================
// GET /billing/plans - List subscription plans
// ============================================================================

export const listPlans: RouteHandler = async (req, params, context) => {
  const { supabase } = context;

  try {
    // Public data - no tenant filter needed
    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("active", true)
      .order("price_monthly", { ascending: true });

    if (error) {
      return createErrorResponse("Failed to fetch plans", 500, { details: error.message });
    }

    return createSuccessResponse({
      plans: plans || [],
      currency: "COP", // Colombian Pesos
    }, 200);
  } catch (error) {
    return createErrorResponse("Internal server error", 500);
  }
};

// ============================================================================
// GET /billing/usage - Current usage metrics
// ============================================================================

export const getUsage: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;

  try {
    // Get tenant's current subscription
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select(`
        *,
        subscription:subscriptions(
          id,
          plan:subscription_plans(name, limits),
          status,
          current_period_start,
          current_period_end
        )
      `)
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      return createErrorResponse("Tenant not found", 404);
    }

    // Calculate current usage from various tables
    const [vehiclesCount, driversCount, tripsCount, apiCallsCount] = await Promise.all([
      supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabase.from("drivers").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabase.from("trips").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId)
        .gte("created_at", tenant.subscription?.[0]?.current_period_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from("api_usage_logs").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId)
        .gte("created_at", tenant.subscription?.[0]?.current_period_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const subscription = tenant.subscription?.[0];
    const limits = subscription?.plan?.limits || {
      max_vehicles: 10,
      max_drivers: 10,
      max_trips_per_month: 1000,
      max_api_calls_per_month: 10000,
    };

    const usage = {
      vehicles: {
        current: vehiclesCount.count || 0,
        limit: limits.max_vehicles,
        percentage: Math.round(((vehiclesCount.count || 0) / limits.max_vehicles) * 100),
      },
      drivers: {
        current: driversCount.count || 0,
        limit: limits.max_drivers,
        percentage: Math.round(((driversCount.count || 0) / limits.max_drivers) * 100),
      },
      trips: {
        current: tripsCount.count || 0,
        limit: limits.max_trips_per_month,
        percentage: Math.round(((tripsCount.count || 0) / limits.max_trips_per_month) * 100),
      },
      api_calls: {
        current: apiCallsCount.count || 0,
        limit: limits.max_api_calls_per_month,
        percentage: Math.round(((apiCallsCount.count || 0) / limits.max_api_calls_per_month) * 100),
      },
      period: {
        start: subscription?.current_period_start,
        end: subscription?.current_period_end,
      },
    };

    return createSuccessResponse({
      usage,
      plan: subscription?.plan?.name || "Free",
      status: subscription?.status || "active",
    }, 200);
  } catch (error) {
    console.error("Usage calculation error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

// ============================================================================
// GET /billing/invoices - Invoice history
// ============================================================================

export const listInvoices: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId, url } = context;

  try {
    const pagination = parsePaginationParams(url);

    let query = supabase
      .from("invoices")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    query = applyPagination(query, pagination);

    const { data, error, count } = await query;

    if (error) {
      return createErrorResponse("Failed to fetch invoices", 500, { details: error.message });
    }

    return new Response(
      JSON.stringify(createPaginatedResponse(data || [], count || 0, pagination)),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (error) {
    return createErrorResponse("Internal server error", 500);
  }
};

// ============================================================================
// POST /billing/upgrade - Upgrade subscription
// ============================================================================

export const upgradeSubscription: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;

  try {
    const rawBody = await req.json();
    const validationResult = UpgradeSubscriptionSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          issues: validationResult.error.issues.map((issue: any) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const { plan_id, billing_cycle, payment_method_id } = validationResult.data;

    // 1. Verify plan exists and is active
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .eq("active", true)
      .single();

    if (planError || !plan) {
      return createErrorResponse("Invalid or inactive plan", 400);
    }

    // 2. Get current subscription
    const { data: currentSub } = await supabase
      .from("subscriptions")
      .select("id, plan_id, status")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .single();

    // 3. Check if already on this plan
    if (currentSub?.plan_id === plan_id) {
      return createErrorResponse("Already subscribed to this plan", 400);
    }

    // 4. Calculate pricing
    const price = billing_cycle === "annual"
      ? plan.price_annual
      : plan.price_monthly;

    const prorationAmount = currentSub
      ? await calculateProration(supabase, currentSub.id, plan_id, billing_cycle)
      : 0;

    // 5. Create new subscription (will be activated after payment)
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    if (billing_cycle === "annual") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const { data: newSubscription, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        tenant_id: tenantId,
        plan_id,
        status: "pending_payment",
        billing_cycle,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (subError) {
      return createErrorResponse("Failed to create subscription", 500, { details: subError.message });
    }

    // 6. Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        tenant_id: tenantId,
        subscription_id: newSubscription.id,
        amount: price + prorationAmount,
        currency: "COP",
        status: "pending",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        line_items: [
          {
            description: `${plan.name} - ${billing_cycle}`,
            quantity: 1,
            unit_price: price,
            total: price,
          },
          ...(prorationAmount > 0 ? [{
            description: "Proration credit",
            quantity: 1,
            unit_price: prorationAmount,
            total: prorationAmount,
          }] : []),
        ],
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Failed to create invoice:", invoiceError);
    }

    // 7. If payment method provided, initiate payment
    // This would integrate with Stripe/Wompi
    let paymentUrl = null;
    if (payment_method_id) {
      // TODO: Integrate with payment processor
      // For now, return payment URL placeholder
      paymentUrl = `/payments/checkout/${invoice?.id}`;
    }

    return createSuccessResponse({
      subscription: newSubscription,
      invoice,
      payment_url: paymentUrl,
      message: payment_method_id
        ? "Subscription upgrade initiated. Complete payment to activate."
        : "Subscription created. Please complete payment.",
    }, 201);
  } catch (error) {
    console.error("Upgrade error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

// ============================================================================
// POST /billing/cancel - Cancel subscription
// ============================================================================

export const cancelSubscription: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;

  try {
    const rawBody = await req.json();
    const validationResult = CancelSubscriptionSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          issues: validationResult.error.issues.map((issue: any) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const { reason, cancel_at_period_end } = validationResult.data;

    // Get active subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .single();

    if (subError || !subscription) {
      return createErrorResponse("No active subscription found", 404);
    }

    // Update subscription
    const updateData = cancel_at_period_end
      ? {
          cancel_at_period_end: true,
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
        }
      : {
          status: "cancelled",
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
        };

    const { data: updatedSub, error: updateError } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("id", subscription.id)
      .select()
      .single();

    if (updateError) {
      return createErrorResponse("Failed to cancel subscription", 500, { details: updateError.message });
    }

    // Log cancellation
    await supabase.from("subscription_events").insert({
      subscription_id: subscription.id,
      tenant_id: tenantId,
      event_type: cancel_at_period_end ? "cancel_scheduled" : "cancelled",
      metadata: { reason },
      created_at: new Date().toISOString(),
    });

    return createSuccessResponse({
      subscription: updatedSub,
      message: cancel_at_period_end
        ? `Subscription will be cancelled at the end of the current period (${subscription.current_period_end})`
        : "Subscription cancelled immediately",
    }, 200);
  } catch (error) {
    console.error("Cancellation error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate proration amount for subscription upgrade/downgrade
 */
async function calculateProration(
  supabase: any,
  currentSubId: string,
  newPlanId: string,
  billingCycle: string
): Promise<number> {
  // Get current subscription details
  const { data: currentSub } = await supabase
    .from("subscriptions")
    .select(`
      *,
      plan:subscription_plans(price_monthly, price_annual)
    `)
    .eq("id", currentSubId)
    .single();

  if (!currentSub) return 0;

  // Get new plan details
  const { data: newPlan } = await supabase
    .from("subscription_plans")
    .select("price_monthly, price_annual")
    .eq("id", newPlanId)
    .single();

  if (!newPlan) return 0;

  // Calculate unused time in current period
  const now = new Date();
  const periodStart = new Date(currentSub.current_period_start);
  const periodEnd = new Date(currentSub.current_period_end);

  const totalDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
  const usedDays = (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
  const remainingDays = totalDays - usedDays;

  // Calculate refund for unused time
  const currentPrice = currentSub.billing_cycle === "annual"
    ? currentSub.plan.price_annual
    : currentSub.plan.price_monthly;
  const dailyRate = currentPrice / totalDays;
  const refund = dailyRate * remainingDays;

  // Proration is negative (credit) if upgrading, positive if downgrading
  return Math.round(refund);
}
