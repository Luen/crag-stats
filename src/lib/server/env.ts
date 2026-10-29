import {
	THECRAG_API_KEY,
	THECRAG_SYNC_MODE,
	THECRAG_USERNAME,
	THECRAG_PASSWORD,
	APP_PASSWORD,
	AUTH_SCOPE,
	SESSION_SECRET,
	DATABASE_PATH,
	SYNC_CRON,
	ROUTE_HISTORY_IMPORT,
	ROUTE_DATA_REFRESH_DAYS,
	DISPLAY_LOCALE,
	TZ,
	NODE_ENV
} from '$app/env/private';
import { isUsableSessionSecret } from './sessionSecret';

const cache: Record<string, string | undefined> = {
	THECRAG_API_KEY,
	THECRAG_SYNC_MODE,
	THECRAG_USERNAME,
	THECRAG_PASSWORD,
	APP_PASSWORD,
	AUTH_SCOPE,
	SESSION_SECRET,
	DATABASE_PATH,
	SYNC_CRON,
	ROUTE_HISTORY_IMPORT,
	ROUTE_DATA_REFRESH_DAYS,
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

/** Safe for Settings: never expose the configured credentials. */
export function getTheCragSyncConfiguration(): {
	mode: 'api' | 'csv' | 'invalid';
	configured: boolean;
} {
	const mode = env('THECRAG_SYNC_MODE', 'api').trim().toLowerCase();
	if (mode === 'api') return { mode, configured: hasTheCragApiKey() };
	if (mode === 'csv')
		return {
			mode,
			configured: Boolean(
				/^(?!\.{1,2}$)[\w.-]+$/.test(env('THECRAG_USERNAME').trim()) &&
				env('THECRAG_PASSWORD') &&
				isUsableSessionSecret(env('SESSION_SECRET'))
			)
		};
	return { mode: 'invalid', configured: false };
}

/** Boolean env flag: true / 1 / yes / on (any case). Anything else, or unset, is false. */
export function envFlag(name: string): boolean {
	return ['1', 'true', 'yes', 'on'].includes(env(name).trim().toLowerCase());
}
