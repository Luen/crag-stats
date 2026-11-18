import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Only the flags these tests set; everything else reads as unset.
const vars: Record<string, string> = {};

vi.mock('./env', () => ({
	env: (name: string, fallback = '') => vars[name] ?? fallback,
	envFlag: (name: string) => ['1', 'true', 'yes', 'on'].includes((vars[name] ?? '').toLowerCase()),
	routeDataOwnerLogin: () => (vars.THECRAG_OWNER_LOGIN ?? '').trim() || null,
	getTheCragSyncConfiguration: () => {
		const mode = (vars.THECRAG_LOGBOOK_MODE ?? '').trim().toLowerCase() === 'csv' ? 'csv' : 'api';
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
		vars.THECRAG_LOGBOOK_MODE = 'csv';
		vars.THECRAG_API_KEY = 'shared-key';
		expect(getRouteHistoryStatus().hasApiKey).toBe(true);
		expect(getTheCragSyncConfiguration().configured).toBe(false);
	});

	it('never reports the logbook configured in CSV mode, even with a key', () => {
		vars.THECRAG_LOGBOOK_MODE = 'CSV';
		vars.THECRAG_API_KEY = 'shared-key';
		expect(getTheCragSyncConfiguration()).toEqual({ configured: false, mode: 'csv' });
	});

	it.each(['', 'api', 'API ', 'something'])(
		'THECRAG_LOGBOOK_MODE=%j keeps the API logbook',
		(value) => {
			vars.THECRAG_LOGBOOK_MODE = value;
			vars.THECRAG_API_KEY = 'shared-key';
			expect(getTheCragSyncConfiguration()).toEqual({ configured: true, mode: 'api' });
		}
	);

	it('still needs a key for route data in CSV mode', () => {
		vars.THECRAG_LOGBOOK_MODE = 'csv';
		expect(getRouteHistoryStatus().hasApiKey).toBe(false);
	});

	it('passes THECRAG_OWNER_LOGIN as the FA/FFA identity for CSV logbooks', () => {
		vars.THECRAG_OWNER_LOGIN = ' jodie ';
		expect(routeHistoryConfig().ownerLogin).toBe('jodie');
		expect(routeHistoryConfig().apiKey).toBe('');
	});
});
