/**
 * Health Check Tests - Phase 4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker } from '../healthCheck';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker(3, 1000); // 3 failures, 1s timeout
  });

  it('should start in closed state', () => {
    expect(breaker.getState()).toBe('closed');
  });

  it('should open after threshold failures', async () => {
    const failingFn = vi.fn().mockRejectedValue(new Error('fail'));

    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(failingFn);
      } catch {}
    }

    expect(breaker.getState()).toBe('open');
  });

  it('should reject calls when open', async () => {
    const failingFn = vi.fn().mockRejectedValue(new Error('fail'));

    // Trigger 3 failures to open circuit
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(failingFn);
      } catch {}
    }

    // Next call should be rejected immediately
    await expect(breaker.execute(failingFn)).rejects.toThrow('Circuit breaker is OPEN');
  });

  it('should reset on successful call', async () => {
    const successFn = vi.fn().mockResolvedValue('success');

    await breaker.execute(successFn);
    expect(breaker.getState()).toBe('closed');
  });

  it('should transition to half-open after timeout', async () => {
    vi.useFakeTimers();
    const failingFn = vi.fn().mockRejectedValue(new Error('fail'));

    // Open circuit
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(failingFn);
      } catch {}
    }

    expect(breaker.getState()).toBe('open');

    // Wait for timeout
    vi.advanceTimersByTime(1100);

    // Next call should transition to half-open
    const successFn = vi.fn().mockResolvedValue('success');
    await breaker.execute(successFn);

    expect(breaker.getState()).toBe('closed');

    vi.useRealTimers();
  });
});
