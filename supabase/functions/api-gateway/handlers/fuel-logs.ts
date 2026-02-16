import { RouteHandler } from "../router.ts";
import { validateRequest, createErrorResponse, createSuccessResponse } from "../validation.ts";
import { CreateFuelLogSchema } from "../schemas.ts";
import {
  parsePaginationParams,
  applyPagination,
  applyFilters,
  createPaginatedResponse,
} from "../pagination.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const UpdateFuelLogSchema = z.object({
  notes: z.string().max(500).optional(),
}).strict();

export const listFuelLogs: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId, url } = context;

  try {
    const pagination = parsePaginationParams(url);

    let query = supabase
      .from("fuel_logs")
      .select("*, vehicle:vehicles(plate, brand, model), driver:drivers(first_name, last_name)", { count: "exact" })
      .eq("tenant_id", tenantId);

    query = applyFilters(query, pagination.filter);
    query = applyPagination(query, pagination);

    const { data, error, count } = await query;

    if (error) {
      return createErrorResponse("Failed to fetch fuel logs", 500, { details: error.message });
    }

    return new Response(
      JSON.stringify(createPaginatedResponse(data || [], count || 0, pagination)),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (error) {
    return createErrorResponse("Internal server error", 500);
  }
};

export const getFuelLog: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: fuelLog, error } = await supabase
    .from("fuel_logs")
    .select("*, vehicle:vehicles(plate, brand, model), driver:drivers(first_name, last_name)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !fuelLog) {
    return createErrorResponse("Fuel log not found", 404);
  }

  return createSuccessResponse(fuelLog, 200);
};

export const createFuelLog: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;

  const rawBody = await req.json();
  const validatedData = validateRequest(CreateFuelLogSchema, rawBody);

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
    return createErrorResponse("Failed to create fuel log", 500, { details: insertError.message });
  }

  return createSuccessResponse(fuelLog, 201);
};

export const updateFuelLog: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const rawBody = await req.json();
  const validatedData = validateRequest(UpdateFuelLogSchema, rawBody);

  const { data: existing, error: fetchError } = await supabase
    .from("fuel_logs")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !existing) {
    return createErrorResponse("Fuel log not found", 404);
  }

  const { data: fuelLog, error: updateError } = await supabase
    .from("fuel_logs")
    .update({
      ...validatedData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (updateError) {
    return createErrorResponse("Failed to update fuel log", 500, { details: updateError.message });
  }

  return createSuccessResponse(fuelLog, 200);
};

export const deleteFuelLog: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: existing, error: fetchError } = await supabase
    .from("fuel_logs")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !existing) {
    return createErrorResponse("Fuel log not found", 404);
  }

  // Hard delete for fuel logs
  const { error: deleteError } = await supabase
    .from("fuel_logs")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (deleteError) {
    return createErrorResponse("Failed to delete fuel log", 500, { details: deleteError.message });
  }

  return createSuccessResponse({ message: "Fuel log deleted successfully" }, 200);
};
