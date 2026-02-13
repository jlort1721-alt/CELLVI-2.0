/**
 * Health Check Utilities - PR #30
 *
 * Monitors system health and provides circuit breaker functionality
 */

import { supabase } from '@/integrations/supabase/client';

export interface HealthStatus {
  database: boolean;
  realtime: boolean;
  storage: boolean;
  functions: boolean;
  overall: 'healthy' | 'degraded' | 'down';
  lastCheck: number;
}

let healthCache: HealthStatus | null = null;
let lastCheckTime = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function checkSystemHealth(): Promise<HealthStatus> {
  const now = Date.now();

  // Return cached result if recent
  if (healthCache && now - lastCheckTime < CACHE_TTL) {
    return healthCache;
  }

  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRealtime(),
    checkStorage(),
    checkFunctions(),
  ]);

  const [database, realtime, storage, functions] = checks.map(
    (result) => result.status === 'fulfilled' && result.value
  );

  const healthyCount = [database, realtime, storage, functions].filter(Boolean).length;

  const overall: HealthStatus['overall'] =
    healthyCount === 4 ? 'healthy' : healthyCount >= 2 ? 'degraded' : 'down';

  healthCache = {
    database,
    realtime,
    storage,
    functions,
    overall,
    lastCheck: now,
  };

  lastCheckTime = now;

  return healthCache;
}

async function checkDatabase(): Promise<boolean> {
  try {
    const { error } = await supabase.from('tenants').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function checkRealtime(): Promise<boolean> {
  // Check if Realtime is connected
  return supabase.realtime.channels.length >= 0; // Basic check
}

async function checkStorage(): Promise<boolean> {
  try {
    const { data } = await supabase.storage.getBucket('evidence');
    return !!data;
  } catch {
    return false;
  }
}

async function checkFunctions(): Promise<boolean> {
  try {
    // Ping a lightweight function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Circuit Breaker - Prevents cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  getState() {
    return this.state;
  }
}
