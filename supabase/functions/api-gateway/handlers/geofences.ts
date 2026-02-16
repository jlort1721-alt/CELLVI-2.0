import { RouteHandler } from "../router.ts";
import { validateRequest, createErrorResponse, createSuccessResponse } from "../validation.ts";
import { CreateGeofenceSchema } from "../schemas.ts";
import {
  parsePaginationParams,
  applyPagination,
  applySearch,
  applyFilters,
  createPaginatedResponse,
} from "../pagination.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const UpdateGeofenceSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  active: z.boolean().optional(),
  radius_meters: z.number().positive().max(100000).optional(),
}).strict();

export const listGeofences: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId, url } = context;

  try {
    const pagination = parsePaginationParams(url);

    let query = supabase
      .from("geofences")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId);

    query = applySearch(query, pagination.search, ["name"]);
    query = applyFilters(query, pagination.filter);
    query = applyPagination(query, pagination);

    const { data, error, count } = await query;

    if (error) {
      return createErrorResponse("Failed to fetch geofences", 500, { details: error.message });
    }

    return new Response(
      JSON.stringify(createPaginatedResponse(data || [], count || 0, pagination)),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (error) {
    return createErrorResponse("Internal server error", 500);
  }
};

export const getGeofence: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: geofence, error } = await supabase
    .from("geofences")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !geofence) {
    return createErrorResponse("Geofence not found", 404);
  }

  return createSuccessResponse(geofence, 200);
};

export const createGeofence: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;

  const rawBody = await req.json();
  const validatedData = validateRequest(CreateGeofenceSchema, rawBody);

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
    return createErrorResponse("Failed to create geofence", 500, { details: insertError.message });
  }

  return createSuccessResponse(geofence, 201);
};

export const updateGeofence: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const rawBody = await req.json();
  const validatedData = validateRequest(UpdateGeofenceSchema, rawBody);

  const { data: existing, error: fetchError } = await supabase
    .from("geofences")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !existing) {
    return createErrorResponse("Geofence not found", 404);
  }

  const { data: geofence, error: updateError } = await supabase
    .from("geofences")
    .update({
      ...validatedData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (updateError) {
    return createErrorResponse("Failed to update geofence", 500, { details: updateError.message });
  }

  return createSuccessResponse(geofence, 200);
};

export const deleteGeofence: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: existing, error: fetchError } = await supabase
    .from("geofences")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !existing) {
    return createErrorResponse("Geofence not found", 404);
  }

  // Hard delete for geofences
  const { error: deleteError } = await supabase
    .from("geofences")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (deleteError) {
    return createErrorResponse("Failed to delete geofence", 500, { details: deleteError.message });
  }

  return createSuccessResponse({ message: "Geofence deleted successfully" }, 200);
};
