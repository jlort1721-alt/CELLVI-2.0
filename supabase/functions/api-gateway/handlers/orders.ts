import { RouteHandler } from "../router.ts";
import { validateRequest, createErrorResponse, createSuccessResponse } from "../validation.ts";
import { CreateOrderSchema } from "../schemas.ts";
import {
  parsePaginationParams,
  applyPagination,
  applySearch,
  applyFilters,
  createPaginatedResponse,
} from "../pagination.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const UpdateOrderSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled']).optional(),
  delivery_date: z.string().datetime().or(z.date()).optional(),
  notes: z.string().max(1000).optional(),
  actual_delivery_date: z.string().datetime().or(z.date()).optional(),
}).strict();

export const listOrders: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId, url } = context;

  try {
    const pagination = parsePaginationParams(url);

    let query = supabase
      .from("orders")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId);

    query = applySearch(query, pagination.search, ["delivery_address"]);
    query = applyFilters(query, pagination.filter);
    query = applyPagination(query, pagination);

    const { data, error, count } = await query;

    if (error) {
      return createErrorResponse("Failed to fetch orders", 500, { details: error.message });
    }

    return new Response(
      JSON.stringify(createPaginatedResponse(data || [], count || 0, pagination)),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (error) {
    return createErrorResponse("Internal server error", 500);
  }
};

export const getOrder: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !order) {
    return createErrorResponse("Order not found", 404);
  }

  return createSuccessResponse(order, 200);
};

export const createOrder: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;

  const rawBody = await req.json();
  const validatedData = validateRequest(CreateOrderSchema, rawBody);

  const { data: order, error: insertError } = await supabase
    .from("orders")
    .insert({
      ...validatedData,
      tenant_id: tenantId,
      status: "pending",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    return createErrorResponse("Failed to create order", 500, { details: insertError.message });
  }

  return createSuccessResponse(order, 201);
};

export const updateOrder: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const rawBody = await req.json();
  const validatedData = validateRequest(UpdateOrderSchema, rawBody);

  const { data: existing, error: fetchError } = await supabase
    .from("orders")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !existing) {
    return createErrorResponse("Order not found", 404);
  }

  const { data: order, error: updateError } = await supabase
    .from("orders")
    .update({
      ...validatedData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (updateError) {
    return createErrorResponse("Failed to update order", 500, { details: updateError.message });
  }

  return createSuccessResponse(order, 200);
};

export const deleteOrder: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: existing, error: fetchError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !existing) {
    return createErrorResponse("Order not found", 404);
  }

  if (!['pending', 'confirmed'].includes(existing.status)) {
    return createErrorResponse("Cannot delete order in transit or delivered", 400);
  }

  const { data: order, error: deleteError } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (deleteError) {
    return createErrorResponse("Failed to delete order", 500, { details: deleteError.message });
  }

  return createSuccessResponse({ message: "Order cancelled successfully", order }, 200);
};
