import { readFileSync } from 'node:fs';
import { beforeEach, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { wipeAllData } from './analytics';
import { db } from './db';
import { appSettings } from './db/schema';
import { updateSyncState, upsertAscents } from './ingest';
import { parseTheCragCsv } from './providers/thecrag/csv';
import {
	beginFirstImport,
	completeFirstImport,
	correctFirstImportDate,
	firstImportDateInput,
	getFirstImport
} from './firstImport';

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

it('does not mistake a retry after a failed partial sync for an older installation', () => {
	beginFirstImport();
	upsertAscents(sample); // A failed API pull wrote a batch, but never completed.
	expect(getFirstImport()).toEqual({ at: null, count: 0, legacy: false });
	completeFirstImport(sample.length, beginFirstImport(), '2026-10-27T01:00:00.000Z');
	expect(getFirstImport()?.at).toBe('2026-10-27T01:00:00.000Z');
});

it('leaves legacy dates unknown after later syncs, until the owner supplies the original date', () => {
	upsertAscents(sample);
	completeFirstImport(sample.length, beginFirstImport(), '2026-10-29T01:00:00.000Z');
	expect(getFirstImport()).toEqual({ at: null, count: sample.length, legacy: true });
	correctFirstImportDate('2026-10-27');
	completeFirstImport(1000, beginFirstImport());
	expect(getFirstImport()).toEqual({ at: '2026-10-27', count: sample.length, legacy: false });
});

it('ignores empty imports and rejects invalid correction dates', () => {
	completeFirstImport(0, beginFirstImport());
	expect(getFirstImport()?.at).toBeNull();
	expect(() => correctFirstImportDate('2026-10-27')).toThrow('Import a logbook');
	expect(() => correctFirstImportDate('2026-02-30')).toThrow('valid first import date');
	upsertAscents(sample);
	expect(() => correctFirstImportDate('2999-01-01')).toThrow('cannot be in the future');
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

it('uses the site time zone for timestamps and preserves manually entered calendar dates', () => {
	const display = { locale: 'en-AU', timeZone: 'Australia/Brisbane' };
	expect(
		firstImportDateInput({ at: '2026-10-26T14:30:00.000Z', count: 1, legacy: false }, display)
	).toBe('2026-10-27');
	expect(
		firstImportDateInput(
			{ at: '2026-10-27', count: 1, legacy: false },
			{ ...display, timeZone: 'Pacific/Honolulu' }
		)
	).toBe('2026-10-27');
});
