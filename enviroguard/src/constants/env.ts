export const USE_FAKE_DATA = process.env.EXPO_PUBLIC_USE_FAKE_DATA === 'true';
export const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

// .env file:
// EXPO_PUBLIC_API_GATEWAY_URL=https://abc123.execute-api.us-east-1.amazonaws.com/v1
// EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
// EXPO_PUBLIC_USE_FAKE_DATA=true ← flip to false when backend is ready
