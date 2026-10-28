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
