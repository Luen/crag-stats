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
		const env = await loadEnv({ THECRAG_API_KEY: 'key', THECRAG_USERNAME: 'jodie' });
		expect(env.logbookMode()).toBe('api');
		expect(env.getTheCragSyncConfiguration()).toEqual({ configured: true, mode: 'api' });
	});

	it('treats a blank upload token as unset', async () => {
		const env = await loadEnv({ THECRAG_API_KEY: 'key', CSV_INGEST_TOKEN: '   ' });
		expect(env.logbookMode()).toBe('api');
	});

	it('reports a trimmed username for FA/FFA matching', async () => {
		const env = await loadEnv({ THECRAG_USERNAME: ' jodie ' });
		expect(env.theCragUsername()).toBe('jodie');
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
