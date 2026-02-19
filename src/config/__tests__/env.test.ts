/**
 * Environment Configuration Tests
 * Tests for src/config/env.ts
 */

import { describe, it, expect } from 'vitest';
import { env, isConfigured } from '../env';

// ── env object exists ──────────────────────────────────────────────────────

describe('env object', () => {
  it('should be a defined object', () => {
    expect(env).toBeDefined();
    expect(typeof env).toBe('object');
  });
});

// ── env.supabase ───────────────────────────────────────────────────────────

describe('env.supabase', () => {
  it('should have a url property (string)', () => {
    expect(env.supabase).toHaveProperty('url');
    expect(typeof env.supabase.url).toBe('string');
  });

  it('should have an anonKey property (string)', () => {
    expect(env.supabase).toHaveProperty('anonKey');
    expect(typeof env.supabase.anonKey).toBe('string');
  });
});

// ── env.app ────────────────────────────────────────────────────────────────

describe('env.app', () => {
  it('should have a name property (string)', () => {
    expect(env.app).toHaveProperty('name');
    expect(typeof env.app.name).toBe('string');
  });

  it('should have a version property (string)', () => {
    expect(env.app).toHaveProperty('version');
    expect(typeof env.app.version).toBe('string');
  });

  it('should have an env property that is one of development | staging | production', () => {
    expect(env.app).toHaveProperty('env');
    expect(['development', 'staging', 'production']).toContain(env.app.env);
  });

  it('should default app name to "ASEGURAR LTDA" when no env var is set', () => {
    // In test environment, VITE_APP_NAME is typically not set
    expect(env.app.name).toBe('ASEGURAR LTDA');
  });

  it('should default version to "2.5.4" when no env var is set', () => {
    expect(env.app.version).toBe('2.5.4');
  });
});

// ── env.features ───────────────────────────────────────────────────────────

describe('env.features', () => {
  it('should have useMockData as a boolean', () => {
    expect(env.features).toHaveProperty('useMockData');
    expect(typeof env.features.useMockData).toBe('boolean');
  });

  it('should have analytics as a boolean', () => {
    expect(typeof env.features.analytics).toBe('boolean');
  });

  it('should have errorReporting as a boolean', () => {
    expect(typeof env.features.errorReporting).toBe('boolean');
  });

  it('should have debugMode as a boolean', () => {
    expect(typeof env.features.debugMode).toBe('boolean');
  });
});

// ── env.ai ─────────────────────────────────────────────────────────────────

describe('env.ai', () => {
  it('should have a proxyEndpoint property (string)', () => {
    expect(env.ai).toHaveProperty('proxyEndpoint');
    expect(typeof env.ai.proxyEndpoint).toBe('string');
  });

  it('should have proxyEndpoint ending with /functions/v1/ai-proxy', () => {
    expect(env.ai.proxyEndpoint).toContain('/functions/v1/ai-proxy');
  });

  it('should have a mediapipe.useCdn boolean', () => {
    expect(env.ai.mediapipe).toHaveProperty('useCdn');
    expect(typeof env.ai.mediapipe.useCdn).toBe('boolean');
  });

  it('should have a mediapipe.baseUrl string', () => {
    expect(env.ai.mediapipe).toHaveProperty('baseUrl');
    expect(typeof env.ai.mediapipe.baseUrl).toBe('string');
  });
});

// ── isConfigured ───────────────────────────────────────────────────────────

describe('isConfigured', () => {
  it('should export isConfigured object', () => {
    expect(isConfigured).toBeDefined();
    expect(typeof isConfigured).toBe('object');
  });

  it('should have supabase boolean flag', () => {
    expect(typeof isConfigured.supabase).toBe('boolean');
  });

  it('should have aiProxy boolean flag', () => {
    expect(typeof isConfigured.aiProxy).toBe('boolean');
  });
});
