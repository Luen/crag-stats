import { readFileSync } from 'node:fs';
import { beforeEach, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { wipeAllData } from './analytics';
import { db } from './db';
import { appSettings } from './db/schema';
import { updateSyncState, upsertAscents } from './ingest';
import { parseTheCragCsv } from './providers/thecrag/csv';
import { beginFirstImport, completeFirstImport, getFirstImport } from './firstImport';

const sample = parseTheCragCsv(readFileSync('samples/thecrag-logbook-sample.csv'));
beforeEach(() => wipeAllData());

it('records successful syncs centrally, including API and automatic CSV modes', () => {
	updateSyncState('thecrag', { status: 'running' });
	upsertAscents(sample);
	updateSyncState('thecrag', { status: 'idle', lastSuccessAt: '2026-10-27T01:00:00.000Z' });
	expect(getFirstImport()).toEqual({
		at: '2026-10-27T01:00:00.000Z',
		count: sample.length,
		legacy: false
	});
	updateSyncState('thecrag', { status: 'running' });
	updateSyncState('thecrag', { status: 'idle', lastSuccessAt: '2026-10-29T01:00:00.000Z' });
	expect(getFirstImport()?.at).toBe('2026-10-27T01:00:00.000Z');
});

it('does not complete the milestone on failed or empty syncs', () => {
	updateSyncState('thecrag', { status: 'running' });
	updateSyncState('thecrag', { status: 'idle', lastSuccessAt: '2026-10-27T01:00:00.000Z' });
	expect(getFirstImport()?.at).toBeNull();
	updateSyncState('thecrag', { status: 'running' });
	upsertAscents(sample);
	updateSyncState('thecrag', { status: 'error', lastError: 'Synthetic failure' });
	expect(getFirstImport()?.at).toBeNull();
});

it('records the first successful non-empty import and preserves it across subsequent imports', () => {
	const token = beginFirstImport();
	completeFirstImport(902, token, '2026-10-27T01:00:00.000Z');
	completeFirstImport(950, beginFirstImport(), '2026-10-29T01:00:00.000Z');
	expect(getFirstImport()).toEqual({ at: '2026-10-27T01:00:00.000Z', count: 902, legacy: false });
});

it('does not mistake a retry after a failed partial sync for a skipped milestone', () => {
	beginFirstImport();
	upsertAscents(sample); // A failed API pull wrote a batch, but never completed.
	expect(getFirstImport()).toEqual({ at: null, count: 0, legacy: false });
	completeFirstImport(sample.length, beginFirstImport(), '2026-10-27T01:00:00.000Z');
	expect(getFirstImport()?.at).toBe('2026-10-27T01:00:00.000Z');
});

it('stamps the first successful sync even when the logbook already had ascents', () => {
	upsertAscents(sample);
	completeFirstImport(sample.length, beginFirstImport(), '2026-10-29T01:00:00.000Z');
	expect(getFirstImport()).toEqual({
		at: '2026-10-29T01:00:00.000Z',
		count: sample.length,
		legacy: false
	});
	completeFirstImport(1000, beginFirstImport(), '2026-10-30T01:00:00.000Z');
	expect(getFirstImport()?.at).toBe('2026-10-29T01:00:00.000Z');
});

it('ignores empty imports', () => {
	completeFirstImport(0, beginFirstImport());
	expect(getFirstImport()?.at).toBeNull();
});

it('wipe resets the milestone, preserves preferences, and ignores an outstanding completion', () => {
	const token = beginFirstImport();
	db.insert(appSettings)
		.values({ key: 'grade_system', value: 'french', updatedAt: new Date().toISOString() })
		.run();
	wipeAllData();
	completeFirstImport(902, token);
	expect(getFirstImport()).toBeNull();
	expect(
		db.select().from(appSettings).where(eq(appSettings.key, 'grade_system')).get()?.value
	).toBe('french');
	completeFirstImport(1, beginFirstImport(), '2026-10-29T01:00:00.000Z');
	expect(getFirstImport()?.count).toBe(1);
});
