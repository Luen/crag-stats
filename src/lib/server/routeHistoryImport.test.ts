import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isRouteHistoryImportEnabled, getRouteHistoryStatus } from './routeHistoryImport';

const values = vi.hoisted(() => ({}) as Record<string, string>);
vi.mock('./env', () => ({
	env: (name: string) => values[name] ?? '',
	envFlag: (name: string) =>
		['1', 'true', 'yes', 'on'].includes((values[name] ?? '').trim().toLowerCase()),
	getTheCragSyncConfiguration: () => ({ mode: 'api', configured: false })
}));

beforeEach(() => {
	for (const key of Object.keys(values)) delete values[key];
});

describe('route data import configuration', () => {
	it.each([
		{ current: undefined, legacy: undefined, enabled: false },
		{ current: 'true', legacy: undefined, enabled: true },
		{ current: undefined, legacy: 'true', enabled: false },
		{ current: '', legacy: 'true', enabled: false },
		{ current: undefined, legacy: 'false', enabled: false },
		{ current: 'false', legacy: 'true', enabled: false },
		{ current: '0', legacy: 'true', enabled: false },
		{ current: 'off', legacy: 'true', enabled: false },
		{ current: 'true', legacy: 'false', enabled: true },
		{ current: ' YES ', legacy: 'false', enabled: true },
		{ current: 'invalid', legacy: 'true', enabled: false }
	])('new=$current, legacy=$legacy enables import: $enabled', ({ current, legacy, enabled }) => {
		if (current !== undefined) values.ROUTE_DATA_IMPORT = current;
		if (legacy !== undefined) values.ROUTE_HISTORY_IMPORT = legacy;
		expect(isRouteHistoryImportEnabled()).toBe(enabled);
		expect(getRouteHistoryStatus().enabled).toBe(enabled);
	});
});
