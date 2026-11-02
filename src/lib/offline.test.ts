import { expect, it } from 'vitest';
import {
	OFFLINE_SCHEMA,
	OFFLINE_REFRESH_INTERVAL,
	OFFLINE_RETRY_INTERVAL,
	offlineRefreshDue,
	type OfflineSnapshot
} from './offline';

const now = Date.parse('2026-11-02T00:00:00Z');
const snapshot: OfflineSnapshot = {
	schema: OFFLINE_SCHEMA,
	savedAt: new Date(now).toISOString(),
	revision: 'synthetic',
	total: 0,
	summary: { ascents: 0, sends: 0, heightM: 0 },
	rows: []
};

it('downloads a missing copy and refreshes hourly, including expired or obsolete copies', () => {
	expect(offlineRefreshDue(null, null, now)).toBe(true);
	expect(offlineRefreshDue(snapshot, null, now + OFFLINE_REFRESH_INTERVAL - 1)).toBe(false);
	expect(offlineRefreshDue(snapshot, null, now + OFFLINE_REFRESH_INTERVAL)).toBe(true);
	expect(offlineRefreshDue({ ...snapshot, savedAt: 'invalid' }, null, now)).toBe(true);
	expect(offlineRefreshDue({ ...snapshot, schema: 0 }, null, now)).toBe(true);
});

it('honours a persisted pause even with no copy, and backs off after a failed attempt', () => {
	expect(offlineRefreshDue(null, { enabled: false, lastAttempt: 0 }, now)).toBe(false);
	const state = { enabled: true, lastAttempt: now };
	expect(offlineRefreshDue(null, state, now + OFFLINE_RETRY_INTERVAL - 1)).toBe(false);
	expect(offlineRefreshDue(null, state, now + OFFLINE_RETRY_INTERVAL)).toBe(true);
});
