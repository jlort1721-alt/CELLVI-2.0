import { RouteHandler } from "../router.ts";
import { validateRequest, createErrorResponse, createSuccessResponse } from "../validation.ts";
import { CreateTripSchema } from "../schemas.ts";
import {
  parsePaginationParams,
  applyPagination,
  applyFilters,
  createPaginatedResponse,
} from "../pagination.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const UpdateTripSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  actual_start: z.string().datetime().or(z.date()).optional(),
  actual_end: z.string().datetime().or(z.date()).optional(),
  actual_distance_km: z.number().positive().max(10000).optional(),
  notes: z.string().max(1000).optional(),
}).strict();

export const listTrips: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId, url } = context;

  try {
    const pagination = parsePaginationParams(url);

    let query = supabase
      .from("trips")
      .select("*, vehicle:vehicles(plate, brand, model), driver:drivers(first_name, last_name)", { count: "exact" })
      .eq("tenant_id", tenantId);

    query = applyFilters(query, pagination.filter);
    query = applyPagination(query, pagination);

    const { data, error, count } = await query;

    if (error) {
      return createErrorResponse("Failed to fetch trips", 500, { details: error.message });
    }

    return new Response(
      JSON.stringify(createPaginatedResponse(data || [], count || 0, pagination)),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (error) {
    return createErrorResponse("Internal server error", 500);
  }
};

export const getTrip: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: trip, error } = await supabase
    .from("trips")
    .select("*, vehicle:vehicles(plate, brand, model), driver:drivers(first_name, last_name)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !trip) {
    return createErrorResponse("Trip not found", 404);
  }

  return createSuccessResponse(trip, 200);
};

export const createTrip: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;

  const rawBody = await req.json();
  const validatedData = validateRequest(CreateTripSchema, rawBody);

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
    return createErrorResponse("Failed to create trip", 500, { details: insertError.message });
  }

  return createSuccessResponse(trip, 201);
};

export const updateTrip: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const rawBody = await req.json();
  const validatedData = validateRequest(UpdateTripSchema, rawBody);

  const { data: existing, error: fetchError } = await supabase
    .from("trips")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !existing) {
    return createErrorResponse("Trip not found", 404);
  }

  const { data: trip, error: updateError } = await supabase
    .from("trips")
    .update({
      ...validatedData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (updateError) {
    return createErrorResponse("Failed to update trip", 500, { details: updateError.message });
  }

  return createSuccessResponse(trip, 200);
};

export const deleteTrip: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: existing, error: fetchError } = await supabase
    .from("trips")
    .select("id, status")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !existing) {
    return createErrorResponse("Trip not found", 404);
  }

  // Only allow deletion of scheduled trips
  if (existing.status !== "scheduled") {
    return createErrorResponse("Cannot delete trip in progress or completed", 400);
  }

  const { data: trip, error: deleteError } = await supabase
    .from("trips")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (deleteError) {
    return createErrorResponse("Failed to delete trip", 500, { details: deleteError.message });
  }

  return createSuccessResponse({ message: "Trip cancelled successfully", trip }, 200);
};
