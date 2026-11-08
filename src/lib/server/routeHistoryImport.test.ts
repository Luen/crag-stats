import { afterEach, describe, expect, it, vi } from 'vitest';

// Only the flags these tests set; everything else reads as unset.
const vars: Record<string, string> = {};

vi.mock('./env', () => ({
	env: (name: string, fallback = '') => vars[name] ?? fallback,
	envFlag: (name: string) => ['1', 'true', 'yes', 'on'].includes((vars[name] ?? '').toLowerCase()),
	getTheCragSyncConfiguration: () => ({ configured: true })
}));

const { isRouteHistoryImportEnabled, getRouteHistoryStatus } = await import('./routeHistoryImport');

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
