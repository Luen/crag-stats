import { createHash } from 'node:crypto';
import { beforeEach, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './db';
import {
	routes,
	ascents,
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
it('prefers route, then crag, then sector points; rejects country and invalid geometry', () => {
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
		source: 'crag',
		lat: 50,
		lon: 40
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

it('prefers an enriched route point over a logbook crag point across every weather surface', () => {
	const ascent = raw();
	Object.assign(ascent.route.ancestors.TLC, { geometry: [150.3, -33.6] });
	upsertAscents([mapAscent(ascent)!]);
	db.update(routes)
		.set({ routeApiJson: JSON.stringify({ id: 101, lat: -34.2, lon: 151.1 }) })
		.run();
	expect([...loadWeatherLocations().values()][0]).toMatchObject({
		source: 'route',
		lat: -34.2,
		lon: 151.1
	});
	expect(listPendingWeatherDays(50, NOW)).toEqual([
		{ latKey: -34.2, lonKey: 151.1, day: '2025-01-01' }
	]);
	db.insert(weatherDays)
		.values({
			latKey: -34.2,
			lonKey: 151.1,
			day: '2025-01-01',
			tempMaxC: 38,
			status: 'ok',
			fetchedAt: 'now'
		})
		.run();
	expect(listLogbook({ weather: 'heat' }).total).toBe(1);
	expect(getDashboardStats().weatherConditions?.withWeather).toBe(1);
});

// Explicit synthetic GeoJSON; no claim that this is a captured provider payload.
const areaPolygon = {
	type: 'Polygon',
	coordinates: [
		[
			[150.29, -33.61],
			[150.31, -33.61],
			[150.31, -33.59],
			[150.29, -33.59],
			[150.29, -33.61]
		]
	]
};
it('uses typed area polygons only after all points and excludes broad/unknown geometry', () => {
	const crag = { id: 30, name: 'Polygon crag', geometry: areaPolygon };
	const area = { ancestors: { TLC: crag } };
	expect(resolveWeatherLocation(area, 'now')).toMatchObject({
		source: 'polygon',
		areaId: '30',
		lat: -33.61,
		lon: 150.29
	});
	expect(
		resolveWeatherLocation(
			{ ...area, ancestors: { ...area.ancestors, parent: { id: 31, geometry: [151, -34] } } },
			'now'
		)
	).toMatchObject({ source: 'sector', lat: -34 });
	for (const invalid of [
		{ ...crag, type: 'country' },
		{ ...crag, geometry: areaPolygon.coordinates },
		{ id: 30, Fence: areaPolygon },
		{ geometry: areaPolygon }
	])
		expect(resolveWeatherLocation({ ancestors: { TLC: invalid } }, 'now')).toBeNull();
	expect(
		resolveWeatherLocation({ ancestors: { TLC: crag, country: { id: 30 } } }, 'now')
	).toBeNull();
});
it('uses polygon weather throughout the shared pipeline without moving routes or awarding badges', () => {
	const ascent = raw();
	Object.assign(ascent.route.ancestors.TLC, { geometry: areaPolygon });
	upsertAscents([mapAscent(ascent)!]);
	const routeBefore = db.select().from(routes).get()!;
	expect(listPendingWeatherDays(50, NOW)).toEqual([
		{ latKey: -33.6, lonKey: 150.3, day: '2025-01-01' }
	]);
	db.insert(weatherDays)
		.values({
			latKey: -33.6,
			lonKey: 150.3,
			day: '2025-01-01',
			tempMaxC: 38,
			status: 'ok',
			fetchedAt: 'now'
		})
		.run();
	expect(listLogbook({ weather: 'heat' }).rows[0].weatherLocation).toMatchObject({
		source: 'polygon'
	});
	const stats = getDashboardStats();
	expect(stats.weatherConditions?.withWeather).toBe(1);
	expect(stats.heatmap[0].weather?.tempMaxC).toBe(38);
	expect(stats.badges.earned.some((b) => b.id === 'weather_heat')).toBe(false);
	expect(db.select().from(routes).get()).toEqual(routeBefore);
	// A route point in either cache beats a polygon from the other cache.
	db.update(routes)
		.set({ routeApiJson: JSON.stringify({ lat: -34, lon: 151 }) })
		.run();
	expect([...loadWeatherLocations().values()][0]).toMatchObject({ source: 'route', lat: -34 });
	expect(listLogbook({ weather: 'heat' }).total).toBe(0);
});
it('prefers a crag point over a sector point from the other payload', () => {
	const ascent = raw();
	Object.assign(ascent.route.ancestors, { parent: { id: 31, geometry: [151, -34] } });
	upsertAscents([mapAscent(ascent)!]);
	db.update(routes)
		.set({
			routeApiJson: JSON.stringify({ ancestors: { TLC: { id: 30, geometry: [150.3, -33.6] } } })
		})
		.run();
	expect([...loadWeatherLocations().values()][0]).toMatchObject({ source: 'crag', lat: -33.6 });
});

it('invalidates a pre-polygon cached unresolved location without changing provider data', () => {
	const ascent = raw();
	Object.assign(ascent.route.ancestors.TLC, { geometry: areaPolygon });
	upsertAscents([mapAscent(ascent)!]);
	const r = db.select().from(routes).get()!;
	// Signature used by the shipped v1 resolver, before the policy version prefix.
	const legacySignature = createHash('sha256')
		.update(
			JSON.stringify([
				r.updatedAt,
				r.name,
				r.gearStyle,
				r.tagsJson,
				r.cragName,
				r.areaExternalId,
				r.parentExternalId,
				r.lat,
				r.lon,
				r.routeApiJson,
				db.select().from(ascents).get()!.rawJson,
				undefined,
				undefined
			])
		)
		.digest('hex');
	db.insert(weatherLocations)
		.values({ routeId: r.id, signature: legacySignature, locationJson: null, resolvedAt: 'old' })
		.run();
	expect(loadWeatherLocations().get(r.id)?.source).toBe('polygon');
	expect(db.select().from(weatherLocations).get()?.signature).not.toBe(legacySignature);
});
