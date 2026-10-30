import { beforeEach, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './db';
import {
	routes,
	weatherDays,
	weatherLocations,
	weatherPlaceOverrides,
	weatherPlaceSearches
} from './db/schema';
import { upsertAscents } from './ingest';
import { getDashboardStats, listLogbook, wipeAllData } from './analytics';
import { mapAscent } from './providers/thecrag/api';
import { listPendingWeatherDays } from './weatherEngine';
import {
	chooseWeatherPlace,
	clearWeatherPlace,
	listWeatherLocationGroups,
	loadWeatherLocations,
	resolveWeatherLocation,
	searchWeatherPlaces
} from './weatherLocations';
const NOW = Date.now();
beforeEach(() => wipeAllData());
const raw = (id = 1) => ({
	id,
	date: '2025-01-01',
	tick: { name: 'Red point' },
	route: {
		id: 100 + id,
		name: `Weather route ${id}`,
		style: 'Sport',
		ancestors: {
			country: { id: 8, name: 'Test country', geometry: [20, 10] },
			TLC: { id: 30, name: 'Test crag' }
		}
	}
});
const response = () =>
	new Response(
		JSON.stringify({
			results: [
				{
					id: 123,
					name: 'Test town',
					country_code: 'AU',
					feature_code: 'PPL',
					country: 'Australia',
					admin1: 'Test state',
					latitude: -33.6,
					longitude: 150.3,
					elevation: 100
				},
				{
					id: 124,
					name: 'Test town',
					country_code: 'AU',
					feature_code: 'PPL',
					country: 'Australia',
					admin1: 'Other state',
					latitude: -34,
					longitude: 151
				},
				{
					id: 125,
					name: 'Wrong country',
					country_code: 'US',
					feature_code: 'PPL',
					latitude: 10,
					longitude: 20
				}
			]
		})
	);
it('prefers route, then immediate sector/crag points; rejects country and unverified polygons', () => {
	const route = {
		name: 'R',
		lat: 0,
		lon: 0,
		ancestors: {
			parent: { id: 1, name: 'Sector', geometry: [30, 20] },
			TLC: { id: 2, name: 'Crag', geometry: [40, 50] },
			country: { id: 9, geometry: [10, 10] }
		}
	};
	expect(resolveWeatherLocation(route, 'now')).toMatchObject({ source: 'route', lat: 0, lon: 0 });
	expect(resolveWeatherLocation({ ...route, lat: null, lon: null }, 'now')).toMatchObject({
		source: 'sector',
		lat: 20,
		lon: 30
	});
	expect(
		resolveWeatherLocation(
			{
				ancestors: { country: { id: 9, geometry: [10, 20] }, parent: { id: 9, geometry: [10, 20] } }
			},
			'now'
		)
	).toBeNull();
	expect(
		resolveWeatherLocation(
			{
				geometry: {
					type: 'Polygon',
					coordinates: [
						[
							[0, 0],
							[1, 0],
							[1, 1],
							[0, 0]
						]
					]
				}
			},
			'now'
		)
	).toBeNull();
	expect(resolveWeatherLocation({ lat: NaN, lon: 1 }, 'now')).toBeNull();
	expect(
		resolveWeatherLocation({ geometry: { type: 'Point', coordinates: [[], []] } }, 'now')
	).toBeNull();
});
it('discards legacy country coordinates, deduplicates crag days and uses one key across weather surfaces', () => {
	upsertAscents([mapAscent(raw())!]);
	expect(listLogbook().rows[0].lat).toBe(10);
	expect(loadWeatherLocations().values().next().value).toBeNull();
	expect(listPendingWeatherDays(50, NOW)).toEqual([]);
	const first = raw();
	first.route.ancestors.TLC = {
		...first.route.ancestors.TLC,
		geometry: [150.3, -33.6]
	} as typeof first.route.ancestors.TLC;
	const second = { ...first, id: 2, route: { ...first.route, id: 102 } };
	upsertAscents([mapAscent(first)!, mapAscent(second)!]);
	expect(listPendingWeatherDays(50, NOW)).toEqual([
		{ latKey: -33.6, lonKey: 150.3, day: '2025-01-01' }
	]);
	db.insert(weatherDays)
		.values({
			latKey: -33.6,
			lonKey: 150.3,
			day: '2025-01-01',
			tempMaxC: 38,
			tempMinC: 20,
			precipMm: 0,
			weatherCode: 0,
			status: 'ok',
			fetchedAt: 'now'
		})
		.run();
	expect(listLogbook({ weather: 'heat' }).total).toBe(2);
	expect(getDashboardStats().weatherConditions?.withWeather).toBe(1);
	expect(getDashboardStats().heatmap[0].weather?.tempMaxC).toBe(38);
	expect(getDashboardStats().badges.earned.some((b) => b.id === 'weather_heat')).toBe(true);
});
it('caches qualified searches, requires owner selection, preserves route coords and invalidates changed overrides', async () => {
	upsertAscents([mapAscent(raw())!]);
	const fetcher = vi.fn(async () => response()) as unknown as typeof fetch;
	const search = await searchWeatherPlaces('Test town', 'au', fetcher, NOW);
	expect(search.candidates).toHaveLength(2);
	expect(listWeatherLocationGroups()[0].unresolved).toBe(1);
	await searchWeatherPlaces('Test town', 'AU', fetcher, NOW + 10);
	expect(fetcher).toHaveBeenCalledTimes(1);
	const area = listWeatherLocationGroups()[0].key;
	chooseWeatherPlace(area, search.queryKey, 123);
	const before = db.select().from(routes).get()!;
	expect(loadWeatherLocations().get(before.id)).toMatchObject({ source: 'place', lat: -33.6 });
	expect(db.select().from(routes).get()?.lat).toBe(10);
	db.insert(weatherDays)
		.values({
			latKey: -33.6,
			lonKey: 150.3,
			day: '2025-01-01',
			tempMaxC: 38,
			tempMinC: 20,
			precipMm: 0,
			weatherCode: 0,
			status: 'ok',
			fetchedAt: 'now'
		})
		.run();
	expect(listLogbook({ weather: 'heat' }).total).toBe(1);
	expect(getDashboardStats().badges.earned.some((b) => b.id === 'weather_heat')).toBe(false);
	chooseWeatherPlace(area, search.queryKey, 124);
	expect(listLogbook({ weather: 'heat' }).total).toBe(0);
	clearWeatherPlace(area);
	expect(loadWeatherLocations().get(before.id)).toBeNull();
	db.update(routes).set({ name: 'Indoor gym' }).where(eq(routes.id, before.id)).run();
	expect(() => chooseWeatherPlace(area, search.queryKey, 123)).toThrow('Unknown');
	expect(listLogbook({ weather: 'heat' }).total).toBe(0);
});
it('backs off on provider errors and honors Retry-After', async () => {
	const bad = vi.fn(
		async () => new Response('', { status: 429, headers: { 'retry-after': '86400' } })
	) as unknown as typeof fetch;
	await expect(searchWeatherPlaces('Test town', 'AU', bad, NOW)).rejects.toThrow('failed');
	expect(db.select().from(weatherPlaceSearches).get()?.nextAllowedAt).toBe(NOW + 86400000);
	await expect(searchWeatherPlaces('Other town', 'AU', bad, NOW + 5000)).rejects.toThrow('cooling');
	expect(bad).toHaveBeenCalledTimes(1);
});
it('wipes provenance, searches, overrides and cancels in-flight geocoding writes', async () => {
	upsertAscents([mapAscent(raw())!]);
	loadWeatherLocations();
	let finish!: (r: Response) => void;
	const pending = searchWeatherPlaces(
		'Test town',
		'AU',
		(() => new Promise<Response>((r) => (finish = r))) as typeof fetch,
		NOW
	);
	wipeAllData();
	finish(response());
	await expect(pending).rejects.toThrow('canceled');
	expect(db.select().from(weatherLocations).all()).toEqual([]);
	expect(db.select().from(weatherPlaceOverrides).all()).toEqual([]);
	expect(db.select().from(weatherPlaceSearches).all()).toEqual([]);
});

it('does not show recent weather source labels until weather is cached', () => {
	upsertAscents([
		{
			provider: 'thecrag',
			externalId: 'ordinary',
			ascentDate: '2025-01-01',
			isSend: true,
			isAttempt: false,
			route: { provider: 'thecrag', externalId: 'ordinary-route', name: 'Ordinary', lat: 1, lon: 2 }
		}
	]);
	expect(getDashboardStats().recent[0].weatherLocation).toBeNull();
});
