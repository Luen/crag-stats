import {
	THECRAG_API_KEY,
	APP_PASSWORD,
	SESSION_SECRET,
	DATABASE_PATH,
	SYNC_CRON,
	PREFERRED_GRADE_SYSTEM,
	NODE_ENV
} from '$app/env/private';

const cache: Record<string, string | undefined> = {
	THECRAG_API_KEY,
	APP_PASSWORD,
	SESSION_SECRET,
	DATABASE_PATH,
	SYNC_CRON,
	PREFERRED_GRADE_SYSTEM,
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
