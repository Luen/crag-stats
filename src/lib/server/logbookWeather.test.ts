import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { routes, weatherDays } from './db/schema';
import { upsertAscents } from './ingest';
import { listLogbook, wipeAllData } from './analytics';
import { isMissingLogbookWeather } from './logbookWeather';

type Day = {
	latKey: number;
	lonKey: number;
	day: string;
	tempMaxC: number | null;
	tempMinC: number | null;
	precipMm: number | null;
	weatherCode: number | null;
	status?: string;
};

function cache(d: Day) {
	db.insert(weatherDays)
		.values({ status: 'ok', fetchedAt: '2026-01-01T00:00:00Z', ...d })
		.run();
}

function names(rows: { routeName: string }[]) {
	return rows.map((r) => r.routeName).sort();
}

beforeEach(() => {
	wipeAllData();
	// r-hot / r-freeze / r-rain / r-snow / r-fair share a crag; r-gym is indoor; r-none has no cache.
	const ids = ['hot', 'freeze', 'rain', 'snow', 'fair', 'gym', 'none', 'nocoords'];
	upsertAscents(
		ids.map((id, i) => ({
			provider: 'thecrag',
			externalId: 'a-' + id,
			ascentDate: `2025-03-${String(i + 1).padStart(2, '0')}`,
			isSend: true,
			isAttempt: false,
			route: {
				provider: 'thecrag',
				externalId: id,
				name: id === 'gym' ? 'Gym Route' : `Route ${id}`,
				cragName: id === 'gym' ? 'City Climbing Gym' : 'Outdoor crag',
				gearStyle: 'Sport'
			}
		}))
	);
	for (const id of ids) {
		if (id === 'nocoords') continue;
		db.update(routes).set({ lat: -33.6, lon: 150.3 }).where(eq(routes.externalId, id)).run();
	}
	const base = { latKey: -33.6, lonKey: 150.3 };
	cache({ ...base, day: '2025-03-01', tempMaxC: 38, tempMinC: 24, precipMm: 0, weatherCode: 0 });
	cache({ ...base, day: '2025-03-02', tempMaxC: 3, tempMinC: -4, precipMm: 0, weatherCode: 1 });
	cache({ ...base, day: '2025-03-03', tempMaxC: 14, tempMinC: 9, precipMm: 6, weatherCode: 61 });
	cache({ ...base, day: '2025-03-04', tempMaxC: 0, tempMinC: -6, precipMm: 3, weatherCode: 73 });
	cache({ ...base, day: '2025-03-05', tempMaxC: 21, tempMinC: 11, precipMm: 0, weatherCode: 1 });
	// Gym day has a cache row at the same key; it must still never match.
	cache({ ...base, day: '2025-03-06', tempMaxC: 38, tempMinC: 24, precipMm: 0, weatherCode: 0 });
});

describe('logbook weather facets (#273)', () => {
	it('filters each facet from cached outdoor days', () => {
		expect(names(listLogbook({ weather: 'heat' }).rows)).toEqual(['Route hot']);
		expect(names(listLogbook({ weather: 'freeze' }).rows)).toEqual(['Route freeze', 'Route snow']);
		expect(names(listLogbook({ weather: 'rain' }).rows)).toEqual(['Route rain']);
		expect(names(listLogbook({ weather: 'snow' }).rows)).toEqual(['Route snow']);
		expect(names(listLogbook({ weather: 'fair' }).rows)).toEqual(['Route fair']);
	});

	it('never matches indoor routes, uncached days or routes without coordinates', () => {
		for (const weather of ['heat', 'freeze', 'rain', 'snow', 'fair'] as const) {
			expect(names(listLogbook({ weather }).rows)).not.toContain('Gym Route');
			expect(names(listLogbook({ weather }).rows)).not.toContain('Route none');
			expect(names(listLogbook({ weather }).rows)).not.toContain('Route nocoords');
		}
	});

	it('lists outdoor ascents with coordinates and no cached weather as missing', () => {
		const rows = listLogbook({ missing: ['weather'] }).rows;
		expect(names(rows)).toEqual(['Route none']);
	});

	it('only treats past days as missing and ignores non-ok cache rows as cached', () => {
		const row = {
			ascentDate: '2025-03-07',
			lat: -33.6,
			lon: 150.3,
			gearStyle: 'Sport',
			routeName: 'r',
			cragName: 'Outdoor crag',
			tagsJson: null
		};
		expect(isMissingLogbookWeather(new Map(), row, '2025-03-07')).toBe(false);
		expect(isMissingLogbookWeather(new Map(), row, '2025-03-08')).toBe(true);
		expect(
			isMissingLogbookWeather(new Map(), { ...row, ascentDate: '2018-00-00' }, '2026-01-01')
		).toBe(false);
	});

	it('attaches accessible chips only to outdoor rows with a cache hit', () => {
		const { rows, weatherAvailable } = listLogbook();
		expect(weatherAvailable).toBe(true);
		const by = Object.fromEntries(rows.map((r) => [r.routeName, r.weatherChips.map((c) => c.key)]));
		expect(by['Route hot']).toEqual(['heat']);
		expect(by['Route snow']).toEqual(['freeze', 'snow']);
		expect(by['Route fair']).toEqual(['fair']);
		expect(by['Gym Route']).toEqual([]);
		expect(by['Route none']).toEqual([]);
	});

	it('reports no weather and no chips when the cache is empty', () => {
		db.delete(weatherDays).run();
		const { rows, weatherAvailable } = listLogbook();
		expect(weatherAvailable).toBe(false);
		expect(rows.every((r) => r.weatherChips.length === 0)).toBe(true);
	});
});
