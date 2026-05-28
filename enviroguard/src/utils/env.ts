/**
 * Environment Variable Access
 *
 * WHY: Type-safe access to env vars prevents typos and missing values
 * SCAFFOLD: Default values provided for development without backend
 *
 * CHANGEABLE: Add new env vars as needed for features
 */

type EnvConfig = {
  apiBaseUrl: string;
  apiTimeout: number;
  kioskMode: boolean;
  enableFakeData: boolean;
  debugMode: boolean;
  anthropicApiKey?: string;
};

function getEnvVar(key: string, defaultValue: string): string {
  // In Expo, env vars prefixed with EXPO_PUBLIC_ are available
  const value = (process.env as any)[`EXPO_PUBLIC_${key}`];
  return value !== undefined ? value : defaultValue;
}

function getBooleanEnv(key: string, defaultValue: boolean): boolean {
  const value = (process.env as any)[`EXPO_PUBLIC_${key}`];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

/**
 * Environment configuration
 *
 * FAKE: Most values have safe defaults for development
 * REAL: Set these in .env file when connecting to real backend
 */
export const ENV: EnvConfig = {
  // API Gateway URL (future)
  // FAKE: Points to localhost
  // REAL: Set to your API Gateway URL
  apiBaseUrl: getEnvVar('API_BASE_URL', 'http://localhost:8000'),

  apiTimeout: parseInt(getEnvVar('API_TIMEOUT', '10000'), 10),

  // Kiosk mode flag
  kioskMode: getBooleanEnv('KIOSK_MODE', false),

  // Feature flag for fake data
  // FAKE: true = uses local JSON files
  // REAL: false = makes real API calls
  enableFakeData: getBooleanEnv('ENABLE_FAKE_DATA', true),

  // Debug logging
  debugMode: getBooleanEnv('DEBUG_MODE', __DEV__),

  // Claude API key (WORKS NOW if provided)
  anthropicApiKey: getEnvVar('ANTHROPIC_API_KEY', ''),
};

/**
 * Log configuration in debug mode
 * WHY: Helps developers troubleshoot environment issues
 */
if (ENV.debugMode) {
  console.log('[ENV] Configuration loaded:', {
    ...ENV,
    anthropicApiKey: ENV.anthropicApiKey ? '***' + ENV.anthropicApiKey.slice(-4) : 'not set',
  });
}
