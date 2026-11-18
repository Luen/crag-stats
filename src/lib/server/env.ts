import {
	THECRAG_API_KEY,
	THECRAG_USERNAME,
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
	THECRAG_USERNAME,
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
 * Whether this install accepts CSV uploads from a companion sender. The token is the only
 * thing that means "CSVs arrive here", so it also selects the logbook source: the next API
 * sync prunes every ascent it did not see, so an upload token and an API logbook cannot
 * both own the same rows.
 */
export function csvUploadConfigured() {
	return Boolean(env('CSV_INGEST_TOKEN').trim());
}

/**
 * Logbook source. `csv` keeps THECRAG_API_KEY available for route data and area lookups
 * while the logbook arrives by CSV upload, so the API sync never runs and never prunes
 * uploaded ascents.
 */
export function logbookMode(): LogbookMode {
	return csvUploadConfigured() ? 'csv' : 'api';
}

/** theCrag username (no `@`) for FA/FFA matching when the logbook arrives by CSV. */
export function theCragUsername(): string | null {
	return env('THECRAG_USERNAME').trim() || null;
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
	hasUsername: boolean;
} {
	return {
		mode: logbookMode(),
		hasApiKey: hasTheCragApiKey(),
		hasUsername: Boolean(theCragUsername())
	};
}

/** Boolean env flag: true / 1 / yes / on (any case). Anything else, or unset, is false. */
export function envFlag(name: string): boolean {
	return ['1', 'true', 'yes', 'on'].includes(env(name).trim().toLowerCase());
}
