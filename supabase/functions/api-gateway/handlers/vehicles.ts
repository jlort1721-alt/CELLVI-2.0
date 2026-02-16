import { RouteHandler } from "../router.ts";
import { validateRequest, createErrorResponse, createSuccessResponse } from "../validation.ts";
import { CreateVehicleSchema, UpdateVehicleSchema } from "../schemas.ts";
import {
  parsePaginationParams,
  applyPagination,
  applySearch,
  applyFilters,
  createPaginatedResponse,
} from "../pagination.ts";

/**
 * Vehicle Handlers
 *
 * CRUD operations for fleet vehicles with pagination, search, and filtering
 */

// ============================================================================
// GET /vehicles - List vehicles with pagination
// ============================================================================

export const listVehicles: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId, url } = context;

  try {
    const pagination = parsePaginationParams(url);

    // Build base query with tenant filter
    let query = supabase
      .from("vehicles")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId);

    // Apply search (on plate, brand, model, vin)
    query = applySearch(query, pagination.search, ["plate", "brand", "model", "vin"]);

    // Apply filters (status, vehicle_type, fuel_type, etc.)
    query = applyFilters(query, pagination.filter);

    // Apply pagination
    query = applyPagination(query, pagination);

    const { data, error, count } = await query;

    if (error) {
      console.error("Vehicle list error:", error);
      return createErrorResponse("Failed to fetch vehicles", 500, {
        details: error.message,
      });
    }

    return new Response(
      JSON.stringify(createPaginatedResponse(data || [], count || 0, pagination)),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (error) {
    console.error("List vehicles error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

// ============================================================================
// GET /vehicles/:id - Get single vehicle
// ============================================================================

export const getVehicle: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  try {
    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error || !vehicle) {
      return createErrorResponse("Vehicle not found", 404);
    }

    return createSuccessResponse(vehicle, 200);
  } catch (error) {
    console.error("Get vehicle error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

// ============================================================================
// POST /vehicles - Create vehicle
// ============================================================================

export const createVehicle: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;

  try {
    const rawBody = await req.json();
    const validatedData = validateRequest(CreateVehicleSchema, rawBody);

    const { data: vehicle, error: insertError } = await supabase
      .from("vehicles")
      .insert({
        ...validatedData,
        tenant_id: tenantId, // ✅ SERVER-SIDE ONLY
        status: "active",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Vehicle insert error:", insertError);
      return createErrorResponse("Failed to create vehicle", 500, {
        details: insertError.message,
      });
    }

    return createSuccessResponse(vehicle, 201);
  } catch (error) {
    console.error("Create vehicle error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

// ============================================================================
// PATCH /vehicles/:id - Update vehicle
// ============================================================================

export const updateVehicle: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  try {
    const rawBody = await req.json();
    const validatedData = validateRequest(UpdateVehicleSchema, rawBody);

    // Ensure tenant owns this vehicle
    const { data: existing, error: fetchError } = await supabase
      .from("vehicles")
      .select("id")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchError || !existing) {
      return createErrorResponse("Vehicle not found", 404);
    }

    // Remove vehicle_id from validated data (it's in URL params, not body)
    const { vehicle_id: _, ...updateData } = validatedData as any;

    const { data: vehicle, error: updateError } = await supabase
      .from("vehicles")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (updateError) {
      console.error("Vehicle update error:", updateError);
      return createErrorResponse("Failed to update vehicle", 500, {
        details: updateError.message,
      });
    }

    return createSuccessResponse(vehicle, 200);
  } catch (error) {
    console.error("Update vehicle error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

// ============================================================================
// DELETE /vehicles/:id - Soft delete vehicle (set status to inactive)
// ============================================================================

export const deleteVehicle: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  try {
    // Check if vehicle exists and belongs to tenant
    const { data: existing, error: fetchError } = await supabase
      .from("vehicles")
      .select("id, status")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchError || !existing) {
      return createErrorResponse("Vehicle not found", 404);
    }

    // Soft delete: set status to inactive
    const { data: vehicle, error: deleteError } = await supabase
      .from("vehicles")
      .update({
        status: "decommissioned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (deleteError) {
      console.error("Vehicle delete error:", deleteError);
      return createErrorResponse("Failed to delete vehicle", 500, {
        details: deleteError.message,
      });
    }

    return createSuccessResponse(
      {
        message: "Vehicle decommissioned successfully",
        vehicle,
      },
      200
    );
  } catch (error) {
    console.error("Delete vehicle error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
