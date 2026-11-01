import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./auth', () => ({ authScope: () => 'settings', isAuthEnabled: () => false }));
import { buildOfflineSnapshot, offlineRevision } from './offline';
import { upsertAscents } from './ingest';
import { wipeAllData } from './analytics';
import { setAppSetting } from './appSettings';
import { OFFLINE_SCHEMA, OFFLINE_TTL, snapshotIsFresh } from '#lib/offline';

beforeEach(() => wipeAllData());

it('whitelists public fields even when private notes are enabled', () => {
	setAppSetting('show_notes', 'on');
	upsertAscents([
		{
			provider: 'thecrag',
			externalId: 'offline-fixture',
			ascentDate: '2026-10-31',
			isSend: true,
			isAttempt: false,
			comment: 'PRIVATE SECRET',
			partners: 'Alex',
			rawJson: JSON.stringify({ comment: 'PRIVATE RAW SECRET' }),
			route: {
				provider: 'thecrag',
				externalId: 'offline-route',
				name: 'Synthetic offline route',
				gearStyle: 'Sport',
				gradeRaw: '20',
				gradeScore: 20,
				gradeSystem: 'ewbank'
			}
		}
	]);
	const snapshot = buildOfflineSnapshot();
	expect(snapshot.rows).toHaveLength(1);
	expect(Object.keys(snapshot.rows[0]).sort()).toEqual(
		['id', 'date', 'name', 'grade', 'tick', 'crag', 'partners'].sort()
	);
	expect(snapshot.rows[0].partners).toBe('Alex');
	expect(JSON.stringify(snapshot)).not.toContain('PRIVATE');
	expect(snapshot.summary.ascents).toBe(1);
	expect(snapshot.total).toBe(1);
});

it('invalidates downloads after wipe or relevant visibility changes', () => {
	const before = offlineRevision();
	expect(offlineRevision()).toBe(before);
	setAppSetting('show_notes', 'off');
	expect(offlineRevision()).not.toBe(before);
	const changed = offlineRevision();
	wipeAllData();
	expect(offlineRevision()).not.toBe(changed);
});

it('expires downloads at seven days and rejects future, invalid or obsolete versions', () => {
	const snapshot = buildOfflineSnapshot();
	const saved = Date.parse(snapshot.savedAt);
	expect(snapshotIsFresh(snapshot, saved + OFFLINE_TTL - 1)).toBe(true);
	expect(snapshotIsFresh(snapshot, saved + OFFLINE_TTL)).toBe(false);
	expect(snapshotIsFresh(snapshot, saved - 1)).toBe(false);
	expect(snapshotIsFresh({ ...snapshot, savedAt: 'not-a-date' })).toBe(false);
	expect(snapshotIsFresh({ ...snapshot, schema: OFFLINE_SCHEMA + 1 })).toBe(false);
});
