import { beforeEach, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { profiles, routeHistory, routes } from './db/schema';
import { upsertAscents } from './ingest';
import { listLogbook, wipeAllData } from './analytics';

beforeEach(() => {
	wipeAllData();
	upsertAscents(
		['r1', 'r2', 'r3'].map((id) => ({
			provider: 'thecrag',
			externalId: 'a-' + id,
			ascentDate: '2026-01-01',
			isSend: true,
			isAttempt: false,
			route: { provider: 'thecrag', externalId: id, name: 'Route ' + id, gearStyle: 'Sport' }
		}))
	);
});

function names(rows: { routeName: string }[]) {
	return rows.map((r) => r.routeName).sort();
}

it('filters on the theCrag project flag and leaves unknown flags out of both', () => {
	db.update(routes).set({ isProject: 1 }).where(eq(routes.externalId, 'r1')).run();
	db.update(routes).set({ isProject: 0 }).where(eq(routes.externalId, 'r2')).run();

	expect(names(listLogbook({ project: 'yes' }).rows)).toEqual(['Route r1']);
	expect(names(listLogbook({ project: 'no' }).rows)).toEqual(['Route r2']);
	expect(listLogbook().total).toBe(3);
});

it('filters on routes cached history credits the owner as setter', () => {
	db.insert(profiles)
		.values({ provider: 'thecrag', login: 'owner', name: 'O', updatedAt: '2026-01-01' })
		.run();
	db.insert(routeHistory)
		.values([
			{
				provider: 'thecrag',
				routeExternalId: 'r1',
				historyExternalId: 'h1',
				type: 'Route Setter',
				climbers: '@owner',
				historyDate: '2020-01-01T00:00:00Z',
				rawJson: null,
				updatedAt: '2026-01-01'
			},
			{
				provider: 'thecrag',
				routeExternalId: 'r2',
				historyExternalId: 'h2',
				type: 'Route Setter',
				climbers: '@someone-else',
				historyDate: '2020-01-01T00:00:00Z',
				rawJson: null,
				updatedAt: '2026-01-01'
			}
		])
		.run();

	expect(names(listLogbook({ setter: 'me' }).rows)).toEqual(['Route r1']);
	expect(names(listLogbook({ setter: 'none' }).rows)).toEqual(['Route r2', 'Route r3']);
});

function setRouteTags(routeId: string, tags: { category: string; name: string }[]) {
	db.update(routes)
		.set({ tagsJson: JSON.stringify(tags) })
		.where(eq(routes.externalId, routeId))
		.run();
}

it('filters tagExact on category and name with AND semantics', () => {
	setRouteTags('r1', [
		{ category: 'Steepness', name: 'Vertical' },
		{ category: 'Rock type', name: 'Granite' }
	]);
	setRouteTags('r2', [{ category: 'Steepness', name: 'Vertical' }]);
	setRouteTags('r3', [{ category: 'Aspect', name: 'Vertical' }]);

	expect(
		names(listLogbook({ tagExact: [{ category: 'Steepness', name: 'Vertical' }] }).rows)
	).toEqual(['Route r1', 'Route r2']);
	expect(
		names(
			listLogbook({
				tagExact: [
					{ category: 'Steepness', name: 'Vertical' },
					{ category: 'Rock type', name: 'Granite' }
				]
			}).rows
		)
	).toEqual(['Route r1']);
	expect(names(listLogbook({ tagExact: [{ category: 'Aspect', name: 'Vertical' }] }).rows)).toEqual(
		['Route r3']
	);
});

it('keeps rock= and tag= working alongside structured tags', () => {
	setRouteTags('r1', [
		{ category: 'Rock type', name: 'Granite' },
		{ category: 'Style', name: 'Crack' }
	]);
	setRouteTags('r2', [{ category: 'Rock type', name: 'Sandstone' }]);

	expect(names(listLogbook({ rock: 'granite' }).rows)).toEqual(['Route r1']);
	expect(names(listLogbook({ tag: 'crac' }).rows)).toEqual(['Route r1']);
	expect(
		names(
			listLogbook({
				rock: 'Granite',
				tagExact: [{ category: 'Style', name: 'Crack' }]
			}).rows
		)
	).toEqual(['Route r1']);
});

it('uses each route provider owner and keeps equal external IDs separate', () => {
	db.insert(profiles)
		.values([
			{ provider: 'thecrag', login: 'owner', updatedAt: '2026-01-01' },
			{ provider: 'synthetic', login: 'beta', updatedAt: '2026-01-01' }
		])
		.run();
	upsertAscents([
		{
			provider: 'synthetic',
			externalId: 'a-r1',
			isSend: true,
			isAttempt: false,
			route: { provider: 'synthetic', externalId: 'r1', name: 'Synthetic route' }
		}
	]);
	db.insert(routeHistory)
		.values([
			{
				provider: 'thecrag',
				routeExternalId: 'r1',
				historyExternalId: 'h1',
				type: 'Route Setter',
				climbers: '@someone-else',
				updatedAt: '2026-01-01'
			},
			{
				provider: 'synthetic',
				routeExternalId: 'r1',
				historyExternalId: 'h1',
				type: 'Route Setter',
				climbers: '@beta',
				updatedAt: '2026-01-01'
			}
		])
		.run();
	expect(names(listLogbook({ setter: 'me' }).rows)).toEqual(['Synthetic route']);
	expect(names(listLogbook({ setter: 'none' }).rows)).toEqual(['Route r1', 'Route r2', 'Route r3']);
});

it('filters "no pitch list cached" after route info fetch only', () => {
	const fetchedAt = '2026-01-02T00:00:00Z';
	db.update(routes)
		.set({ routeInfoUpdatedAt: fetchedAt, pitchesJson: null })
		.where(eq(routes.externalId, 'r1'))
		.run();
	db.update(routes)
		.set({ routeInfoUpdatedAt: fetchedAt, pitchesJson: '[]' })
		.where(eq(routes.externalId, 'r2'))
		.run();
	db.update(routes)
		.set({
			routeInfoUpdatedAt: fetchedAt,
			pitchesJson: JSON.stringify([{ number: 1, grade: '20' }])
		})
		.where(eq(routes.externalId, 'r3'))
		.run();

	expect(names(listLogbook({ missing: ['pitch'] }).rows)).toEqual(['Route r1', 'Route r2']);
	expect(listLogbook({ missing: ['pitch'] }).rows.every((r) => r.routeName !== 'Route r3')).toBe(
		true
	);
	// Route info never fetched (route_info_updated_at null) — excluded, regardless of pitches_json
	expect(listLogbook().total).toBe(3);
	db.update(routes)
		.set({ routeInfoUpdatedAt: null, pitchesJson: null })
		.where(eq(routes.externalId, 'r1'))
		.run();
	expect(names(listLogbook({ missing: ['pitch'] }).rows)).toEqual(['Route r2']);
});
