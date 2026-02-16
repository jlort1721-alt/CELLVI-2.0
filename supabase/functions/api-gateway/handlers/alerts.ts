import { RouteHandler } from "../router.ts";
import { validateRequest, createErrorResponse, createSuccessResponse } from "../validation.ts";
import { CreateAlertSchema, AcknowledgeAlertSchema } from "../schemas.ts";
import {
  parsePaginationParams,
  applyPagination,
  applyFilters,
  createPaginatedResponse,
} from "../pagination.ts";

export const listAlerts: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId, url } = context;

  try {
    const pagination = parsePaginationParams(url);

    let query = supabase
      .from("alerts")
      .select("*, vehicle:vehicles(plate, brand, model)", { count: "exact" })
      .eq("tenant_id", tenantId);

    query = applyFilters(query, pagination.filter);
    query = applyPagination(query, pagination);

    const { data, error, count } = await query;

    if (error) {
      return createErrorResponse("Failed to fetch alerts", 500, { details: error.message });
    }

    return new Response(
      JSON.stringify(createPaginatedResponse(data || [], count || 0, pagination)),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (error) {
    return createErrorResponse("Internal server error", 500);
  }
};

export const getAlert: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: alert, error } = await supabase
    .from("alerts")
    .select("*, vehicle:vehicles(plate, brand, model)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !alert) {
    return createErrorResponse("Alert not found", 404);
  }

  return createSuccessResponse(alert, 200);
};

export const createAlert: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;

  const rawBody = await req.json();
  const validatedData = validateRequest(CreateAlertSchema, rawBody);

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
    return createErrorResponse("Failed to create alert", 500, { details: insertError.message });
  }

  return createSuccessResponse(alert, 201);
};

export const acknowledgeAlert: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const rawBody = await req.json();
  const validatedData = validateRequest(AcknowledgeAlertSchema, rawBody);

  const { data: existing, error: fetchError } = await supabase
    .from("alerts")
    .select("id")
    .eq("id", id)
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
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (updateError) {
    return createErrorResponse("Failed to acknowledge alert", 500, { details: updateError.message });
  }

  return createSuccessResponse(alert, 200);
};

export const deleteAlert: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: existing, error: fetchError } = await supabase
    .from("alerts")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !existing) {
    return createErrorResponse("Alert not found", 404);
  }

  const { data: alert, error: deleteError } = await supabase
    .from("alerts")
    .update({
      status: "dismissed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (deleteError) {
    return createErrorResponse("Failed to delete alert", 500, { details: deleteError.message });
  }

  return createSuccessResponse({ message: "Alert dismissed successfully", alert }, 200);
};
