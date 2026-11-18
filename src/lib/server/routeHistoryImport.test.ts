import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Only the flags these tests set; everything else reads as unset.
const vars: Record<string, string> = {};

vi.mock('./env', () => ({
	env: (name: string, fallback = '') => vars[name] ?? fallback,
	envFlag: (name: string) => ['1', 'true', 'yes', 'on'].includes((vars[name] ?? '').toLowerCase()),
	csvUploadConfigured: () => Boolean((vars.CSV_INGEST_TOKEN ?? '').trim()),
	theCragUsername: () => (vars.THECRAG_USERNAME ?? '').trim() || null,
	getTheCragSyncConfiguration: () => {
		const mode = (vars.CSV_INGEST_TOKEN ?? '').trim() ? 'csv' : 'api';
		return { configured: mode === 'api' && Boolean((vars.THECRAG_API_KEY ?? '').trim()), mode };
	}
}));

const { isRouteHistoryImportEnabled, getRouteHistoryStatus, routeHistoryConfig } =
	await import('./routeHistoryImport');
const { getTheCragSyncConfiguration } = await import('./env');

afterEach(() => {
	for (const key of Object.keys(vars)) delete vars[key];
});

describe('route data import flag (#353)', () => {
	it('is off by default', () => {
		expect(isRouteHistoryImportEnabled()).toBe(false);
	});

	it('is enabled by ROUTE_DATA_IMPORT', () => {
		vars.ROUTE_DATA_IMPORT = 'true';
		expect(isRouteHistoryImportEnabled()).toBe(true);
	});

	it('ignores the removed ROUTE_HISTORY_IMPORT variable', () => {
		vars.ROUTE_HISTORY_IMPORT = 'true';
		expect(isRouteHistoryImportEnabled()).toBe(false);
	});

	it.each([
		{ current: '', legacy: 'true', enabled: false },
		{ current: 'false', legacy: 'true', enabled: false },
		{ current: '0', legacy: 'true', enabled: false },
		{ current: 'off', legacy: 'true', enabled: false },
		{ current: 'invalid', legacy: 'true', enabled: false },
		{ current: 'true', legacy: 'false', enabled: true },
		{ current: 'yes', legacy: 'false', enabled: true }
	])(
		'ROUTE_DATA_IMPORT=$current wins over ROUTE_HISTORY_IMPORT=$legacy, Settings included',
		({ current, legacy, enabled }) => {
			vars.ROUTE_DATA_IMPORT = current;
			vars.ROUTE_HISTORY_IMPORT = legacy;
			expect(isRouteHistoryImportEnabled()).toBe(enabled);
			expect(getRouteHistoryStatus().enabled).toBe(enabled);
		}
	);
});

describe('CSV logbook mode (#504)', () => {
	beforeEach(() => {
		vars.ROUTE_DATA_IMPORT = 'true';
	});

	it('keeps route data on THECRAG_API_KEY while the logbook stays CSV', () => {
		vars.CSV_INGEST_TOKEN = 'upload-token';
		vars.THECRAG_API_KEY = 'shared-key';
		expect(getRouteHistoryStatus().hasApiKey).toBe(true);
		expect(getTheCragSyncConfiguration()).toEqual({ configured: false, mode: 'csv' });
	});

	it('ignores THECRAG_USERNAME when choosing the logbook source', () => {
		// The name predates this feature (it was the removed website-login sync), so it
		// must never switch the logbook away from the API on its own.
		vars.THECRAG_USERNAME = 'jodie';
		vars.THECRAG_API_KEY = 'shared-key';
		expect(getTheCragSyncConfiguration()).toEqual({ configured: true, mode: 'api' });
	});

	it.each(['', ' ', '\t'])('CSV_INGEST_TOKEN=%j leaves the API logbook alone', (value) => {
		vars.CSV_INGEST_TOKEN = value;
		vars.THECRAG_API_KEY = 'shared-key';
		expect(getTheCragSyncConfiguration()).toEqual({ configured: true, mode: 'api' });
	});

	it('still needs a key for route data in CSV mode', () => {
		vars.CSV_INGEST_TOKEN = 'upload-token';
		expect(getRouteHistoryStatus().hasApiKey).toBe(false);
	});

	it('passes THECRAG_USERNAME as the FA/FFA identity for CSV logbooks', () => {
		vars.THECRAG_USERNAME = ' jodie ';
		expect(routeHistoryConfig().ownerLogin).toBe('jodie');
		expect(routeHistoryConfig().apiKey).toBe('');
	});
});
