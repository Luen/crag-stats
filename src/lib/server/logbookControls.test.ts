import { beforeEach, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { upsertAscents } from './ingest';
import { listLogbook, wipeAllData } from './analytics';
import { logbookOptions } from './logbookOptions';
import { matchingSuggestions } from '#lib/logbookSuggestions';
import { db } from './db';
import { profiles, routes } from './db/schema';

beforeEach(() => wipeAllData());

it('distinguishes missing route styles from Other despite ascent protection overrides', () => {
	const styles = [null, '', '  ', 'Unknown', ' unknown ', 'Sport', 'Trad', 'Boulder', 'Ice'];
	upsertAscents(
		styles.map((gearStyle, i) => ({
			provider: 'thecrag',
			externalId: `s${i}`,
			ascentDate: '2026-01-01',
			isSend: true,
			isAttempt: false,
			ascentGearStyle: 'Sport',
			route: { provider: 'thecrag', externalId: `r${i}`, name: `Route ${i}`, gearStyle }
		}))
	);
	expect(listLogbook({ styles: ['Unknown'] }).total).toBe(5);
	expect(listLogbook({ styles: ['Other'] }).rows.map((r) => r.routeName)).toEqual(['Route 8']);
	expect(listLogbook({ styles: ['Unknown', 'Trad'] }).total).toBe(6);
});

it('has a useful empty inventory and merges casing duplicates', () => {
	expect(logbookOptions().rocks).toEqual([]);
	seed();
	expect(logbookOptions().rocks).toEqual([{ value: 'granite', label: 'Granite' }]);
});

function seed() {
	upsertAscents(
		['one', 'two'].map((id, i) => ({
			provider: 'thecrag',
			externalId: id,
			ascentDate: '2024-03-10T23:00:00-10:00',
			isSend: true,
			isAttempt: false,
			partners: '@jodierummer, Sam',
			comment: 'Private secret never suggested',
			route: {
				provider: 'thecrag',
				externalId: id,
				name: 'Repeated name',
				cragName: 'Same crag',
				parentName: 'Same sector',
				areaExternalId: `a${i}`,
				parentExternalId: `s${i}`,
				tags: [{ category: 'Rock type', name: i ? '  granite  ' : 'Granite' }]
			}
		}))
	);
}

it('inventories only logged routes, deduplicates rock tags, and preserves identities', () => {
	seed();
	db.insert(routes)
		.values({
			provider: 'thecrag',
			externalId: 'unlogged',
			name: 'Unlogged',
			tagsJson: JSON.stringify([{ category: 'Rock type', name: 'Sandstone' }]),
			updatedAt: '2026-01-01'
		})
		.run();
	db.update(routes)
		.set({ tagsJson: JSON.stringify([{ category: 'Rock type', name: '  Red   Granite ' }]) })
		.where(eq(routes.externalId, 'two'))
		.run();
	const options = logbookOptions();
	expect(options.rocks).toEqual([
		{ value: 'granite', label: 'Granite' },
		{ value: 'red granite', label: 'Red Granite' }
	]);
	expect(listLogbook({ rock: '  RED   GRANITE  ' }).total).toBe(1);
	expect(options.crags).toHaveLength(2);
	expect(options.sectors).toHaveLength(2);
	expect(options.routes).toHaveLength(2);
	for (const option of options.crags) expect(listLogbook({ cragKey: option.key }).total).toBe(1);
	for (const option of options.sectors)
		expect(listLogbook({ sectorKey: option.key }).total).toBe(1);
	for (const option of options.routes)
		expect(listLogbook({ route: Number(option.key) }).total).toBe(1);
	expect(JSON.stringify(options)).not.toContain('Private secret');
	expect(JSON.stringify(options)).not.toContain('Unlogged');
	expect(options.years).toEqual(['2024']);
});

it('suggests canonical handles using partial names and only known identity associations', () => {
	seed();
	db.insert(profiles)
		.values({
			provider: 'thecrag',
			login: 'jodierummer',
			name: 'Jodie Rummer',
			updatedAt: '2026-01-01'
		})
		.run();
	const options = logbookOptions();
	expect(matchingSuggestions(options.partners, 'JODIE')).toEqual([
		{ value: '@jodierummer', label: 'Jodie Rummer (@jodierummer)' }
	]);
	expect(listLogbook({ with: '@jodierummer', partnerMatch: 'exact' }).total).toBe(2);
	expect(listLogbook({ with: 'Jodie', partnerMatch: 'contains' }).total).toBe(2);
	expect(listLogbook({ with: 'Jodie', partnerMatch: 'exact' }).total).toBe(0);
	expect(matchingSuggestions(options.partners, 'unknown')).toEqual([]);
});

it('uses written days, excludes impossible dates, validates bounds, and includes both edges', () => {
	seed();
	upsertAscents(
		['2024-03-09', '2024-03-11', '2024-02-30', null].map((ascentDate, i) => ({
			provider: 'thecrag',
			externalId: `date${i}`,
			ascentDate,
			isSend: true,
			isAttempt: false,
			route: { provider: 'thecrag', externalId: `date${i}`, name: 'Outside' }
		}))
	);
	expect(listLogbook({ from: '2024-03-10', to: '2024-03-10' }).total).toBe(2);
	expect(listLogbook({ from: '2024-03-10' }).total).toBe(3);
	expect(listLogbook({ to: '2024-03-10' }).total).toBe(3);
	expect(listLogbook({ year: 2024 }).total).toBe(4);
	expect(listLogbook({ from: '2024-02-30' }).total).toBe(0);
	expect(listLogbook({ from: '2024-03-11', to: '2024-03-10' }).total).toBe(0);
});
