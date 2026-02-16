import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * Shared Pagination Utilities
 *
 * Provides consistent pagination across all GET endpoints with:
 * - Cursor-based pagination (efficient for large datasets)
 * - Page-based pagination (simple for small datasets)
 * - Sorting and filtering
 * - Response metadata
 */

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================

export const PaginationQuerySchema = z.object({
  // Page-based pagination
  page: z.coerce.number().int().positive().max(10000).optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),

  // Cursor-based pagination (preferred for large datasets)
  cursor: z.string().uuid().optional(),

  // Sorting
  sort_by: z.string().max(50).optional().default("created_at"),
  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),

  // Search/Filter
  search: z.string().max(200).optional(),
  filter: z.string().max(500).optional(), // JSON string for complex filters
}).strict();

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

// ============================================================================
// PAGINATION RESPONSE TYPE
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
  };
}

// ============================================================================
// PAGINATION BUILDER
// ============================================================================

/**
 * Builds pagination parameters from URL query string
 *
 * @param url - Request URL
 * @returns Validated pagination parameters
 */
export function parsePaginationParams(url: URL): PaginationQuery {
  const params = {
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    cursor: url.searchParams.get("cursor"),
    sort_by: url.searchParams.get("sort_by"),
    sort_order: url.searchParams.get("sort_order"),
    search: url.searchParams.get("search"),
    filter: url.searchParams.get("filter"),
  };

  // Remove null values
  const cleanedParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== null)
  );

  return PaginationQuerySchema.parse(cleanedParams);
}

/**
 * Applies pagination to a Supabase query builder
 *
 * @param query - Supabase query builder
 * @param params - Pagination parameters
 * @returns Query with pagination applied
 */
export function applyPagination<T>(
  query: any, // SupabaseQueryBuilder type
  params: PaginationQuery
) {
  const { page, limit, cursor, sort_by, sort_order } = params;

  // Apply sorting
  query = query.order(sort_by, { ascending: sort_order === "asc" });

  // Cursor-based pagination (preferred)
  if (cursor) {
    query = query.gt("id", cursor).limit(limit);
  } else {
    // Page-based pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
  }

  return query;
}

/**
 * Creates paginated response with metadata
 *
 * @param data - Query results
 * @param total - Total count (from separate count query)
 * @param params - Pagination parameters
 * @returns Formatted paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationQuery
): PaginatedResponse<T> {
  const { page, limit } = params;
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Get next cursor (ID of last item) if using cursor pagination
  const nextCursor = data.length > 0 && hasNext
    ? (data[data.length - 1] as any).id
    : undefined;

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
      nextCursor,
    },
  };
}

/**
 * Applies search filter to query
 *
 * @param query - Supabase query builder
 * @param searchTerm - Search term
 * @param searchFields - Fields to search in
 * @returns Query with search filter applied
 */
export function applySearch(
  query: any,
  searchTerm: string | undefined,
  searchFields: string[]
): any {
  if (!searchTerm || searchFields.length === 0) {
    return query;
  }

  // Build OR condition for multiple fields
  const orConditions = searchFields
    .map((field) => `${field}.ilike.%${searchTerm}%`)
    .join(",");

  return query.or(orConditions);
}

/**
 * Applies complex JSON filters to query
 *
 * @param query - Supabase query builder
 * @param filterJson - JSON string with filter conditions
 * @returns Query with filters applied
 */
export function applyFilters(
  query: any,
  filterJson: string | undefined
): any {
  if (!filterJson) {
    return query;
  }

  try {
    const filters = JSON.parse(filterJson);

    // Apply each filter condition
    for (const [field, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        // IN operator for arrays
        query = query.in(field, value);
      } else if (typeof value === "object" && value !== null) {
        // Range/comparison operators
        const ops = value as Record<string, any>;
        if (ops.$gte !== undefined) query = query.gte(field, ops.$gte);
        if (ops.$lte !== undefined) query = query.lte(field, ops.$lte);
        if (ops.$gt !== undefined) query = query.gt(field, ops.$gt);
        if (ops.$lt !== undefined) query = query.lt(field, ops.$lt);
        if (ops.$ne !== undefined) query = query.neq(field, ops.$ne);
      } else {
        // Exact match
        query = query.eq(field, value);
      }
    }
  } catch {
    // Invalid JSON, ignore filter
    console.warn("Invalid filter JSON:", filterJson);
  }

  return query;
}
