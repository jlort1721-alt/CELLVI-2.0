/**
 * Pagination Utilities - PR #19
 *
 * Provides type-safe pagination utilities for React Query hooks.
 * Prevents unbounded queries that can cause performance issues.
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedQueryOptions {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

/**
 * Calculate offset for Supabase range queries
 */
export function getPaginationRange(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

/**
 * Build pagination metadata from Supabase response
 */
export function buildPaginationResult<T>(
  data: T[],
  totalCount: number,
  page: number,
  pageSize: number
): PaginationResult<T> {
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data,
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Default pagination sizes for different entity types
 */
export const DEFAULT_PAGE_SIZES = {
  profiles: 20,
  trips: 50,
  telemetry: 100,
  alerts: 50,
  vehicles: 20,
  drivers: 20,
  devices: 20,
  evidence: 50,
  cold_chain: 100,
  policies: 20,
  geofences: 20,
} as const;
