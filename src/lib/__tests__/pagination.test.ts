/**
 * Pagination Utilities Tests - Phase 4
 */

import { describe, it, expect } from 'vitest';
import { getPaginationRange, buildPaginationResult, DEFAULT_PAGE_SIZES } from '../pagination';

describe('Pagination Utilities', () => {
  describe('getPaginationRange', () => {
    it('should calculate correct range for first page', () => {
      const result = getPaginationRange(1, 20);
      expect(result).toEqual({ from: 0, to: 19 });
    });

    it('should calculate correct range for second page', () => {
      const result = getPaginationRange(2, 20);
      expect(result).toEqual({ from: 20, to: 39 });
    });

    it('should handle different page sizes', () => {
      const result = getPaginationRange(1, 50);
      expect(result).toEqual({ from: 0, to: 49 });
    });
  });

  describe('buildPaginationResult', () => {
    it('should build correct pagination metadata', () => {
      const data = [1, 2, 3, 4, 5];
      const result = buildPaginationResult(data, 100, 1, 20);

      expect(result.data).toEqual(data);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalCount).toBe(100);
      expect(result.totalPages).toBe(5);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it('should calculate hasNext correctly', () => {
      const data = [1, 2, 3];
      const result = buildPaginationResult(data, 100, 5, 20);
      expect(result.hasNext).toBe(false);
    });

    it('should calculate hasPrev correctly', () => {
      const data = [1, 2, 3];
      const result = buildPaginationResult(data, 100, 1, 20);
      expect(result.hasPrev).toBe(false);

      const result2 = buildPaginationResult(data, 100, 2, 20);
      expect(result2.hasPrev).toBe(true);
    });
  });

  describe('DEFAULT_PAGE_SIZES', () => {
    it('should have reasonable defaults', () => {
      expect(DEFAULT_PAGE_SIZES.profiles).toBe(20);
      expect(DEFAULT_PAGE_SIZES.telemetry).toBe(100);
      expect(DEFAULT_PAGE_SIZES.alerts).toBe(50);
    });
  });
});
