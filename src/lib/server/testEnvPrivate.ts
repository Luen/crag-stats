/**
 * Mock for SvelteKit virtual module `$app/env/private` during Vitest runs.
 * Vitest runs outside the SvelteKit runtime, so this bridges test env vars
 * into the cache of `src/lib/server/env.ts`.
 */
export const THECRAG_API_KEY = process.env.THECRAG_API_KEY ?? '';
export const APP_PASSWORD = process.env.APP_PASSWORD ?? '';
export const AUTH_SCOPE = process.env.AUTH_SCOPE ?? 'settings';
export const SESSION_SECRET = process.env.SESSION_SECRET ?? '';
export const DATABASE_PATH = process.env.DATABASE_PATH ?? ':memory:';
export const SYNC_CRON = process.env.SYNC_CRON ?? '';
export const ROUTE_DATA_IMPORT = process.env.ROUTE_DATA_IMPORT ?? '';
export const ROUTE_DATA_REFRESH_DAYS = process.env.ROUTE_DATA_REFRESH_DAYS ?? '';
export const WEATHER_IMPORT = process.env.WEATHER_IMPORT ?? '';
export const DISPLAY_LOCALE = process.env.DISPLAY_LOCALE ?? '';
export const TZ = process.env.TZ ?? '';
export const HOST = process.env.HOST ?? '';
export const PORT = process.env.PORT ?? '';
export const APP_INTERNAL_URL = process.env.APP_INTERNAL_URL ?? '';
export const NODE_ENV = process.env.NODE_ENV ?? 'test';
