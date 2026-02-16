/**
 * Environment Configuration
 * Centralizes all environment variables with type safety and validation
 */

interface EnvConfig {
  // Supabase
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };

  // AI Services
  ai: {
    anthropicApiKey?: string;
    openaiApiKey?: string;
    mediapipe: {
      useCdn: boolean;
      baseUrl: string;
    };
  };

  // Application
  app: {
    name: string;
    version: string;
    env: 'development' | 'staging' | 'production';
  };

  // Feature Flags
  features: {
    analytics: boolean;
    errorReporting: boolean;
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
      `⚠️ Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and fill in the values.'
    );
  }
}

// Validate on load
validateEnv();

// Export configuration
export const env: EnvConfig = {
  supabase: {
    url: getEnv('VITE_SUPABASE_URL'),
    anonKey: getEnv('VITE_SUPABASE_ANON_KEY'),
    serviceRoleKey: getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY'),
  },

  ai: {
    anthropicApiKey: getEnv('VITE_ANTHROPIC_API_KEY'),
    openaiApiKey: getEnv('VITE_OPENAI_API_KEY'),
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
    env: (getEnv('VITE_APP_ENV', 'development') as any),
  },

  features: {
    analytics: getBoolEnv('VITE_ENABLE_ANALYTICS', false),
    errorReporting: getBoolEnv('VITE_ENABLE_ERROR_REPORTING', false),
    useMockData: getBoolEnv('VITE_USE_MOCK_DATA', true),
    debugMode: getBoolEnv('VITE_DEBUG_MODE', false),
  },
};

// Export helper to check if APIs are configured
export const isConfigured = {
  supabase: Boolean(env.supabase.url && env.supabase.anonKey),
  anthropic: Boolean(env.ai.anthropicApiKey),
  openai: Boolean(env.ai.openaiApiKey),
};

// Log configuration status
if (env.features.debugMode) {
  console.log('🔧 Environment Configuration:', {
    supabaseConfigured: isConfigured.supabase,
    anthropicConfigured: isConfigured.anthropic,
    openaiConfigured: isConfigured.openai,
    useMockData: env.features.useMockData,
  });
}
