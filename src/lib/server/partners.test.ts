import { beforeEach, expect, it } from 'vitest';
import { db } from './db';
import { ascents } from './db/schema';
import { getDashboardStats, wipeAllData } from './analytics';
import { listPartners } from './partners';
import { upsertAscents } from './ingest';

beforeEach(() => wipeAllData());
it('uses the same partner universe and top seven as the full page, including legacy missing routes', () => {
	upsertAscents(
		Array.from({ length: 9 }, (_, n) => ({
			provider: 'thecrag',
			externalId: `partner-${n}`,
			ascentDate: '2024-01-01',
			partners: `Partner ${n}`,
			isSend: true,
			isAttempt: false,
			route: {
				provider: 'thecrag',
				externalId: `route-${n}`,
				name: `Route ${n}`,
				cragName: 'Real crag'
			}
		}))
	);
	// A legacy/imported database can contain dangling non-null route ids despite today's FK rules.
	db.$client.pragma('foreign_keys = OFF');
	try {
		for (let n = 0; n < 3; n++)
			db.insert(ascents)
				.values({
					provider: 'thecrag',
					externalId: `orphan-${n}`,
					routeId: 987654321,
					ascentDate: `2024-02-0${n + 1}`,
					partners: 'Orphan partner',
					updatedAt: '2024-02-03'
				})
				.run();
	} finally {
		db.$client.pragma('foreign_keys = ON');
	}
	const full = listPartners();
	expect(full[0]).toMatchObject({ name: 'Orphan partner', ascents: 3, sessions: 3, areas: 0 });
	const dashboard = getDashboardStats();
	expect(dashboard.partners).toEqual(full.slice(0, 7));
	// Route-dependent totals still omit dangling-route rows.
	expect(dashboard.totalAscents).toBe(9);
});

it('uses cached area ids consistently on the dashboard and page', () => {
	upsertAscents(
		['Old', 'Renamed', 'Renamed'].map((name, n) => ({
			provider: 'thecrag',
			externalId: `area-${n}`,
			partners: 'Area partner',
			isSend: true,
			isAttempt: false,
			route: {
				provider: 'thecrag',
				externalId: `area-route-${n}`,
				name: `Route ${n}`,
				cragName: name,
				areaExternalId: n < 2 ? '123' : '456'
			}
		}))
	);
	expect(listPartners()[0]?.areas).toBe(2);
	expect(getDashboardStats().partners[0]?.areas).toBe(2);
});
