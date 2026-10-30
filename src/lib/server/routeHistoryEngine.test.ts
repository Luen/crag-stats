/**
 * Offline tests for the route-history import (#68 / #74): fake client, fake clock, in-memory DB.
 * Nothing here talks to theCrag.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { wipeAllData } from './analytics';
import { db } from './db';
import { eq } from 'drizzle-orm';
import {
	ascents,
	profiles,
	routeHistory,
	routeHistoryFetches,
	routeHistoryImportState,
	routes
} from './db/schema';
import { buildRouteDeveloperImpact } from './routeDeveloperImpact';
import { getFirstAscentMarks, setFirstAscent } from './firstAscents';
import { upsertAscents } from './ingest';
import type { CanonicalAscent } from './providers/types';
import {
	RouteHistoryBlockedError,
	type RouteWithHistory
} from './providers/thecrag/routeHistoryApi';
import {
	BATCH_SIZE,
	MIN_REQUEST_GAP_MS,
	MIN_RUN_INTERVAL_MS,
	ROUTES_PER_RUN,
	parseRouteDataRefreshDays,
	pendingRouteIds,
	applyCachedHistoryMarks,
	resetRouteHistoryFetches,
	resetRouteHistoryPacing,
	routeHistoryStatus,
	runRouteHistoryImportOnce,
	type RouteHistoryDeps
} from './routeHistoryEngine';

const ROUTES = 105;
const LOGIN = 'tester';
const config = { enabled: true, apiKey: randomBytes(24).toString('hex') };

function routeId(i: number) {
	return String(5000 + i);
}

/** 105 routes, one ascent each, plus the owner's profile (synthetic data only). */
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
						.map((id) => ({
							id,
							name: null,
							history: history[id] ?? [],
							rawJson: JSON.stringify({ id, history: history[id] ?? [] })
						}));
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
	it('exposes the real retry deadline for short cooldowns and longer back-off', () => {
		const now = Date.parse('2026-01-01T00:00:00Z');
		expect(routeHistoryStatus(config, now).retryAt).toBe(0);
		db.insert(routeHistoryImportState)
			.values({
				provider: 'thecrag',
				lastRunAt: new Date(now).toISOString(),
				updatedAt: new Date(now).toISOString()
			})
			.run();
		expect(routeHistoryStatus(config, now).retryAt).toBe(now + MIN_RUN_INTERVAL_MS);
		const later = now + 86_400_000;
		db.update(routeHistoryImportState)
			.set({ nextAllowedAt: new Date(later).toISOString() })
			.run();
		expect(routeHistoryStatus(config, now).retryAt).toBe(later);
	});
	it('refuses a configured owner that differs from the saved logbook account', async () => {
		const h = harness({ [routeId(0)]: fa(routeId(0), '@different-owner') });
		const result = await runRouteHistoryImportOnce(
			{ ...config, ownerLogin: 'different-owner' },
			h.deps
		);
		expect(result.outcome).toBe('no-login');
		expect(h.sessions().opened).toBe(0);
		expect(getFirstAscentMarks().size).toBe(0);
	});

	it('refuses cached mark reapplication for another configured account', async () => {
		const h = harness({ [routeId(0)]: fa(routeId(0), '@different-owner') });
		await runRouteHistoryImportOnce(config, h.deps);
		expect(applyCachedHistoryMarks({}, 'different-owner').marked).toBe(0);
		expect(getFirstAscentMarks().size).toBe(0);
	});

	it('matches a configured login case-insensitively for imports and cached marks', async () => {
		const h = harness({ [routeId(0)]: fa(routeId(0), `@${LOGIN}`) });
		const result = await runRouteHistoryImportOnce(
			{ ...config, ownerLogin: ` ${LOGIN.toUpperCase()} ` },
			h.deps
		);
		expect(result.marked).toBe(1);
		setFirstAscent('thecrag', routeId(0), null, { recordSkip: false });
		expect(applyCachedHistoryMarks({}, LOGIN.toUpperCase()).marked).toBe(1);
	});

	it('does not fall back to the saved account when a CSV login is empty', async () => {
		const h = harness();
		expect((await runRouteHistoryImportOnce({ ...config, ownerLogin: '' }, h.deps)).outcome).toBe(
			'no-login'
		);
		expect(h.sessions().opened).toBe(0);
		expect(applyCachedHistoryMarks({}, '').routes).toBe(0);
	});

	it.each([
		['', 0],
		['0', 0],
		['30', 30],
		[' 90 ', 90],
		['180', 180],
		['365', 365],
		['3650', 3650],
		['3651', 0],
		['999999999', 0],
		['29', 0],
		['7', 0],
		['30.5', 0],
		['1e2', 0],
		['0x1e', 0],
		['NaN', 0],
		['-30', 0]
	])('parses refresh days %j as %i', (value, expected) => {
		expect(parseRouteDataRefreshDays(String(value))).toBe(expected);
	});

	it.each([30, 90, 180])('queues fetches at the %i-day boundary, oldest first', (days) => {
		const now = Date.parse('2026-06-01T00:00:00Z');
		const cutoff = now - days * 86_400_000;
		db.insert(routeHistoryFetches)
			.values(
				Array.from({ length: ROUTES }, (_, i) => ({
					provider: 'thecrag',
					routeExternalId: routeId(i),
					status: i === 1 ? 'missing' : 'ok',
					historyCount: 0,
					fetchedAt: new Date(i === 0 ? cutoff : i === 1 ? cutoff - 1 : cutoff + 1).toISOString()
				}))
			)
			.run();
		expect(pendingRouteIds(ROUTES_PER_RUN, days, now)).toEqual([routeId(1), routeId(0)]);
		expect(routeHistoryStatus({ ...config, refreshDays: days }, now).pendingRoutes).toBe(2);
		expect(routeHistoryStatus({ ...config, refreshDays: days }, now).refreshDays).toBe(days);
		expect(pendingRouteIds(ROUTES_PER_RUN, 0, now)).toEqual([]);
	});

	it('prioritizes unfetched routes and rotates stale routes within the shared run limit', async () => {
		const h = harness();
		await runRouteHistoryImportOnce(config, h.deps);
		const initial = h.calls.flatMap((c) => c.ids);
		h.advance(91 * 86_400_000);
		const start = h.calls.length;
		const refreshing = { ...config, refreshDays: 90 as const };
		expect(routeHistoryStatus(refreshing, h.deps.now()).pendingRoutes).toBe(ROUTES);
		const result = await runRouteHistoryImportOnce(refreshing, h.deps);
		const refreshed = h.calls.slice(start).flatMap((c) => c.ids);
		expect(result.fetched).toBe(ROUTES_PER_RUN);
		expect(refreshed.slice(0, ROUTES - ROUTES_PER_RUN).every((id) => !initial.includes(id))).toBe(
			true
		);
		expect(new Set(refreshed).size).toBe(ROUTES_PER_RUN);
		expect(routeHistoryStatus(refreshing, h.deps.now()).pendingRoutes).toBe(5);
		h.advance(MIN_RUN_INTERVAL_MS);
		expect((await runRouteHistoryImportOnce(refreshing, h.deps)).fetched).toBe(5);
		h.advance(MIN_RUN_INTERVAL_MS);
		expect((await runRouteHistoryImportOnce(refreshing, h.deps)).outcome).toBe('done');
		for (let i = 1; i < h.calls.length; i++) {
			expect(h.calls[i].at - h.calls[i - 1].at).toBeGreaterThanOrEqual(MIN_REQUEST_GAP_MS);
		}
	});

	it('refreshes totals and matching owner snapshots, preserving manual marks and unmarks', async () => {
		const id = routeId(0);
		const h = harness({ [id]: fa(id, `@${LOGIN}`), [routeId(27)]: fa(routeId(27), `@${LOGIN}`) });
		let total: number | null = 12;
		const open = h.deps.openClient;
		h.deps.openClient = async (key) => {
			const client = await open(key);
			return {
				...client,
				fetchRoutes: async (ids) =>
					(await client.fetchRoutes(ids)).map((r) => ({
						...r,
						info: { ascentCount: total }
					}))
			};
		};
		setFirstAscent('thecrag', id, 'FFA');
		setFirstAscent('thecrag', routeId(27), 'FA');
		setFirstAscent('thecrag', routeId(27), null);
		const refreshing = { ...config, refreshDays: 30 as const };
		await runRouteHistoryImportOnce(refreshing, h.deps);
		const before = db.select().from(routes).where(eq(routes.externalId, id)).get()!;
		db.delete(ascents).where(eq(ascents.externalId, '9000')).run();
		total = 18;
		h.advance(31 * 86_400_000);
		await runRouteHistoryImportOnce(refreshing, h.deps);
		const after = db.select().from(routes).where(eq(routes.externalId, id)).get()!;
		expect([after.ascentCount, after.ascentCountOwn]).toEqual([18, 0]);
		expect(after.ascentCountFetchedAt).not.toBe(before.ascentCountFetchedAt);
		expect(getFirstAscentMarks().get(`thecrag:${id}`)).toBe('FFA');
		expect(getFirstAscentMarks().has(`thecrag:${routeId(27)}`)).toBe(false);
		total = null;
		h.advance(31 * 86_400_000);
		await runRouteHistoryImportOnce(refreshing, h.deps);
		const cleared = db.select().from(routes).where(eq(routes.externalId, id)).get()!;
		expect([cleared.ascentCount, cleared.ascentCountOwn, cleared.ascentCountFetchedAt]).toEqual([
			null,
			null,
			null
		]);
	});

	it('retains disabled and block back-off guards when stale routes are eligible', async () => {
		const h = harness();
		await runRouteHistoryImportOnce(config, h.deps);
		h.advance(MIN_RUN_INTERVAL_MS);
		await runRouteHistoryImportOnce(config, h.deps);
		h.advance(91 * 86_400_000);
		const refreshing = { ...config, refreshDays: 90 as const };
		const start = h.calls.length;
		expect(
			(await runRouteHistoryImportOnce({ ...refreshing, enabled: false }, h.deps)).outcome
		).toBe('disabled');
		expect(h.calls).toHaveLength(start);
		h.failWith(new RouteHistoryBlockedError('blocked', 3 * 86_400));
		expect((await runRouteHistoryImportOnce(refreshing, h.deps)).outcome).toBe('blocked');
		h.advance(2 * 86_400_000);
		expect((await runRouteHistoryImportOnce(refreshing, h.deps)).outcome).toBe('waiting');
		expect(h.calls).toHaveLength(start + 1);
		expect(routeHistoryStatus(refreshing, h.deps.now()).pendingRoutes).toBe(ROUTES);
	});

	it('does nothing at all when disabled', async () => {
		const h = harness();
		const r = await runRouteHistoryImportOnce({ ...config, enabled: false }, h.deps);
		expect(r.outcome).toBe('disabled');
		expect(h.sessions().opened).toBe(0);
		expect(h.calls).toHaveLength(0);
	});

	it('checks at most 100 routes per run, one session, ≥1 s between requests', async () => {
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
		h.advance(91 * 86_400_000); // Unset refresh stays fetch-once even after three months.
		const third = await runRouteHistoryImportOnce(config, h.deps);
		expect(third.outcome).toBe('done');
		// 100 routes in 10 requests, then the last 5 in 1: no new request on the third run.
		expect(h.calls).toHaveLength(Math.ceil(ROUTES_PER_RUN / BATCH_SIZE) + 1);
		expect(h.sessions().opened).toBe(2); // and no session opened for the no-op run

		const s = routeHistoryStatus(config);
		expect([s.fetchedRoutes, s.pendingRoutes]).toEqual([ROUTES, 0]);
	});

	it('caches route info fields on successful fetch', async () => {
		const id = routeId(0);
		const histSource = {
			id: `h${id}`,
			type: 'First Ascent',
			climbers: `@${LOGIN}`,
			date: '2019-01-01',
			extraHistoryField: 'keep-me'
		};
		const hist = [
			{
				id: histSource.id,
				type: histSource.type,
				climbers: histSource.climbers,
				date: histSource.date,
				rawJson: JSON.stringify(histSource)
			}
		];
		let t = Date.parse('2026-01-01T00:00:00Z');
		const deps: RouteHistoryDeps = {
			now: () => t,
			sleep: async (ms) => {
				t += ms;
			},
			openClient: async () => ({
				fetchRoutes: async (ids) =>
					ids.map((rid) => ({
						id: rid,
						name: null,
						history: rid === id ? hist : [],
						rawJson:
							rid === id
								? JSON.stringify({
										id: rid,
										name: 'Cached Line',
										undocumentedFutureField: 42,
										flags: ['Project'],
										qualityScore: 90,
										ascentCount: 5,
										history: [histSource]
									})
								: JSON.stringify({ id: rid, history: [] }),
						info:
							rid === id
								? {
										isProject: 1 as const,
										qualityScore: 90,
										ascentCount: 5,
										flagsJson: '["Project"]'
									}
								: undefined
					})),
				close: async () => undefined
			})
		};
		await runRouteHistoryImportOnce(config, deps);
		const row = db.select().from(routes).where(eq(routes.externalId, id)).get();
		expect(row?.isProject).toBe(1);
		expect(row?.qualityScore).toBe(90);
		expect(row?.ascentCount).toBe(5);
		expect(row?.ascentCountOwn).toBe(1);
		expect(row?.ascentCountFetchedAt).toBeTruthy();
		expect(row?.routeInfoUpdatedAt).toBeTruthy();
		expect(JSON.parse(row?.routeApiJson ?? '{}')).toMatchObject({
			id,
			undocumentedFutureField: 42,
			qualityScore: 90
		});
		const histRow = db
			.select()
			.from(routeHistory)
			.where(eq(routeHistory.routeExternalId, id))
			.get();
		expect(JSON.parse(histRow?.rawJson ?? '{}')).toEqual(histSource);
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

		// Two runs cover all 105 routes (100, then 5).
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

	it('refresh-all makes routes eligible again, still 100 per run', async () => {
		const h = harness();
		await runRouteHistoryImportOnce(config, h.deps);
		expect(resetRouteHistoryFetches()).toBe(ROUTES_PER_RUN);
		h.advance(MIN_RUN_INTERVAL_MS);
		const r = await runRouteHistoryImportOnce(config, h.deps);
		expect(r.fetched).toBe(ROUTES_PER_RUN);
	});

	it('refresh replaces cached history so upstream deletions disappear', async () => {
		const history: Record<string, RouteWithHistory['history']> = {
			[routeId(0)]: [
				{ id: 'h-fa', type: 'First Ascent', climbers: `@${LOGIN}`, date: '2019-01-01' },
				{ id: 'h-ffa', type: 'First Free Ascent', climbers: `@${LOGIN}`, date: '2020-01-01' }
			]
		};
		const h = harness(history);
		await runRouteHistoryImportOnce(config, h.deps);
		expect(getFirstAscentMarks().get(`thecrag:${routeId(0)}`)).toBe('FFA');
		expect(
			db
				.select()
				.from(routeHistory)
				.all()
				.filter((r) => r.routeExternalId === routeId(0))
		).toHaveLength(2);

		// Upstream deletes the FFA entry; Refresh all then re-fetch.
		history[routeId(0)] = [
			{ id: 'h-fa', type: 'First Ascent', climbers: `@${LOGIN}`, date: '2019-01-01' }
		];
		resetRouteHistoryFetches();
		h.advance(MIN_RUN_INTERVAL_MS);
		await runRouteHistoryImportOnce(config, h.deps);

		const cached = db
			.select()
			.from(routeHistory)
			.all()
			.filter((r) => r.routeExternalId === routeId(0));
		expect(cached.map((r) => r.historyExternalId)).toEqual(['h-fa']);

		// Without replace, the stale FFA mark would stick; with replace, FA wins.
		expect(applyCachedHistoryMarks({ replaceExisting: true }).marked).toBe(1);
		expect(getFirstAscentMarks().get(`thecrag:${routeId(0)}`)).toBe('FA');
	});

	it('re-apply with replace clears imported marks when history no longer credits the owner', async () => {
		// route 0 (ungraded) + route 27 are both in the first run of 100.
		const emptyId = routeId(0);
		const correctedId = routeId(27);
		const history: Record<string, RouteWithHistory['history']> = {
			[emptyId]: fa(emptyId, `@${LOGIN}`),
			[correctedId]: fa(correctedId, `@${LOGIN}`)
		};
		const h = harness(history);
		await runRouteHistoryImportOnce(config, h.deps);
		expect(getFirstAscentMarks().get(`thecrag:${emptyId}`)).toBe('FA');
		expect(getFirstAscentMarks().get(`thecrag:${correctedId}`)).toBe('FA');

		// Upstream: emptyId loses its only history entry; correctedId credits someone else.
		history[emptyId] = [];
		history[correctedId] = fa(correctedId, '@someoneelse');
		resetRouteHistoryFetches();
		h.advance(MIN_RUN_INTERVAL_MS);
		await runRouteHistoryImportOnce(config, h.deps);

		// Without replace, imported marks stick; with replace, both imported credits are removed.
		expect(applyCachedHistoryMarks({}).marked).toBe(0);
		expect(getFirstAscentMarks().has(`thecrag:${emptyId}`)).toBe(true);
		expect(applyCachedHistoryMarks({ replaceExisting: true }).marked).toBe(2);
		expect(getFirstAscentMarks().has(`thecrag:${emptyId}`)).toBe(false);
		expect(getFirstAscentMarks().has(`thecrag:${correctedId}`)).toBe(false);

		// Manual marks are preserved even when history no longer credits the owner.
		setFirstAscent('thecrag', emptyId, 'FA', { source: 'manual' });
		expect(applyCachedHistoryMarks({ replaceExisting: true }).marked).toBe(0);
		expect(getFirstAscentMarks().get(`thecrag:${emptyId}`)).toBe('FA');
	});

	it('is cleared by Settings → Wipe', async () => {
		const h = harness({ [routeId(0)]: fa(routeId(0), `@${LOGIN}`) });
		await runRouteHistoryImportOnce(config, h.deps);
		wipeAllData();
		const s = routeHistoryStatus(config);
		expect([s.totalRoutes, s.fetchedRoutes, s.historyRows, s.importedMarks]).toEqual([0, 0, 0, 0]);
	});

	it('does not recreate history after Wipe mid-request', async () => {
		let release!: (rows: RouteWithHistory[]) => void;
		const gate = new Promise<RouteWithHistory[]>((resolve) => {
			release = resolve;
		});
		let fetchStarted!: () => void;
		const fetchStartedP = new Promise<void>((resolve) => {
			fetchStarted = resolve;
		});
		let t = Date.parse('2026-01-01T00:00:00Z');
		const deps: RouteHistoryDeps = {
			now: () => t,
			sleep: async (ms) => {
				t += ms;
			},
			openClient: async () => ({
				fetchRoutes: async (ids) => {
					fetchStarted();
					t += 200;
					const rows = await gate;
					return rows.filter((r) => ids.includes(r.id));
				},
				close: async () => undefined
			})
		};

		const run = runRouteHistoryImportOnce(config, deps);
		await fetchStartedP;

		wipeAllData();
		release([
			{
				id: routeId(0),
				name: null,
				history: fa(routeId(0), `@${LOGIN}`)
			}
		]);

		const r = await run;
		expect(r.outcome).toBe('cancelled');
		const s = routeHistoryStatus(config);
		expect([s.totalRoutes, s.historyRows, s.importedMarks, s.fetchedRoutes]).toEqual([0, 0, 0, 0]);
	});
});

it('refresh clears explicit nulls but preserves omitted route fields (#128)', async () => {
	const h = harness();
	let info: RouteWithHistory['info'] = {
		betaJson: '{"description":"old public beta"}',
		qualityScore: 88,
		ascentCount: 12
	};
	const open = h.deps.openClient;
	h.deps.openClient = async (key) => {
		const client = await open(key);
		return {
			...client,
			fetchRoutes: async (ids) => (await client.fetchRoutes(ids)).map((row) => ({ ...row, info }))
		};
	};
	await runRouteHistoryImportOnce(config, h.deps);
	const initialCountFetch = db
		.select()
		.from(routes)
		.where(eq(routes.externalId, routeId(0)))
		.get()!.ascentCountFetchedAt;
	setFirstAscent('thecrag', routeId(0), 'FA');
	expect(buildRouteDeveloperImpact().communityAscents).toBe(11);
	// Delete an owner tick after the fetch: the cached community estimate stays fixed.
	db.delete(ascents).where(eq(ascents.externalId, '9000')).run();
	expect(buildRouteDeveloperImpact().communityAscents).toBe(11);
	info = { qualityScore: 91 };
	resetRouteHistoryFetches();
	h.advance(MIN_RUN_INTERVAL_MS);
	await runRouteHistoryImportOnce(config, h.deps);
	const afterUnrelated = db
		.select()
		.from(routes)
		.where(eq(routes.externalId, routeId(0)))
		.get()!;
	expect(afterUnrelated.qualityScore).toBe(91);
	expect(afterUnrelated.ascentCountOwn).toBe(1);
	// Unrelated route-info refresh must not move counter freshness (#147).
	expect(afterUnrelated.ascentCountFetchedAt).toBe(initialCountFetch);
	const fetchedBefore = afterUnrelated.ascentCountFetchedAt;
	// A replacement total captures the new owner count, even when it is zero.
	info = { ascentCount: 13 };
	resetRouteHistoryFetches();
	h.advance(MIN_RUN_INTERVAL_MS);
	await runRouteHistoryImportOnce(config, h.deps);
	expect(buildRouteDeveloperImpact().communityAscents).toBe(13);
	const afterCount = db
		.select()
		.from(routes)
		.where(eq(routes.externalId, routeId(0)))
		.get()!;
	expect(afterCount.ascentCountOwn).toBe(0);
	expect(afterCount.ascentCountFetchedAt).toBeTruthy();
	expect(afterCount.ascentCountFetchedAt).not.toBe(fetchedBefore);
	info = { betaJson: null, qualityScore: null, ascentCount: null };
	resetRouteHistoryFetches();
	h.advance(MIN_RUN_INTERVAL_MS);
	await runRouteHistoryImportOnce(config, h.deps);
	const row = db
		.select()
		.from(routes)
		.where(eq(routes.externalId, routeId(0)))
		.get()!;
	expect(row.betaJson).toBeNull();
	expect(row.qualityScore).toBeNull();
	expect(row.ascentCount).toBeNull();
	expect(row.ascentCountOwn).toBeNull();
	expect(row.ascentCountFetchedAt).toBeNull();
});
