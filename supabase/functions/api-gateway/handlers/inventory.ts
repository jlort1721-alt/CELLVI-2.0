import { RouteHandler } from "../router.ts";
import { validateRequest, createErrorResponse, createSuccessResponse } from "../validation.ts";
import { CreateInventoryItemSchema, UpdateInventoryItemSchema } from "../schemas.ts";
import {
  parsePaginationParams,
  applyPagination,
  applySearch,
  applyFilters,
  createPaginatedResponse,
} from "../pagination.ts";

export const listInventory: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId, url } = context;

  try {
    const pagination = parsePaginationParams(url);

    let query = supabase
      .from("inventory_items")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId);

    query = applySearch(query, pagination.search, ["part_number", "name", "description"]);
    query = applyFilters(query, pagination.filter);
    query = applyPagination(query, pagination);

    const { data, error, count } = await query;

    if (error) {
      return createErrorResponse("Failed to fetch inventory", 500, { details: error.message });
    }

    return new Response(
      JSON.stringify(createPaginatedResponse(data || [], count || 0, pagination)),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (error) {
    return createErrorResponse("Internal server error", 500);
  }
};

export const getInventoryItem: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: item, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !item) {
    return createErrorResponse("Inventory item not found", 404);
  }

  return createSuccessResponse(item, 200);
};

export const createInventoryItem: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;

  const rawBody = await req.json();
  const validatedData = validateRequest(CreateInventoryItemSchema, rawBody);

  const { data: item, error: insertError } = await supabase
    .from("inventory_items")
    .insert({
      ...validatedData,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    return createErrorResponse("Failed to create inventory item", 500, { details: insertError.message });
  }

  return createSuccessResponse(item, 201);
};

export const updateInventoryItem: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const rawBody = await req.json();
  const validatedData = validateRequest(UpdateInventoryItemSchema, rawBody);

  const { data: existing, error: fetchError } = await supabase
    .from("inventory_items")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !existing) {
    return createErrorResponse("Inventory item not found", 404);
  }

  // Remove item_id from validated data (it's in URL params)
  const { item_id: _, ...updateData } = validatedData as any;

  const { data: item, error: updateError } = await supabase
    .from("inventory_items")
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (updateError) {
    return createErrorResponse("Failed to update inventory item", 500, { details: updateError.message });
  }

  return createSuccessResponse(item, 200);
};

export const deleteInventoryItem: RouteHandler = async (req, params, context) => {
  const { supabase, tenantId } = context;
  const { id } = params;

  const { data: existing, error: fetchError } = await supabase
    .from("inventory_items")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !existing) {
    return createErrorResponse("Inventory item not found", 404);
  }

  // Hard delete for inventory items
  const { error: deleteError } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (deleteError) {
    return createErrorResponse("Failed to delete inventory item", 500, { details: deleteError.message });
  }

  return createSuccessResponse({ message: "Inventory item deleted successfully" }, 200);
};
