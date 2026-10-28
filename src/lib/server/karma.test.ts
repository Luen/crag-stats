import { beforeEach, describe, expect, it } from 'vitest';
import { wipeAllData } from './analytics';
import { db } from './db';
import { profiles } from './db/schema';
import { upsertAscents } from './ingest';
import { buildKarmaStats } from './karma';

beforeEach(() => wipeAllData());

describe('buildKarmaStats (#136)', () => {
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
