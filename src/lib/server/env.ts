import {
	THECRAG_API_KEY,
	APP_PASSWORD,
	AUTH_SCOPE,
	SESSION_SECRET,
	DATABASE_PATH,
	SYNC_CRON,
	ROUTE_DATA_IMPORT,
	ROUTE_DATA_REFRESH_DAYS,
	WEATHER_IMPORT,
	DISPLAY_LOCALE,
	TZ,
	NODE_ENV
} from '$app/env/private';

const cache: Record<string, string | undefined> = {
	THECRAG_API_KEY,
	APP_PASSWORD,
	AUTH_SCOPE,
	SESSION_SECRET,
	DATABASE_PATH,
	SYNC_CRON,
	ROUTE_DATA_IMPORT,
	ROUTE_DATA_REFRESH_DAYS,
	WEATHER_IMPORT,
	DISPLAY_LOCALE,
	TZ,
	NODE_ENV
};

/** Read declared Kit env vars, with process.env fallback for Docker/runtime. */
export function env(name: string, fallback = ''): string {
	const fromKit = cache[name];
	if (fromKit != null && String(fromKit).length > 0) return String(fromKit);
	const fromProcess = process.env[name];
	if (fromProcess != null && fromProcess.length > 0) return fromProcess;
	return fallback;
}

export function hasTheCragApiKey() {
	return Boolean(env('THECRAG_API_KEY').trim());
}

/**
 * Safe for Settings: never expose the configured key. Logbook sync uses theCrag's API only.
 * `csvModeRemoved` flags a leftover `THECRAG_SYNC_MODE=csv` from older releases: automatic
 * CSV downloads were removed at theCrag's request (all programmatic access must use the API),
 * so Settings can point those owners at the manual CSV upload instead.
 */
export function getTheCragSyncConfiguration(): {
	configured: boolean;
	csvModeRemoved: boolean;
} {
	return {
		configured: hasTheCragApiKey(),
		csvModeRemoved: env('THECRAG_SYNC_MODE').trim().toLowerCase() === 'csv'
	};
}

/** Boolean env flag: true / 1 / yes / on (any case). Anything else, or unset, is false. */
export function envFlag(name: string): boolean {
	return ['1', 'true', 'yes', 'on'].includes(env(name).trim().toLowerCase());
}
