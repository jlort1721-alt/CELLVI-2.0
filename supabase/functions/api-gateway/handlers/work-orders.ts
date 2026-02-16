import { RouteHandler } from "../router.ts";
import { validateRequest, createErrorResponse, createSuccessResponse } from "../validation.ts";
import { CreateWorkOrderSchema, UpdateWorkOrderSchema } from "../schemas.ts";
import {
  parsePaginationParams,
  applyPagination,
  applySearch,
  applyFilters,
  createPaginatedResponse,
} from "../pagination.ts";

export const listWorkOrders: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId, url } = context;

  try {
    const pagination = parsePaginationParams(url);

    let query = supabase
      .from("work_orders")
      .select("*, vehicle:vehicles(plate, brand, model)", { count: "exact" })
      .eq("tenant_id", tenantId);

    query = applySearch(query, pagination.search, ["title", "description"]);
    query = applyFilters(query, pagination.filter);
    query = applyPagination(query, pagination);

    const { data, error, count } = await query;

    if (error) {
      return createErrorResponse("Failed to fetch work orders", 500, { details: error.message });
    }

    return new Response(
      JSON.stringify(createPaginatedResponse(data || [], count || 0, pagination)),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (error) {
    return createErrorResponse("Internal server error", 500);
  }
};

export const getWorkOrder: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: workOrder, error } = await supabase
    .from("work_orders")
    .select("*, vehicle:vehicles(plate, brand, model)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !workOrder) {
    return createErrorResponse("Work order not found", 404);
  }

  return createSuccessResponse(workOrder, 200);
};

export const createWorkOrder: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;

  const rawBody = await req.json();
  const validatedData = validateRequest(CreateWorkOrderSchema, rawBody);

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
    return createErrorResponse("Failed to create work order", 500, { details: insertError.message });
  }

  return createSuccessResponse(workOrder, 201);
};

export const updateWorkOrder: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const rawBody = await req.json();
  const validatedData = validateRequest(UpdateWorkOrderSchema, rawBody);

  const { data: existing, error: fetchError } = await supabase
    .from("work_orders")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !existing) {
    return createErrorResponse("Work order not found", 404);
  }

  // Remove work_order_id from validated data (it's in URL params)
  const { work_order_id: _, ...updateData } = validatedData as any;

  const { data: workOrder, error: updateError } = await supabase
    .from("work_orders")
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (updateError) {
    return createErrorResponse("Failed to update work order", 500, { details: updateError.message });
  }

  return createSuccessResponse(workOrder, 200);
};

export const deleteWorkOrder: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: existing, error: fetchError } = await supabase
    .from("work_orders")
    .select("id, status")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !existing) {
    return createErrorResponse("Work order not found", 404);
  }

  if (existing.status === "completed") {
    return createErrorResponse("Cannot delete completed work order", 400);
  }

  const { data: workOrder, error: deleteError } = await supabase
    .from("work_orders")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (deleteError) {
    return createErrorResponse("Failed to delete work order", 500, { details: deleteError.message });
  }

  return createSuccessResponse({ message: "Work order cancelled successfully", workOrder }, 200);
};
