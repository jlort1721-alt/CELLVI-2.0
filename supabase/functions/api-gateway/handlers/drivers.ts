import { RouteHandler } from "../router.ts";
import { validateRequest, createErrorResponse, createSuccessResponse } from "../validation.ts";
import { CreateDriverSchema } from "../schemas.ts";
import {
  parsePaginationParams,
  applyPagination,
  applySearch,
  applyFilters,
  createPaginatedResponse,
} from "../pagination.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const UpdateDriverSchema = z.object({
  first_name: z.string().min(2).max(100).optional(),
  last_name: z.string().min(2).max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().min(7).max(20).regex(/^[+\d\s()-]+$/).optional(),
  license_expiry: z.string().datetime().or(z.date()).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  emergency_contact_name: z.string().max(200).optional(),
  emergency_contact_phone: z.string().max(20).optional(),
}).strict();

export const listDrivers: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId, url } = context;

  try {
    const pagination = parsePaginationParams(url);

    let query = supabase
      .from("drivers")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId);

    query = applySearch(query, pagination.search, ["first_name", "last_name", "email", "license_number"]);
    query = applyFilters(query, pagination.filter);
    query = applyPagination(query, pagination);

    const { data, error, count } = await query;

    if (error) {
      return createErrorResponse("Failed to fetch drivers", 500, { details: error.message });
    }

    return new Response(
      JSON.stringify(createPaginatedResponse(data || [], count || 0, pagination)),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (error) {
    return createErrorResponse("Internal server error", 500);
  }
};

export const getDriver: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: driver, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !driver) {
    return createErrorResponse("Driver not found", 404);
  }

  return createSuccessResponse(driver, 200);
};

export const createDriver: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;

  const rawBody = await req.json();
  const validatedData = validateRequest(CreateDriverSchema, rawBody);

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
    return createErrorResponse("Failed to create driver", 500, { details: insertError.message });
  }

  return createSuccessResponse(driver, 201);
};

export const updateDriver: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const rawBody = await req.json();
  const validatedData = validateRequest(UpdateDriverSchema, rawBody);

  const { data: existing, error: fetchError } = await supabase
    .from("drivers")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !existing) {
    return createErrorResponse("Driver not found", 404);
  }

  const { data: driver, error: updateError } = await supabase
    .from("drivers")
    .update({
      ...validatedData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (updateError) {
    return createErrorResponse("Failed to update driver", 500, { details: updateError.message });
  }

  return createSuccessResponse(driver, 200);
};

export const deleteDriver: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: existing, error: fetchError } = await supabase
    .from("drivers")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !existing) {
    return createErrorResponse("Driver not found", 404);
  }

  const { data: driver, error: deleteError } = await supabase
    .from("drivers")
    .update({
      status: "inactive",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (deleteError) {
    return createErrorResponse("Failed to delete driver", 500, { details: deleteError.message });
  }

  return createSuccessResponse({ message: "Driver deactivated successfully", driver }, 200);
};
