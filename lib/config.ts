// Browser requests use the local /api proxy (see next.config.mjs rewrites) to avoid CORS.
// NEXT_PUBLIC_API_BASE_URL sets the upstream backend target for that proxy.
export const config = {
  apiBaseUrl: '/api',
  backendApiUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.motogt.com/api',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'MotoGT Admin Dashboard',
} as const;
