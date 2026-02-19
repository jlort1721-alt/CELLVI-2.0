/**
 * Pagination Utilities - PR #19
 *
 * Provides type-safe pagination utilities for React Query hooks.
 * Prevents unbounded queries that can cause performance issues.
 */

/**
 * Input parameters for a paginated query.
 */
export interface PaginationParams {
  /** 1-based page number. */
  page: number;
  /** Number of rows per page. */
  pageSize: number;
}

/**
 * Paginated response envelope returned by query hooks.
 * @typeParam T - The row/entity type.
 */
export interface PaginationResult<T> {
  /** The page of data rows. */
  data: T[];
  /** Current 1-based page number. */
  page: number;
  pageSize: number;
  /** Total number of matching rows across all pages. */
  totalCount: number;
  /** Total number of pages. */
  totalPages: number;
  /** Whether a next page exists. */
  hasNext: boolean;
  /** Whether a previous page exists. */
  hasPrev: boolean;
}

/**
 * Options accepted by paginated React Query hooks.
 */
export interface PaginatedQueryOptions {
  /** 1-based page number (default `1`). */
  page?: number;
  /** Rows per page (default varies by entity, see {@link DEFAULT_PAGE_SIZES}). */
  pageSize?: number;
  /** Whether the query should execute (React Query `enabled` flag). */
  enabled?: boolean;
}

/**
 * Calculate the `from` and `to` offsets for a Supabase `.range()` call.
 * @param page - 1-based page number.
 * @param pageSize - Number of rows per page.
 * @returns `{ from, to }` — zero-based inclusive range indices.
 *
 * @example
 * const { from, to } = getPaginationRange(2, 50); // { from: 50, to: 99 }
 */
export function getPaginationRange(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

/**
 * Build a {@link PaginationResult} envelope from a Supabase query response.
 * @param data - The rows returned for the current page.
 * @param totalCount - Total matching rows (from Supabase `count`).
 * @param page - Current 1-based page number.
 * @param pageSize - Rows per page.
 * @returns Complete pagination metadata with `hasNext`/`hasPrev` flags.
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
 * Default page sizes for each entity type.
 * Higher-volume entities (telemetry, cold_chain) use larger pages.
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
