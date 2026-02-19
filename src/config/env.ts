/**
 * Environment Configuration
 * Centralizes all environment variables with type safety and validation
 *
 * SECURITY: AI API keys (Anthropic, OpenAI) are NEVER exposed to the client.
 * All AI calls go through the /ai-proxy Edge Function server-side.
 */

/**
 * Typed shape for the application's environment configuration.
 * Populated from `VITE_*` environment variables at build time.
 */
interface EnvConfig {
  /** Supabase connection settings. */
  supabase: {
    /** Supabase project URL (e.g. `https://xxx.supabase.co`). */
    url: string;
    /** Supabase anonymous/public API key. */
    anonKey: string;
  };

  /** AI service configuration. API keys are never exposed client-side. */
  ai: {
    /** Full URL to the Supabase Edge Function AI proxy. */
    proxyEndpoint: string;
    /** MediaPipe face-detection model settings. */
    mediapipe: {
      useCdn: boolean;
      baseUrl: string;
    };
  };

  /** Application metadata. */
  app: {
    name: string;
    version: string;
    env: 'development' | 'staging' | 'production';
  };

  /** Runtime feature flags toggled via environment variables. */
  features: {
    analytics: boolean;
    errorReporting: boolean;
    /** When `true`, components fall back to demo/mock data instead of Supabase. */
    useMockData: boolean;
    debugMode: boolean;
  };
}

// Helper to get env variable with fallback
function getEnv(key: string, defaultValue: string = ''): string {
  return import.meta.env[key] || defaultValue;
}

// Helper to get boolean env variable
function getBoolEnv(key: string, defaultValue: boolean = false): boolean {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

// Validate required environment variables
function validateEnv() {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    console.warn(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and fill in the values.'
    );
  }

  // SECURITY: Warn if AI keys are accidentally exposed to client
  if (import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.VITE_OPENAI_API_KEY) {
    console.error(
      'SECURITY WARNING: AI API keys detected in client-side environment!\n' +
      'Remove VITE_ANTHROPIC_API_KEY and VITE_OPENAI_API_KEY from .env.\n' +
      'AI keys must only be stored in Supabase Edge Function secrets.'
    );
  }
}

// Validate on load
validateEnv();

/**
 * Validated, typed environment configuration singleton.
 * Import this instead of accessing `import.meta.env` directly.
 *
 * @example
 * import { env } from '@/config/env';
 * const client = createClient(env.supabase.url, env.supabase.anonKey);
 */
export const env: EnvConfig = {
  supabase: {
    url: getEnv('VITE_SUPABASE_URL'),
    anonKey: getEnv('VITE_SUPABASE_ANON_KEY'),
  },

  ai: {
    proxyEndpoint: `${getEnv('VITE_SUPABASE_URL')}/functions/v1/ai-proxy`,
    mediapipe: {
      useCdn: getBoolEnv('VITE_MEDIAPIPE_USE_CDN', true),
      baseUrl: getEnv(
        'VITE_MEDIAPIPE_BASE_URL',
        'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection'
      ),
    },
  },

  app: {
    name: getEnv('VITE_APP_NAME', 'ASEGURAR LTDA'),
    version: getEnv('VITE_APP_VERSION', '2.5.4'),
    env: (getEnv('VITE_APP_ENV', 'development') as EnvConfig['app']['env']),
  },

  features: {
    analytics: getBoolEnv('VITE_ENABLE_ANALYTICS', false),
    errorReporting: getBoolEnv('VITE_ENABLE_ERROR_REPORTING', false),
    useMockData: getBoolEnv('VITE_USE_MOCK_DATA', true),
    debugMode: getBoolEnv('VITE_DEBUG_MODE', false),
  },
};

/**
 * Quick boolean checks for whether external services have valid configuration.
 * Useful for conditionally enabling features at runtime.
 */
export const isConfigured = {
  supabase: Boolean(env.supabase.url && env.supabase.anonKey),
  aiProxy: Boolean(env.supabase.url), // AI is available if Supabase is configured
};

// Log configuration status (debug only)
if (env.features.debugMode) {
  console.log('Environment Configuration:', {
    supabaseConfigured: isConfigured.supabase,
    aiProxyConfigured: isConfigured.aiProxy,
    useMockData: env.features.useMockData,
  });
}
