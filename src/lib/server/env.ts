import {
	THECRAG_API_KEY,
	THECRAG_LOGBOOK_MODE,
	THECRAG_OWNER_LOGIN,
	APP_PASSWORD,
	AUTH_SCOPE,
	SESSION_SECRET,
	DATABASE_PATH,
	SYNC_CRON,
	IMPORT_CRON,
	ROUTE_DATA_IMPORT,
	ROUTE_DATA_REFRESH_DAYS,
	WEATHER_IMPORT,
	CSV_INGEST_TOKEN,
	DISPLAY_LOCALE,
	TZ,
	NODE_ENV
} from '$app/env/private';

const cache: Record<string, string | undefined> = {
	THECRAG_API_KEY,
	THECRAG_LOGBOOK_MODE,
	THECRAG_OWNER_LOGIN,
	APP_PASSWORD,
	AUTH_SCOPE,
	SESSION_SECRET,
	DATABASE_PATH,
	SYNC_CRON,
	IMPORT_CRON,
	ROUTE_DATA_IMPORT,
	ROUTE_DATA_REFRESH_DAYS,
	WEATHER_IMPORT,
	CSV_INGEST_TOKEN,
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

export type LogbookMode = 'api' | 'csv';

/**
 * Logbook source. `csv` keeps THECRAG_API_KEY available for route data and area lookups
 * while the logbook arrives by CSV upload, so the API sync never runs and never prunes
 * uploaded ascents.
 */
export function logbookMode(): LogbookMode {
	return env('THECRAG_LOGBOOK_MODE').trim().toLowerCase() === 'csv' ? 'csv' : 'api';
}

/** @login for FA/FFA matching when no API-synced profile exists (CSV-only logbooks). */
export function routeDataOwnerLogin(): string | null {
	return env('THECRAG_OWNER_LOGIN').trim() || null;
}

/** Safe for Settings: never expose the configured key. Logbook sync uses theCrag's API only. */
export function getTheCragSyncConfiguration(): { configured: boolean; mode: LogbookMode } {
	const mode = logbookMode();
	return { configured: mode === 'api' && hasTheCragApiKey(), mode };
}

/** Safe for Settings: whether opt-in route work has a usable key in this mode. */
export function getRouteDataConfiguration(): {
	mode: LogbookMode;
	hasApiKey: boolean;
	hasOwnerLogin: boolean;
} {
	return {
		mode: logbookMode(),
		hasApiKey: hasTheCragApiKey(),
		hasOwnerLogin: Boolean(routeDataOwnerLogin())
	};
}

/** Boolean env flag: true / 1 / yes / on (any case). Anything else, or unset, is false. */
export function envFlag(name: string): boolean {
	return ['1', 'true', 'yes', 'on'].includes(env(name).trim().toLowerCase());
}
