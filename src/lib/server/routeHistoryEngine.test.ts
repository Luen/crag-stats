/**
 * Offline tests for the route-history import (#68 / #74): fake client, fake clock, in-memory DB.
 * Nothing here talks to theCrag.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { profiles } from './db/schema';
import { getFirstAscentMarks, setFirstAscent } from './firstAscents';
import { upsertAscents } from './ingest';
import { wipeAllData } from './analytics';
import {
	RouteHistoryBlockedError,
	type RouteWithHistory
} from './providers/thecrag/routeHistoryApi';
import {
	BATCH_SIZE,
	MIN_REQUEST_GAP_MS,
	MIN_RUN_INTERVAL_MS,
	ROUTES_PER_RUN,
	applyCachedHistoryMarks,
	resetRouteHistoryFetches,
	resetRouteHistoryPacing,
	routeHistoryStatus,
	runRouteHistoryImportOnce,
	type RouteHistoryDeps
} from './routeHistoryEngine';
import type { CanonicalAscent } from './providers/types';

const ROUTES = 25;
const LOGIN = 'tester';
const config = { enabled: true, apiKey: 'test-key' };

function routeId(i: number) {
	return String(5000 + i);
}

/** 25 routes, one ascent each, plus the owner's profile (synthetic data only). */
function seed() {
	const ascents: CanonicalAscent[] = Array.from({ length: ROUTES }, (_, i) => ({
		provider: 'thecrag',
		externalId: String(9000 + i),
		route: {
			provider: 'thecrag',
			externalId: routeId(i),
			name: `Route ${i}`,
			gradeRaw: i === 0 ? null : '20',
			gradeScore: i === 0 ? null : 20,
			gearStyle: 'Sport'
		},
		ascentDate: `2025-01-${String((i % 28) + 1).padStart(2, '0')}`,
		tickType: 'Red point',
		isSend: true,
		isAttempt: false
	})) as CanonicalAscent[];
	upsertAscents(ascents);
	db.insert(profiles)
		.values({ provider: 'thecrag', login: LOGIN, updatedAt: new Date(0).toISOString() })
		.run();
}

/** Fake impers client + clock that record every request and sleep. */
function harness(history: Record<string, RouteWithHistory['history']> = {}) {
	let t = Date.parse('2026-01-01T00:00:00Z');
	const calls: { ids: string[]; at: number }[] = [];
	const sleeps: number[] = [];
	let opened = 0;
	let closed = 0;
	let fail: Error | null = null;
	const omit = new Set<string>();
	const deps: RouteHistoryDeps = {
		now: () => t,
		sleep: async (ms) => {
			sleeps.push(ms);
			t += ms;
		},
		openClient: async () => {
			opened += 1;
			return {
				fetchRoutes: async (ids) => {
					calls.push({ ids: [...ids], at: t });
					t += 200; // pretend the request took 200 ms
					if (fail) throw fail;
					return ids
						.filter((id) => !omit.has(id))
						.map((id) => ({ id, name: null, history: history[id] ?? [] }));
				},
				close: async () => {
					closed += 1;
				}
			};
		}
	};
	return {
		deps,
		calls,
		sleeps,
		omit,
		advance: (ms: number) => (t += ms),
		failWith: (e: Error | null) => (fail = e),
		sessions: () => ({ opened, closed })
	};
}

const fa = (id: string, climbers: string, type = 'First Ascent') => [
	{ id: `h${id}`, type, climbers, date: '2019-01-01' }
];

beforeEach(() => {
	wipeAllData();
	resetRouteHistoryPacing();
	seed();
});

describe('route history import', () => {
	it('does nothing at all when disabled', async () => {
		const h = harness();
		const r = await runRouteHistoryImportOnce({ ...config, enabled: false }, h.deps);
		expect(r.outcome).toBe('disabled');
		expect(h.sessions().opened).toBe(0);
		expect(h.calls).toHaveLength(0);
	});

	it('checks at most 20 routes per run, one session, ≥1 s between requests', async () => {
		const h = harness();
		const r = await runRouteHistoryImportOnce(config, h.deps);
		expect(r.outcome).toBe('ran');
		expect(r.fetched).toBe(ROUTES_PER_RUN);
		expect(h.calls).toHaveLength(ROUTES_PER_RUN / BATCH_SIZE);
		expect(h.calls.every((c) => c.ids.length <= BATCH_SIZE)).toBe(true);
		expect(h.sessions()).toEqual({ opened: 1, closed: 1 });
		for (let i = 1; i < h.calls.length; i++) {
			expect(h.calls[i].at - h.calls[i - 1].at).toBeGreaterThanOrEqual(MIN_REQUEST_GAP_MS);
		}
		// The ungraded route goes first: likeliest to be a new line.
		expect(h.calls[0].ids[0]).toBe(routeId(0));
	});

	it('never fetches a route twice, and stops asking once every route is checked', async () => {
		const h = harness();
		await runRouteHistoryImportOnce(config, h.deps);
		h.advance(MIN_RUN_INTERVAL_MS);
		const second = await runRouteHistoryImportOnce(config, h.deps);
		expect(second.fetched).toBe(ROUTES - ROUTES_PER_RUN);

		const all = h.calls.flatMap((c) => c.ids);
		expect(new Set(all).size).toBe(all.length);
		expect(all).toHaveLength(ROUTES);

		h.advance(MIN_RUN_INTERVAL_MS);
		const third = await runRouteHistoryImportOnce(config, h.deps);
		expect(third.outcome).toBe('done');
		// 20 routes in 2 requests, then the last 5 in 1: no new request on the third run.
		expect(h.calls).toHaveLength(Math.ceil(ROUTES_PER_RUN / BATCH_SIZE) + 1);
		expect(h.sessions().opened).toBe(2); // and no session opened for the no-op run

		const s = routeHistoryStatus(config);
		expect([s.fetchedRoutes, s.pendingRoutes]).toEqual([ROUTES, 0]);
	});

	it('records routes missing from the response so they are not retried every run', async () => {
		const h = harness();
		h.omit.add(routeId(0));
		await runRouteHistoryImportOnce(config, h.deps);
		h.advance(MIN_RUN_INTERVAL_MS);
		await runRouteHistoryImportOnce(config, h.deps);
		const asked = h.calls.flatMap((c) => c.ids).filter((id) => id === routeId(0));
		expect(asked).toHaveLength(1);
	});

	it('refuses a second run within a minute', async () => {
		const h = harness();
		await runRouteHistoryImportOnce(config, h.deps);
		const again = await runRouteHistoryImportOnce(config, h.deps);
		expect(again.outcome).toBe('waiting');
		expect(h.calls).toHaveLength(ROUTES_PER_RUN / BATCH_SIZE);
	});

	it('marks FA/FFA naming the owner, but keeps manual marks and unmarks', async () => {
		const h = harness({
			[routeId(0)]: fa(routeId(0), `@${LOGIN}`),
			[routeId(1)]: fa(routeId(1), `@someone & @${LOGIN}`, 'First Free Ascent'),
			[routeId(2)]: fa(routeId(2), 'Tester Person'), // free text: never matched
			[routeId(3)]: fa(routeId(3), `@${LOGIN}`),
			[routeId(4)]: fa(routeId(4), `@${LOGIN}`)
		});
		setFirstAscent('thecrag', routeId(3), 'FFA'); // manual mark
		setFirstAscent('thecrag', routeId(4), 'FA');
		setFirstAscent('thecrag', routeId(4), null); // manually unmarked → skip

		// Two runs cover all 25 routes (20, then 5).
		const first = await runRouteHistoryImportOnce(config, h.deps);
		h.advance(MIN_RUN_INTERVAL_MS);
		const second = await runRouteHistoryImportOnce(config, h.deps);
		expect(first.marked + second.marked).toBe(2);
		const marks = getFirstAscentMarks();
		expect(marks.get(`thecrag:${routeId(0)}`)).toBe('FA');
		expect(marks.get(`thecrag:${routeId(1)}`)).toBe('FFA');
		expect(marks.has(`thecrag:${routeId(2)}`)).toBe(false);
		expect(marks.get(`thecrag:${routeId(3)}`)).toBe('FFA'); // manual mark kept
		expect(marks.has(`thecrag:${routeId(4)}`)).toBe(false); // unmark respected

		// Re-applying from the cache needs no requests and honours the opt-ins.
		const before = h.calls.length;
		expect(applyCachedHistoryMarks({}).marked).toBe(0);
		expect(applyCachedHistoryMarks({ reapplyUnmarked: true, replaceExisting: true }).marked).toBe(
			2
		);
		expect(getFirstAscentMarks().get(`thecrag:${routeId(3)}`)).toBe('FA');
		expect(h.calls.length).toBe(before);
	});

	it('stops at the first block, backs off a day, and honours Retry-After', async () => {
		const h = harness();
		h.failWith(new RouteHistoryBlockedError('blocked', 3 * 86_400));
		const r = await runRouteHistoryImportOnce(config, h.deps);
		expect(r.outcome).toBe('blocked');
		expect(h.calls).toHaveLength(1); // no second request after the block
		expect(h.sessions()).toEqual({ opened: 1, closed: 1 });

		const s = routeHistoryStatus(config);
		expect(s.status).toBe('blocked');
		const until = Date.parse(s.nextAllowedAt!) - Date.parse('2026-01-01T00:00:00Z');
		expect(until).toBeGreaterThanOrEqual(3 * 86_400_000); // Retry-After beats the 1-day default

		h.failWith(null);
		h.advance(2 * 86_400_000);
		expect((await runRouteHistoryImportOnce(config, h.deps)).outcome).toBe('waiting');
		expect(h.calls).toHaveLength(1);
		h.advance(2 * 86_400_000);
		expect((await runRouteHistoryImportOnce(config, h.deps)).outcome).toBe('ran');
	});

	it('refresh-all makes routes eligible again, still 20 per run', async () => {
		const h = harness();
		await runRouteHistoryImportOnce(config, h.deps);
		expect(resetRouteHistoryFetches()).toBe(ROUTES_PER_RUN);
		h.advance(MIN_RUN_INTERVAL_MS);
		const r = await runRouteHistoryImportOnce(config, h.deps);
		expect(r.fetched).toBe(ROUTES_PER_RUN);
	});

	it('is cleared by Settings → Wipe', async () => {
		const h = harness({ [routeId(0)]: fa(routeId(0), `@${LOGIN}`) });
		await runRouteHistoryImportOnce(config, h.deps);
		wipeAllData();
		const s = routeHistoryStatus(config);
		expect([s.totalRoutes, s.fetchedRoutes, s.historyRows, s.importedMarks]).toEqual([0, 0, 0, 0]);
	});
});
