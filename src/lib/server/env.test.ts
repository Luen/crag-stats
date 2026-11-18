import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The logbook source is decided by `CSV_INGEST_TOKEN`, not by a mode variable and not by
 * `THECRAG_USERNAME` (installs that predate the removed website-login sync still carry that
 * name, so inferring from it would silently stop their API sync). These tests load the real
 * module rather than a mock, so the inference itself is covered.
 */
const KEYS = ['THECRAG_API_KEY', 'THECRAG_USERNAME', 'CSV_INGEST_TOKEN'] as const;

async function loadEnv(vars: Partial<Record<(typeof KEYS)[number], string>>) {
	for (const key of KEYS) delete process.env[key];
	Object.assign(process.env, vars);
	vi.resetModules();
	return import('./env');
}

afterEach(() => {
	for (const key of KEYS) delete process.env[key];
	vi.resetModules();
});

describe('logbook source (#504)', () => {
	it('syncs the logbook with an API key when no upload token is set', async () => {
		const env = await loadEnv({ THECRAG_API_KEY: 'key' });
		expect(env.logbookMode()).toBe('api');
		expect(env.getTheCragSyncConfiguration()).toEqual({ configured: true, mode: 'api' });
	});

	it('switches to CSV uploads as soon as an upload token exists', async () => {
		const env = await loadEnv({ THECRAG_API_KEY: 'key', CSV_INGEST_TOKEN: 'upload-token' });
		expect(env.getTheCragSyncConfiguration()).toEqual({ configured: false, mode: 'csv' });
		// The same key still backs route data and area lookups.
		expect(env.hasTheCragApiKey()).toBe(true);
	});

	it('keeps the API logbook when only a username is set', async () => {
		const env = await loadEnv({ THECRAG_API_KEY: 'key', THECRAG_USERNAME: 'sample-climber' });
		expect(env.logbookMode()).toBe('api');
		expect(env.getTheCragSyncConfiguration()).toEqual({ configured: true, mode: 'api' });
	});

	it('treats a blank upload token as unset', async () => {
		const env = await loadEnv({ THECRAG_API_KEY: 'key', CSV_INGEST_TOKEN: '   ' });
		expect(env.logbookMode()).toBe('api');
	});

	it('reports a trimmed username for FA/FFA matching', async () => {
		const env = await loadEnv({ THECRAG_USERNAME: ' sample-climber ' });
		expect(env.theCragUsername()).toBe('sample-climber');
		expect(env.getRouteDataConfiguration()).toEqual({
			mode: 'api',
			hasApiKey: false,
			hasUsername: true
		});
	});

	it('treats a blank username as unset', async () => {
		const env = await loadEnv({ THECRAG_USERNAME: '   ' });
		expect(env.theCragUsername()).toBeNull();
		expect(env.getRouteDataConfiguration().hasUsername).toBe(false);
	});
});

/**
 * `.env.example` ships both schedules commented out, so the daily 06:00 default lives in
 * code only. A key left behind with no value must therefore mean "use the default", not
 * "invalid expression, disable the schedule".
 */
describe('schedule defaults (#504)', () => {
	afterEach(() => {
		delete process.env.SYNC_CRON;
		delete process.env.IMPORT_CRON;
		vi.resetModules();
	});

	it('falls back to the daily default when the key is present but blank', async () => {
		process.env.SYNC_CRON = '';
		process.env.IMPORT_CRON = '';
		vi.resetModules();
		const env = await import('./env');
		expect(env.env('SYNC_CRON', '0 6 * * *')).toBe('0 6 * * *');
		expect(env.env('IMPORT_CRON', '0 6 * * *')).toBe('0 6 * * *');
	});

	it('keeps an explicit expression, and keeps `off` meaning off', async () => {
		process.env.SYNC_CRON = '0 4 * * *';
		process.env.IMPORT_CRON = 'off';
		vi.resetModules();
		const env = await import('./env');
		expect(env.env('SYNC_CRON', '0 6 * * *')).toBe('0 4 * * *');
		expect(env.env('IMPORT_CRON', '0 6 * * *')).toBe('off');
	});
});
