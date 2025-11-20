export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.motogt.com/api',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'MotoGT Admin Dashboard',
} as const;
