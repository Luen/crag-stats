import { beforeEach, expect, it } from 'vitest';
import { db, ensureSchema } from './db';
import { ascents, routes, weatherDays } from './db/schema';
import { wipeAllData } from './wipe';
import { getDashboardStats } from './analytics';
import { getWeatherPageData } from './weatherPage';

beforeEach(() => {
	ensureSchema();
	wipeAllData();
});

it('returns an empty public view without cached weather', () => {
	expect(getWeatherPageData()).toEqual({
		conditions: null,
		performance: null,
		coverage: {
			resolvedDays: 0,
			cachedDays: 0,
			unavailableDays: 0,
			uncheckedDays: 0,
			unresolvedAscents: 0
		}
	});
});

it('shares dashboard analytics, deduplicates location-days and separates coverage units', () => {
	const at = '2026-10-01';
	const makeRoute = (externalId: string, name: string, lat: number | null = 12) =>
		db
			.insert(routes)
			.values({
				provider: 'thecrag',
				externalId,
				name,
				cragName: name.includes('Gym') ? 'Climbing Gym' : 'Outdoor crag',
				gearStyle: 'Sport',
				lat,
				lon: lat == null ? null : 34,
				updatedAt: at
			})
			.returning()
			.get().id;
	const routeId = makeRoute('outdoor', 'Outdoor');
	const gymId = makeRoute('gym', 'Gym');
	const unresolvedId = makeRoute('unresolved', 'Unresolved', null);
	for (const [i, route, day] of [
		[1, routeId, '2026-09-01'],
		[2, routeId, '2026-09-01'],
		[3, routeId, '2026-09-02'],
		[4, routeId, '2026-09-03'],
		[5, gymId, '2026-09-01'],
		[6, unresolvedId, '2026-09-01'],
		[7, unresolvedId, '2026-02-30']
	] as const)
		db.insert(ascents)
			.values({
				provider: 'thecrag',
				externalId: `ascent-${i}`,
				routeId: route,
				ascentDate: day,
				isSend: true,
				tickType: 'Red point',
				comment: 'PRIVATE-WEATHER-TEST',
				updatedAt: at
			})
			.run();
	for (const [day, status] of [
		['2026-09-01', 'ok'],
		['2026-09-02', 'missing']
	] as const)
		db.insert(weatherDays)
			.values({ latKey: 12, lonKey: 34, day, status, tempMaxC: 20, fetchedAt: at })
			.run();
	const view = getWeatherPageData();
	expect(view.coverage).toEqual({
		resolvedDays: 3,
		cachedDays: 1,
		unavailableDays: 1,
		uncheckedDays: 1,
		unresolvedAscents: 1
	});
	expect(view.performance).toMatchObject({ ready: false, days: 1, ascents: 2 });
	const dashboard = getDashboardStats();
	expect(view.conditions).toEqual(dashboard.weatherConditions);
	expect(view.performance).toEqual(dashboard.weatherPerformance);
	expect(JSON.stringify(view)).not.toContain('PRIVATE-WEATHER-TEST');
});
