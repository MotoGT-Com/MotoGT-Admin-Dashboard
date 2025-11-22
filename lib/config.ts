export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'MotoGT Admin Dashboard',
} as const;
