import { beforeEach, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { wipeAllData, listLogbook } from './analytics';
import { db } from './db';
import {
	profiles,
	routes,
	weatherAreaCache,
	routeHistoryFetches,
	weatherPlaceOverrides
} from './db/schema';
import { upsertAscents } from './ingest';
import { mapTheCragCsvRow } from './providers/thecrag/csv';
import {
	readRouteResponse,
	RouteHistoryBlockedError,
	type RouteWithHistory
} from './providers/thecrag/routeHistoryApi';
import fixture from './providers/thecrag/fixtures/area-ancestors.synthetic.json';
import areaLocationFixture from './providers/thecrag/fixtures/area-location.sanitized.json';
import { routeAreas } from './providers/thecrag/areaAncestors';
import {
	loadWeatherLocations,
	resolveWeatherLocation,
	listWeatherLocationGroups
} from './weatherLocations';
import { clearWeatherPlace } from './weatherLocations';
import { listPendingWeatherDays } from './weatherEngine';
import { pendingWeatherAreaIds, storeWeatherAreas } from './weatherAreaCache';
import {
	runRouteHistoryImportOnce,
	resetRouteHistoryPacing,
	routeHistoryStatus,
	MIN_RUN_INTERVAL_MS,
	MIN_REQUEST_GAP_MS,
	resetRouteHistoryFetches
} from './routeHistoryEngine';

const config = {
	enabled: true,
	weatherEnabled: true,
	apiKey: 'synthetic-area-test-key',
	ownerLogin: 'csv-owner'
};
const initial = Date.parse('2026-01-01T00:00:00Z');
beforeEach(() => {
	wipeAllData();
	resetRouteHistoryPacing();
});

function seed(count = 2) {
	upsertAscents(
		Array.from({ length: count }, (_, i) =>
			mapTheCragCsvRow({
				'Ascent ID': String(8000 + i),
				'Route ID': String(9001 + i),
				'Route Name': `Synthetic route ${i}`,
				'Ascent Date': '2025-01-01',
				'Ascent Type': 'Red point',
				'Route Gear Style': 'Sport',
				'Route Grade': '20',
				'Crag Name': 'Synthetic crag'
			})!
		)
	);
	db.insert(profiles).values({ provider: 'thecrag', login: 'csv-owner', updatedAt: 'now' }).run();
}

function harness() {
	let t = initial;
	const calls: { kind: string; at: number; ids: readonly string[] }[] = [];
	const area = vi.fn(async (ids: readonly string[]) =>
		readRouteResponse({
			status: 200,
			text: JSON.stringify({
				data: ids.map((id) => ({ ...areaLocationFixture, id }))
			})
		})
	);
	const close = vi.fn(async () => {});
	const fetchRoutes = vi.fn(async (ids: readonly string[]) => {
		calls.push({ kind: 'route', at: t, ids });
		return readRouteResponse({
			status: 200,
			text: JSON.stringify({ data: ids.map((id) => ({ ...fixture, id })) })
		});
	});
	return {
		calls,
		area,
		close,
		fetchRoutes,
		advance: (ms: number) => {
			t += ms;
		},
		deps: {
			now: () => t,
			sleep: async (ms: number) => {
				t += ms;
			},
			openClient: async () => ({
				fetchRoutes,
				fetchAreas: async (ids: readonly string[]) => {
					calls.push({ kind: 'area', at: t, ids });
					return area(ids);
				},
				close
			})
		}
	};
}

it('normalizes the observed array shape by isTLC and parentID, never array position or name', () => {
	expect(routeAreas(fixture)).toMatchObject({ TLC: { id: '200' }, parent: { id: 300 } });
	expect(routeAreas({ ...fixture, ancestors: [...fixture.ancestors].reverse() })).toEqual(
		routeAreas(fixture)
	);
	expect(
		routeAreas({
			...fixture,
			parentID: '100',
			ancestors: fixture.ancestors.map((a) => ({ ...a, isTLC: 0 }))
		})
	).toEqual({ TLC: null, parent: null });
	expect(resolveWeatherLocation(fixture, 'now')).toBeNull();
	const geometry = new Map([['200', { geometry: [150.3, -33.6] }]]);
	expect(resolveWeatherLocation(fixture, 'now', geometry)).toMatchObject({
		source: 'crag',
		areaId: '200',
		lat: -33.6
	});
	expect(resolveWeatherLocation({ ...fixture, lat: 0, lon: 0 }, 'now', geometry)).toMatchObject({
		source: 'route',
		lat: 0,
		lon: 0
	});
});

it('reads the observed area geometry envelope without guessing from its boundary or centre arrays', () => {
	const route = (geometry: unknown) => ({
		ancestors: { TLC: { ...areaLocationFixture, geometry } }
	});
	expect(resolveWeatherLocation(route(areaLocationFixture.geometry), 'now')).toMatchObject({
		source: 'crag',
		lat: -33.6,
		lon: 150.3
	});
	expect(resolveWeatherLocation(route({ lat: 0, long: 0 }), 'now')).toMatchObject({
		lat: 0,
		lon: 0
	});
	for (const geometry of [
		{
			center: [150.3, -33.6],
			point: ['150.3', '-33.6'],
			boundary: areaLocationFixture.geometry.boundary
		},
		{ lat: '', long: 150.3 },
		{ lat: [], long: [] },
		{ lat: 91, long: 150.3 },
		{ type: 'Polygon', lat: -33.6, long: 150.3 }
	])
		expect(resolveWeatherLocation(route(geometry), 'now')).toBeNull();
});

it('enriches CSV routes into one shared weather day without changing route coords or logbook identity', async () => {
	seed();
	const h = harness();
	const run = await runRouteHistoryImportOnce(config, h.deps);
	expect(run).toMatchObject({ outcome: 'ran', fetched: 2, requests: 2 });
	expect(h.area).toHaveBeenCalledExactlyOnceWith(['200', '300']);
	expect(h.calls[1].at - h.calls[0].at).toBeGreaterThanOrEqual(MIN_REQUEST_GAP_MS);
	expect(listPendingWeatherDays(50, initial)).toEqual([
		{ latKey: -33.6, lonKey: 150.3, day: '2025-01-01' }
	]);
	expect(listWeatherLocationGroups()).toMatchObject([
		{ routes: 2, unresolved: 0, key: JSON.stringify(['thecrag', 'area', '200']) }
	]);
	expect(
		db
			.select()
			.from(routes)
			.all()
			.every((r) => r.lat == null && r.lon == null)
	).toBe(true);
	expect(db.select().from(profiles).get()?.login).toBe('csv-owner');
	expect(JSON.stringify(listLogbook())).not.toContain('routeApiJson');
	h.advance(MIN_RUN_INTERVAL_MS);
	expect((await runRouteHistoryImportOnce(config, h.deps)).outcome).toBe('done');
	expect(h.area).toHaveBeenCalledTimes(1);
});

it('backfills already checked route caches after upgrading, invalidating unresolved location results', async () => {
	seed();
	const h = harness();
	await runRouteHistoryImportOnce({ ...config, weatherEnabled: false }, h.deps);
	expect(loadWeatherLocations().values().next().value).toBeNull();
	expect(h.area).not.toHaveBeenCalled();
	expect(routeHistoryStatus(config, initial).pendingAreas).toBe(2);
	h.advance(MIN_RUN_INTERVAL_MS);
	expect(await runRouteHistoryImportOnce(config, h.deps)).toMatchObject({
		fetched: 0,
		requests: 1,
		outcome: 'ran'
	});
	expect(h.fetchRoutes).toHaveBeenCalledTimes(1);
	expect(loadWeatherLocations().values().next().value).toMatchObject({ source: 'crag' });
	expect(routeHistoryStatus(config, initial).pendingAreas).toBe(0);
	// An upstream deletion invalidates the location too; absent geometry is not sticky.
	storeWeatherAreas(['200', '300'], [], new Date(initial).toISOString());
	expect(loadWeatherLocations().values().next().value).toBeNull();
});

it('caches empty answers, refreshes only when due, and excludes indoor/region candidates', async () => {
	seed();
	const h = harness();
	h.area.mockImplementation(async () => []);
	await runRouteHistoryImportOnce(config, h.deps);
	expect(pendingWeatherAreaIds(100, 0, initial + 365 * 86400000)).toEqual([]);
	expect(pendingWeatherAreaIds(100, 30, initial + 31 * 86400000)).toEqual(['200', '300']);
	resetRouteHistoryFetches();
	expect(pendingWeatherAreaIds(100)).toEqual(['200', '300']);
	db.update(routes).set({ gearStyle: 'Indoor' }).run();
	expect(pendingWeatherAreaIds(100)).toEqual([]);
	wipeAllData();
	expect(db.select().from(weatherAreaCache).all()).toEqual([]);
});

it('keeps the ten-request budget and defers area work when route requests use it', async () => {
	seed(100);
	const h = harness();
	const run = await runRouteHistoryImportOnce(config, h.deps);
	expect(run.requests).toBe(10);
	expect(h.area).not.toHaveBeenCalled();
	h.advance(MIN_RUN_INTERVAL_MS);
	expect((await runRouteHistoryImportOnce(config, h.deps)).requests).toBe(1);
	expect(h.fetchRoutes).toHaveBeenCalledTimes(10);
});

it('stops and backs off on area refusal without discarding successful route history', async () => {
	seed();
	const h = harness();
	h.area.mockRejectedValue(new RouteHistoryBlockedError('Synthetic refusal', 172800));
	expect(await runRouteHistoryImportOnce(config, h.deps)).toMatchObject({
		outcome: 'blocked',
		fetched: 2,
		requests: 2
	});
	expect(db.select().from(routeHistoryFetches).all()).toHaveLength(2);
	expect(db.select().from(weatherAreaCache).all()).toHaveLength(0);
	expect(routeHistoryStatus(config, initial).nextAllowedAt).toBe(
		new Date(initial + MIN_REQUEST_GAP_MS + 172800000).toISOString()
	);
	h.advance(MIN_RUN_INTERVAL_MS);
	expect((await runRouteHistoryImportOnce(config, h.deps)).outcome).toBe('waiting');
	expect(h.area).toHaveBeenCalledTimes(1);
	expect(h.close).toHaveBeenCalledTimes(1);
});

it('abandons area writes after wipe and requires the CSV owner to match', async () => {
	seed();
	const h = harness();
	expect(
		(await runRouteHistoryImportOnce({ ...config, ownerLogin: 'key-owner' }, h.deps)).outcome
	).toBe('no-login');
	expect(h.fetchRoutes).not.toHaveBeenCalled();
	let release!: (rows: RouteWithHistory[]) => void;
	let started!: () => void;
	const startedP = new Promise<void>((r) => {
		started = r;
	});
	h.area.mockImplementation(() => {
		started();
		return new Promise((r) => {
			release = r;
		});
	});
	const run = runRouteHistoryImportOnce(config, h.deps);
	await startedP;
	wipeAllData();
	release([
		{
			id: '200',
			name: null,
			history: [],
			rawJson: JSON.stringify({ id: 200, geometry: [150.3, -33.6] })
		}
	]);
	expect((await run).outcome).toBe('cancelled');
	expect(db.select().from(weatherAreaCache).all()).toHaveLength(0);
	expect(db.select().from(routes).all()).toHaveLength(0);
});

it('ignores unrelated and broad-area payloads instead of using them as crag points', () => {
	seed();
	db.update(routes)
		.set({ routeApiJson: JSON.stringify(fixture) })
		.run();
	storeWeatherAreas(
		['200'],
		[
			{
				id: '200',
				name: null,
				history: [],
				rawJson: JSON.stringify({ id: 200, type: 'area', subType: 'Region', geometry: [1, 2] })
			}
		],
		'now'
	);
	expect(loadWeatherLocations().values().next().value).toBeNull();
	storeWeatherAreas(
		['200'],
		[
			{ id: '200', name: null, history: [], rawJson: JSON.stringify({ id: 999, geometry: [1, 2] }) }
		],
		'now'
	);
	expect(loadWeatherLocations().values().next().value).toBeNull();
	db.update(routes)
		.set({
			routeApiJson: JSON.stringify({
				...fixture,
				ancestors: [{ id: 200, isTLC: 1, subType: 'Region', type: 'area', geometry: [1, 2] }]
			})
		})
		.where(eq(routes.externalId, '9001'))
		.run();
	expect(pendingWeatherAreaIds(100)).not.toContain('100');
});

it('preserves existing per-route CSV town choices when shared crag identities become available', () => {
	seed();
	const legacyKey = JSON.stringify(['thecrag', 'route', '9001']);
	db.insert(weatherPlaceOverrides)
		.values({
			areaKey: legacyKey,
			locationJson: JSON.stringify({
				lat: -30,
				lon: 150,
				source: 'place',
				name: 'Synthetic town',
				areaId: '50',
				precision: 'owner-confirmed settlement',
				resolvedAt: 'now'
			}),
			updatedAt: 'now'
		})
		.run();
	db.update(routes)
		.set({ routeApiJson: JSON.stringify(fixture) })
		.run();
	expect([...loadWeatherLocations().values()].filter((v) => v?.source === 'place')).toHaveLength(1);
	expect(listWeatherLocationGroups().map((g) => g.key)).toContain(legacyKey);
	clearWeatherPlace(legacyKey);
	expect(listWeatherLocationGroups()).toMatchObject([{ routes: 2, unresolved: 2 }]);
});
