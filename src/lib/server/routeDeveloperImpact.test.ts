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
			.set({ ascentCount: 12, ascentCountOwn: 2, bolts: 8, gearStyle: 'Sport' })
			.where(eq(routes.externalId, 'fa-sport'))
			.run();
		db.update(routes)
			.set({ ascentCount: 5, ascentCountOwn: 1, gearStyle: 'Trad', bolts: null })
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

		// A later logbook change must not change an older community snapshot (#140).
		upsertAscents([
			{
				provider: 'thecrag',
				externalId: 'repeat-later',
				isSend: true,
				isAttempt: false,
				route: { provider: 'thecrag', externalId: 'fa-sport', name: 'Bolty' }
			}
		]);
		expect(buildRouteDeveloperImpact().communityAscents).toBe(14);
	});

	it('treats legacy totals without an owner snapshot as unavailable', () => {
		upsertAscents([
			{
				provider: 'thecrag',
				externalId: 'old',
				isSend: true,
				isAttempt: false,
				route: { provider: 'thecrag', externalId: 'legacy', name: 'Legacy' }
			}
		]);
		setFirstAscent('thecrag', 'legacy', 'FA');
		db.update(routes).set({ ascentCount: 12 }).where(eq(routes.externalId, 'legacy')).run();
		expect(buildRouteDeveloperImpact()).toMatchObject({
			routesPutUp: 1,
			routesWithCommunityData: 0,
			communityAscents: 0
		});
	});

	it('keeps a complete known zero distinct from missing data', () => {
		upsertAscents([
			{
				provider: 'thecrag',
				externalId: 'zero',
				isSend: true,
				isAttempt: false,
				route: { provider: 'thecrag', externalId: 'zero', name: 'Only the owner' }
			}
		]);
		setFirstAscent('thecrag', 'zero', 'FA');
		db.update(routes)
			.set({ ascentCount: 1, ascentCountOwn: 1 })
			.where(eq(routes.externalId, 'zero'))
			.run();
		expect(buildRouteDeveloperImpact()).toMatchObject({
			routesPutUp: 1,
			routesWithCommunityData: 1,
			communityAscents: 0
		});
	});
});
