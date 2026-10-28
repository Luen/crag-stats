import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { profiles, routeHistory, routes } from './db/schema';
import { countOwnerSetRoutes, listOwnerSetRoutes, setterBadgeHits } from './routeSetters';
import { wipeAllData } from './analytics';

beforeEach(() => {
	wipeAllData();
});

describe('route setters from route_history', () => {
	it('counts distinct routes with @login on setter rows only', () => {
		db.insert(profiles)
			.values({ provider: 'thecrag', login: 'setter', name: 'S', updatedAt: '2020-01-01' })
			.run();
		db.insert(routes)
			.values([
				{
					provider: 'thecrag',
					externalId: '100',
					name: 'Line A',
					url: 'https://example/a',
					gradeScore: 20,
					gradeRaw: '20',
					gradeSystem: 'ewbank',
					gradeBand: 3,
					gearStyle: 'sport',
					cragName: 'Crag',
					country: null,
					areaExternalId: null,
					lat: null,
					lon: null,
					heightM: null,
					bolts: null,
					tagsJson: null,
					updatedAt: '2020-01-01'
				},
				{
					provider: 'thecrag',
					externalId: '101',
					name: 'Line B',
					url: null,
					gradeScore: null,
					gradeRaw: null,
					gradeSystem: 'unknown',
					gradeBand: null,
					gearStyle: 'sport',
					cragName: null,
					country: null,
					areaExternalId: null,
					lat: null,
					lon: null,
					heightM: null,
					bolts: null,
					tagsJson: null,
					updatedAt: '2020-01-01'
				}
			])
			.run();
		db.insert(routeHistory)
			.values([
				{
					provider: 'thecrag',
					routeExternalId: '100',
					historyExternalId: '1',
					type: 'Route Setter',
					climbers: '@setter',
					historyDate: '2019-06-15T00:00:00Z',
					rawJson: null,
					updatedAt: '2020-01-01'
				},
				{
					provider: 'thecrag',
					routeExternalId: '100',
					historyExternalId: '2',
					type: 'Route Setter',
					climbers: '@setter',
					historyDate: '2020-01-01T00:00:00Z',
					rawJson: null,
					updatedAt: '2020-01-01'
				},
				{
					provider: 'thecrag',
					routeExternalId: '101',
					historyExternalId: '3',
					type: 'rs',
					climbers: '@other',
					historyDate: '2018-01-01T00:00:00Z',
					rawJson: null,
					updatedAt: '2020-01-01'
				},
				{
					provider: 'thecrag',
					routeExternalId: '101',
					historyExternalId: '4',
					type: 'First Ascent',
					climbers: '@setter',
					historyDate: '2018-01-01T00:00:00Z',
					rawJson: null,
					updatedAt: '2020-01-01'
				}
			])
			.run();

		expect(countOwnerSetRoutes()).toBe(1);
		const listed = listOwnerSetRoutes();
		expect(listed).toHaveLength(1);
		expect(listed[0]?.routeExternalId).toBe('100');
		expect(listed[0]?.date).toBe('2019-06-15');
		expect(listed[0]?.routeName).toBe('Line A');

		const hits = setterBadgeHits();
		expect(hits).toHaveLength(1);
		expect(hits[0]?.detail).toContain('First route set');
	});

	it('returns zero without profile login', () => {
		db.delete(profiles).where(eq(profiles.provider, 'thecrag')).run();
		expect(countOwnerSetRoutes()).toBe(0);
	});

	it('resolves the owner login for the requested provider (#145)', () => {
		db.insert(profiles)
			.values([
				{ provider: 'thecrag', login: 'alpha', name: 'Alpha', updatedAt: '2020-01-01' },
				{ provider: 'synthetic', login: 'beta', name: 'Beta', updatedAt: '2020-01-01' }
			])
			.run();
		db.insert(routes)
			.values([
				{
					provider: 'thecrag',
					externalId: 'tc-1',
					name: 'Alpha Line',
					updatedAt: '2020-01-01'
				},
				{
					provider: 'synthetic',
					externalId: 'syn-1',
					name: 'Beta Line',
					updatedAt: '2020-01-01'
				}
			])
			.run();
		db.insert(routeHistory)
			.values([
				{
					provider: 'thecrag',
					routeExternalId: 'tc-1',
					historyExternalId: 'h1',
					type: 'Route Setter',
					climbers: '@alpha',
					historyDate: '2019-01-01T00:00:00Z',
					rawJson: null,
					updatedAt: '2020-01-01'
				},
				{
					provider: 'synthetic',
					routeExternalId: 'syn-1',
					historyExternalId: 'h2',
					type: 'Route Setter',
					climbers: '@beta',
					historyDate: '2019-06-01T00:00:00Z',
					rawJson: null,
					updatedAt: '2020-01-01'
				}
			])
			.run();

		expect(listOwnerSetRoutes('thecrag').map((r) => r.routeExternalId)).toEqual(['tc-1']);
		expect(listOwnerSetRoutes('synthetic').map((r) => r.routeExternalId)).toEqual(['syn-1']);
		expect(listOwnerSetRoutes('synthetic')).not.toEqual(listOwnerSetRoutes('thecrag'));
	});
});

it('preserves undated/invalid-date setter credits without inventing an epoch (#134)', () => {
	db.insert(profiles)
		.values({ provider: 'thecrag', login: 'setter', updatedAt: '2026-01-01' })
		.run();
	db.insert(routes)
		.values({
			provider: 'thecrag',
			externalId: 'unknown',
			name: 'Undated line',
			updatedAt: '2026-01-01'
		})
		.run();
	db.insert(routeHistory)
		.values({
			provider: 'thecrag',
			routeExternalId: 'unknown',
			historyExternalId: 'setter-row',
			type: 'Route Setter',
			climbers: '@setter',
			historyDate: '2018-00-00',
			updatedAt: '2026-01-01'
		})
		.run();
	expect(countOwnerSetRoutes()).toBe(1);
	expect(setterBadgeHits()[0].date).toBeNull();
	expect(setterBadgeHits()[0].detail).not.toContain('1970');
});
