import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { wipeAllData } from './analytics';
import { db } from './db';
import { profiles, routeHistory, routes } from './db/schema';
import { setFirstAscent } from './firstAscents';
import { upsertAscents } from './ingest';
import { buildRouteDeveloperImpact } from './routeDeveloperImpact';

beforeEach(() => wipeAllData());

describe('buildRouteDeveloperImpact (#135)', () => {
	it('counts others on FA and setter routes, with a sport/bolted split', () => {
		db.insert(profiles)
			.values({ provider: 'thecrag', login: 'owner', name: 'O', updatedAt: '2020-01-01' })
			.run();

		upsertAscents([
			{
				provider: 'thecrag',
				externalId: 'fa-a0',
				ascentDate: '2026-01-01',
				isSend: true,
				isAttempt: false,
				route: {
					provider: 'thecrag',
					externalId: 'fa-sport',
					name: 'Bolty',
					gearStyle: 'Sport',
					bolts: 8
				}
			},
			{
				provider: 'thecrag',
				externalId: 'fa-a1',
				ascentDate: '2026-01-02',
				isSend: true,
				isAttempt: false,
				route: {
					provider: 'thecrag',
					externalId: 'fa-sport',
					name: 'Bolty',
					gearStyle: 'Sport',
					bolts: 8
				}
			},
			{
				provider: 'thecrag',
				externalId: 'trad-a0',
				ascentDate: '2026-01-01',
				isSend: true,
				isAttempt: false,
				route: {
					provider: 'thecrag',
					externalId: 'set-trad',
					name: 'Crack',
					gearStyle: 'Trad'
				}
			},
			{
				provider: 'thecrag',
				externalId: 'pend-a0',
				ascentDate: '2026-01-01',
				isSend: true,
				isAttempt: false,
				route: {
					provider: 'thecrag',
					externalId: 'pending',
					name: 'Pending',
					gearStyle: 'Sport'
				}
			}
		]);

		db.update(routes)
			.set({ ascentCount: 12, bolts: 8, gearStyle: 'Sport' })
			.where(eq(routes.externalId, 'fa-sport'))
			.run();
		db.update(routes)
			.set({ ascentCount: 5, gearStyle: 'Trad', bolts: null })
			.where(eq(routes.externalId, 'set-trad'))
			.run();
		db.update(routes).set({ ascentCount: null }).where(eq(routes.externalId, 'pending')).run();

		setFirstAscent('thecrag', 'fa-sport', 'FA');
		setFirstAscent('thecrag', 'pending', 'FA');
		db.insert(routeHistory)
			.values({
				provider: 'thecrag',
				routeExternalId: 'set-trad',
				historyExternalId: 'h1',
				type: 'Route Setter',
				climbers: '@owner',
				historyDate: '2020-01-01T00:00:00Z',
				rawJson: null,
				updatedAt: '2020-01-01'
			})
			.run();

		const impact = buildRouteDeveloperImpact();
		expect(impact.routesPutUp).toBe(3);
		expect(impact.routesWithCommunityData).toBe(2);
		// fa-sport: 12-2=10; set-trad: 5-1=4
		expect(impact.communityAscents).toBe(14);
		expect(impact.sportOrBoltedAscents).toBe(10);
	});
});
