import { beforeEach, describe, expect, it } from 'vitest';
import { wipeAllData } from './analytics';
import { db } from './db';
import { ascents, profiles, routes } from './db/schema';
import { upsertAscents } from './ingest';
import { buildKarmaStats, countLocalRoutesLogged } from './karma';

beforeEach(() => wipeAllData());

describe('buildKarmaStats (#136)', () => {
	it('does not award ascent points for orphan metadata or mismatched providers (#143)', () => {
		db.insert(routes)
			.values([
				{ provider: 'thecrag', externalId: 'orphan', name: 'No ascent', updatedAt: '2026-01-01' },
				{
					provider: 'thecrag',
					externalId: 'mismatch',
					name: 'Wrong provider',
					updatedAt: '2026-01-01'
				}
			])
			.run();
		const routeId = db
			.select()
			.from(routes)
			.all()
			.find((r) => r.externalId === 'mismatch')!.id;
		db.insert(ascents)
			.values({ provider: 'synthetic', externalId: 'other', routeId, updatedAt: '2026-01-01' })
			.run();
		expect(countLocalRoutesLogged()).toBe(0);
		expect(buildKarmaStats()).toMatchObject({
			ascentPoints: 0,
			routesLogged: 0,
			ascentSource: 'local'
		});
	});

	it('keeps distinct logged routes isolated by provider', () => {
		upsertAscents(
			['thecrag', 'synthetic'].map((provider) => ({
				provider,
				externalId: 'a1',
				isSend: true,
				isAttempt: false,
				route: { provider, externalId: 'r1', name: 'One' }
			}))
		);
		expect(countLocalRoutesLogged()).toBe(1);
		expect(countLocalRoutesLogged('synthetic')).toBe(1);
	});
	it('counts one ascent point per distinct local route', () => {
		upsertAscents([
			{
				provider: 'thecrag',
				externalId: 'a1',
				ascentDate: '2026-01-01',
				isSend: true,
				isAttempt: false,
				route: { provider: 'thecrag', externalId: 'r1', name: 'One' }
			},
			{
				provider: 'thecrag',
				externalId: 'a2',
				ascentDate: '2026-01-02',
				isSend: true,
				isAttempt: false,
				route: { provider: 'thecrag', externalId: 'r1', name: 'One' }
			},
			{
				provider: 'thecrag',
				externalId: 'a3',
				ascentDate: '2026-01-03',
				isSend: true,
				isAttempt: false,
				route: { provider: 'thecrag', externalId: 'r2', name: 'Two' }
			}
		]);
		const k = buildKarmaStats();
		expect(k.ascentPoints).toBe(2);
		expect(k.editPoints).toBeNull();
		expect(k.totalPoints).toBe(2);
		expect(k.ascentSource).toBe('local');
	});

	it('prefers denser account routesTicked for ascent points', () => {
		upsertAscents([
			{
				provider: 'thecrag',
				externalId: 'a1',
				ascentDate: '2026-01-01',
				isSend: true,
				isAttempt: false,
				route: { provider: 'thecrag', externalId: 'r1', name: 'One' }
			}
		]);
		db.insert(profiles)
			.values({
				provider: 'thecrag',
				login: 'climber',
				routesTicked: 40,
				updatedAt: '2020-01-01'
			})
			.run();
		const k = buildKarmaStats();
		expect(k.ascentPoints).toBe(40);
		expect(k.ascentSource).toBe('account');
		expect(k.routesLogged).toBe(1);
	});
});
