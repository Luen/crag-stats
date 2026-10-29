/**
 * Route-history import engine (#68), kept free of env and network imports so it can be tested
 * offline. `routeHistoryImport.ts` wires in the real config and impers client.
 *
 * Being gentle with theCrag is the point of the design:
 * - Routes are fetched once unless periodic refresh is explicitly enabled.
 * - At most `ROUTES_PER_RUN` routes per run, in batches, with ≥`MIN_REQUEST_GAP_MS` between
 *   any two requests (also across runs), and ≥`MIN_RUN_INTERVAL_MS` between runs.
 * - One client session per run. Any block, throttle or error stops the run immediately (no
 *   retries) and backs off, honouring Retry-After.
 */
import { and, eq, sql } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import {
	firstAscents,
	profiles,
	routeHistory,
	routeHistoryFetches,
	routeHistoryImportState,
	routes
} from './db/schema';
import { isFirstAscentImportSkipped, setFirstAscent, type FirstAscentKind } from './firstAscents';
import {
	RouteHistoryBlockedError,
	RouteHistoryUnavailableError,
	type RouteHistoryClient,
	type RouteInfoFields,
	type RouteWithHistory
} from './providers/thecrag/routeHistoryApi';
import {
	ownerKindsFromHistory,
	type RouteHistoryEntry
} from './providers/thecrag/routeHistoryParse';

const PROVIDER = 'thecrag';

/** Routes fetched per run (each sync, or each "Fetch next" click). */
export const ROUTES_PER_RUN = 100;
/** Routes per request: 100 routes = 10 requests per run. */
export const BATCH_SIZE = 10;
/** Minimum gap between any two requests to theCrag (≥ 1 s, with margin). */
export const MIN_REQUEST_GAP_MS = 1100;
/** Minimum gap between two runs, so repeated clicks or syncs can't chain runs. */
export const MIN_RUN_INTERVAL_MS = 60_000;

const HOUR = 3_600_000;
/** After a block: wait a day, doubling per repeat, up to a week. */
const BLOCK_BACKOFF_MS = 24 * HOUR;
const BLOCK_BACKOFF_MAX_MS = 7 * 24 * HOUR;
/** After other errors: an hour, doubling, up to a day. */
const ERROR_BACKOFF_MS = HOUR;
const ERROR_BACKOFF_MAX_MS = 24 * HOUR;

export type RouteHistoryConfig = {
	enabled: boolean;
	apiKey: string;
	/** Opt-in rolling refresh age. Unset/0 keeps fetch-once behavior. */
	refreshDays?: 0 | 30 | 90;
	/**
	 * CSV mode passes THECRAG_USERNAME. It must match the saved logbook login;
	 * an empty or mismatched value blocks import until the owner syncs or wipes.
	 */
	ownerLogin?: string | null;
};

/** Invalid or unset values retain fetch-once behavior. */
export function parseRouteDataRefreshDays(value: string): 0 | 30 | 90 {
	const days = value.trim();
	return days === '30' ? 30 : days === '90' ? 90 : 0;
}

export type RouteHistoryDeps = {
	openClient: (apiKey: string) => Promise<RouteHistoryClient>;
	sleep: (ms: number) => Promise<void>;
	now: () => number;
};

export type MarkRules = {
	/** Overwrite an existing FA/FFA mark when history disagrees. Default off. */
	replaceExisting?: boolean;
	/** Re-mark routes the owner unmarked. Default off. */
	reapplyUnmarked?: boolean;
};

export type RouteHistoryRunResult = {
	ok: boolean;
	/** disabled | no-key | no-login | busy | waiting | done | ran | blocked | error | cancelled */
	outcome: string;
	message: string;
	fetched: number;
	marked: number;
	requests: number;
};

export type RouteHistoryStatus = {
	enabled: boolean;
	refreshDays: 0 | 30 | 90;
	hasApiKey: boolean;
	status: string;
	running: boolean;
	lastRunAt: string | null;
	lastFetched: number;
	lastMarked: number;
	lastError: string | null;
	nextAllowedAt: string | null;
	totalRoutes: number;
	fetchedRoutes: number;
	pendingRoutes: number;
	historyRows: number;
	importedMarks: number;
	perRun: number;
};

let running = false;
/** Last request time, shared by every run in this process. */
let lastRequestAt = 0;
/**
 * Bumped by Settings → Wipe (and tests) so an in-flight run abandons after its next await
 * instead of writing history/marks back into an empty DB.
 */
let runGeneration = 0;

/** Test hook: forget the in-process pacing state. */
export function resetRouteHistoryPacing() {
	running = false;
	lastRequestAt = 0;
}

/** Cancel any in-flight import before wiping local data. */
export function invalidateRouteHistoryRuns() {
	runGeneration += 1;
	running = false;
}

type State = typeof routeHistoryImportState.$inferSelect;

function readState(): State | undefined {
	ensureSchema();
	return db
		.select()
		.from(routeHistoryImportState)
		.where(eq(routeHistoryImportState.provider, PROVIDER))
		.get();
}

function writeState(now: number, patch: Partial<Omit<State, 'provider' | 'updatedAt'>>) {
	const updatedAt = new Date(now).toISOString();
	const cur = readState();
	const next = {
		provider: PROVIDER,
		status: cur?.status ?? 'idle',
		lastRunAt: cur?.lastRunAt ?? null,
		lastFetched: cur?.lastFetched ?? 0,
		lastMarked: cur?.lastMarked ?? 0,
		lastError: cur?.lastError ?? null,
		consecutiveFailures: cur?.consecutiveFailures ?? 0,
		nextAllowedAt: cur?.nextAllowedAt ?? null,
		...patch,
		updatedAt
	};
	db.insert(routeHistoryImportState)
		.values(next)
		.onConflictDoUpdate({ target: routeHistoryImportState.provider, set: next })
		.run();
}

function ownerLogin(config?: Pick<RouteHistoryConfig, 'ownerLogin'>): string | null {
	ensureSchema();
	const saved =
		db.select({ login: profiles.login }).from(profiles).where(eq(profiles.provider, PROVIDER)).get()
			?.login ?? null;
	if (config?.ownerLogin == null) return saved;
	const override = config.ownerLogin.trim();
	// Keep the CSV sync account-switch guard effective for manual imports and
	// cached reapplication too. Environment changes cannot retarget a logbook.
	if (!override || !saved || override.toLowerCase() !== saved.trim().toLowerCase()) return null;
	return override;
}

/**
 * Unfetched routes first (ungraded, then recently climbed), followed by oldest stale fetches.
 */
export function pendingRouteIds(
	limit: number,
	refreshDays: 0 | 30 | 90 = 0,
	now = Date.now()
): string[] {
	ensureSchema();
	const rows = db
		.select({ id: routes.externalId })
		.from(routes)
		.leftJoin(
			routeHistoryFetches,
			and(
				eq(routeHistoryFetches.provider, routes.provider),
				eq(routeHistoryFetches.routeExternalId, routes.externalId)
			)
		)
		.where(and(eq(routes.provider, PROVIDER), pendingFetchCondition(refreshDays, now)))
		.orderBy(
			sql`CASE WHEN ${routeHistoryFetches.routeExternalId} IS NULL THEN 0 ELSE 1 END`,
			routeHistoryFetches.fetchedAt,
			sql`CASE WHEN ${routes.gradeScore} IS NULL THEN 0 ELSE 1 END`,
			sql`(SELECT max(a.ascent_date) FROM ascents a WHERE a.route_id = ${routes.id}) DESC`,
			routes.externalId
		)
		.limit(limit)
		.all();
	return rows.map((r) => r.id);
}

function pendingFetchCondition(refreshDays: 0 | 30 | 90, now: number) {
	const unfetched = sql`${routeHistoryFetches.routeExternalId} IS NULL`;
	if (!refreshDays) return unfetched;
	const cutoff = new Date(now - refreshDays * 86_400_000).toISOString();
	return sql`(${unfetched} OR ${routeHistoryFetches.fetchedAt} <= ${cutoff})`;
}

/**
 * Replace cached history for one route with the payload (including an empty list).
 * Upstream deletions must disappear locally so Refresh → Re-apply can correct marks.
 */
function replaceHistoryRows(routeExternalId: string, entries: RouteHistoryEntry[], at: string) {
	db.delete(routeHistory)
		.where(
			and(eq(routeHistory.provider, PROVIDER), eq(routeHistory.routeExternalId, routeExternalId))
		)
		.run();
	for (const e of entries) {
		db.insert(routeHistory)
			.values({
				provider: PROVIDER,
				routeExternalId,
				historyExternalId: e.id,
				type: e.type,
				climbers: e.climbers,
				historyDate: e.date,
				// Prefer the original API object; fall back to normalized fields (#197).
				rawJson:
					e.rawJson ||
					JSON.stringify({ id: e.id, type: e.type, climbers: e.climbers, date: e.date }),
				updatedAt: at
			})
			.run();
	}
}

function recordFetch(routeExternalId: string, status: 'ok' | 'missing', count: number, at: string) {
	const values = { status, historyCount: count, fetchedAt: at };
	db.insert(routeHistoryFetches)
		.values({ provider: PROVIDER, routeExternalId, ...values })
		.onConflictDoUpdate({
			target: [routeHistoryFetches.provider, routeHistoryFetches.routeExternalId],
			set: values
		})
		.run();
}

function existingMark(routeExternalId: string): {
	kind: FirstAscentKind;
	source: string;
} | null {
	const row = db
		.select({ kind: firstAscents.kind, source: firstAscents.source })
		.from(firstAscents)
		.where(
			and(eq(firstAscents.provider, PROVIDER), eq(firstAscents.routeExternalId, routeExternalId))
		)
		.get();
	const kind = row?.kind === 'FA' || row?.kind === 'FFA' ? row.kind : null;
	if (!kind || !row) return null;
	return { kind, source: row.source || 'manual' };
}

/**
 * Apply one route's history to its FA/FFA mark. Manual marks and unmarks win by default.
 * With `replaceExisting`, imported marks are removed when successfully fetched history no
 * longer credits the owner (empty history or a different climber). Manual marks stay.
 */
function applyMark(
	routeExternalId: string,
	history: readonly RouteHistoryEntry[],
	login: string,
	rules: MarkRules
): boolean {
	if (!rules.reapplyUnmarked && isFirstAscentImportSkipped(PROVIDER, routeExternalId)) return false;
	const kind = ownerKindsFromHistory(history, login);
	const existing = existingMark(routeExternalId);

	if (!kind) {
		if (!rules.replaceExisting || !existing || existing.source !== 'import') return false;
		setFirstAscent(PROVIDER, routeExternalId, null, { recordSkip: false });
		return true;
	}

	if (existing?.kind === kind) return false;
	if (existing && !rules.replaceExisting) return false;
	setFirstAscent(PROVIDER, routeExternalId, kind, { source: 'import' });
	return true;
}

function cacheRouteInfo(
	routeExternalId: string,
	info: RouteInfoFields | undefined,
	rawJson: string | null | undefined,
	at: string
) {
	const hasInfo = Boolean(info && Object.keys(info).length);
	const hasRaw = rawJson != null && rawJson !== '';
	if (!hasInfo && !hasRaw) return;
	const patch: Record<string, unknown> = { routeInfoUpdatedAt: at };
	if (hasRaw) patch.routeApiJson = rawJson;
	if (info?.isProject !== undefined) patch.isProject = info.isProject;
	if (info?.qualityScore !== undefined) patch.qualityScore = info.qualityScore;
	if (info?.ascentCount !== undefined) {
		patch.ascentCount = info.ascentCount;
		patch.ascentCountOwn =
			info.ascentCount === null
				? null
				: db.get<{ n: number }>(sql`SELECT count(*) AS n FROM ascents a
					INNER JOIN routes r ON r.id = a.route_id
					WHERE r.provider = ${PROVIDER} AND a.provider = ${PROVIDER}
					AND r.external_id = ${routeExternalId}`)!.n;
		// Counter freshness only — unrelated route-info updates leave this alone (#147).
		patch.ascentCountFetchedAt = info.ascentCount === null ? null : at;
	}
	if (info?.popularity !== undefined) patch.popularity = info.popularity;
	if (info?.relativePopularity !== undefined) patch.relativePopularity = info.relativePopularity;
	if (info?.seasonalityJson !== undefined) patch.seasonalityJson = info.seasonalityJson;
	if (info?.betaJson !== undefined) patch.betaJson = info.betaJson;
	if (info?.ancestorsJson !== undefined) patch.ancestorsJson = info.ancestorsJson;
	if (info?.pitchesJson !== undefined) patch.pitchesJson = info.pitchesJson;
	if (info?.flagsJson !== undefined) patch.flagsJson = info.flagsJson;
	db.update(routes)
		.set(patch as Partial<typeof routes.$inferInsert>)
		.where(and(eq(routes.provider, PROVIDER), eq(routes.externalId, routeExternalId)))
		.run();
}

/** Store one batch's answers: every requested route gets a fetch row, found or not. */
function storeBatch(
	requested: readonly string[],
	payload: readonly RouteWithHistory[],
	login: string,
	at: string
): number {
	const byId = new Map(payload.map((r) => [r.id, r]));
	let marked = 0;
	db.transaction(() => {
		for (const id of requested) {
			const route = byId.get(id);
			if (!route) {
				recordFetch(id, 'missing', 0, at);
				continue;
			}
			replaceHistoryRows(id, route.history, at);
			recordFetch(id, 'ok', route.history.length, at);
			cacheRouteInfo(id, route.info, route.rawJson, at);
			if (applyMark(id, route.history, login, {})) marked += 1;
		}
	});
	return marked;
}

function backoffMs(failures: number, base: number, max: number): number {
	return Math.min(max, base * 2 ** Math.max(0, failures - 1));
}

/** One rate-limited run: up to ROUTES_PER_RUN unfetched or stale routes, then stop. */
export async function runRouteHistoryImportOnce(
	config: RouteHistoryConfig,
	deps: RouteHistoryDeps
): Promise<RouteHistoryRunResult> {
	const result = (
		ok: boolean,
		outcome: string,
		message: string,
		extra: Partial<RouteHistoryRunResult> = {}
	): RouteHistoryRunResult => ({
		ok,
		outcome,
		message,
		fetched: 0,
		marked: 0,
		requests: 0,
		...extra
	});

	if (!config.enabled) {
		return result(
			false,
			'disabled',
			'Route history import is off (set ROUTE_HISTORY_IMPORT=true).'
		);
	}
	if (!config.apiKey) return result(false, 'no-key', 'THECRAG_API_KEY is not set.');
	if (running) return result(false, 'busy', 'A route history run is already in progress.');

	const now = deps.now();
	const state = readState();
	const nextAllowed = state?.nextAllowedAt ? Date.parse(state.nextAllowedAt) : 0;
	if (nextAllowed > now) {
		return result(false, 'waiting', `Backing off until ${state!.nextAllowedAt}.`);
	}
	const lastRun = state?.lastRunAt ? Date.parse(state.lastRunAt) : 0;
	if (lastRun && now - lastRun < MIN_RUN_INTERVAL_MS) {
		return result(false, 'waiting', 'The last run was under a minute ago; try again shortly.');
	}

	const login = ownerLogin(config);
	if (!login) {
		return result(
			false,
			'no-login',
			'Sync the logbook first with the configured @login. Wipe local data before switching accounts.'
		);
	}
	const pending = pendingRouteIds(ROUTES_PER_RUN, config.refreshDays, now);
	if (!pending.length) {
		return result(true, 'done', 'Every route in your logbook has been checked.');
	}

	running = true;
	const myGeneration = runGeneration;
	const stillCurrent = () => myGeneration === runGeneration;
	writeState(now, { status: 'running', lastRunAt: new Date(now).toISOString(), lastError: null });
	let fetched = 0;
	let marked = 0;
	let requests = 0;
	let client: RouteHistoryClient | null = null;
	try {
		client = await deps.openClient(config.apiKey);
		if (!stillCurrent()) {
			return result(false, 'cancelled', 'Import cancelled because local data was wiped.', {
				fetched,
				marked,
				requests
			});
		}
		for (let i = 0; i < pending.length; i += BATCH_SIZE) {
			const batch = pending.slice(i, i + BATCH_SIZE);
			const wait = lastRequestAt + MIN_REQUEST_GAP_MS - deps.now();
			if (wait > 0) await deps.sleep(wait);
			if (!stillCurrent()) {
				return result(false, 'cancelled', 'Import cancelled because local data was wiped.', {
					fetched,
					marked,
					requests
				});
			}
			lastRequestAt = deps.now();
			requests += 1;
			const payload = await client.fetchRoutes(batch);
			if (!stillCurrent()) {
				return result(false, 'cancelled', 'Import cancelled because local data was wiped.', {
					fetched,
					marked,
					requests
				});
			}
			marked += storeBatch(batch, payload, login, new Date(deps.now()).toISOString());
			fetched += batch.length;
		}
		writeState(deps.now(), {
			status: 'idle',
			lastFetched: fetched,
			lastMarked: marked,
			lastError: null,
			consecutiveFailures: 0,
			nextAllowedAt: null
		});
		return result(true, 'ran', `Checked ${fetched} routes, marked ${marked} FA/FFA.`, {
			fetched,
			marked,
			requests
		});
	} catch (err) {
		if (!stillCurrent()) {
			return result(false, 'cancelled', 'Import cancelled because local data was wiped.', {
				fetched,
				marked,
				requests
			});
		}
		const failures = (state?.consecutiveFailures ?? 0) + 1;
		const blocked = err instanceof RouteHistoryBlockedError;
		const unavailable = err instanceof RouteHistoryUnavailableError;
		let wait = blocked
			? backoffMs(failures, BLOCK_BACKOFF_MS, BLOCK_BACKOFF_MAX_MS)
			: unavailable
				? ERROR_BACKOFF_MAX_MS
				: backoffMs(failures, ERROR_BACKOFF_MS, ERROR_BACKOFF_MAX_MS);
		if (blocked && err.retryAfterSeconds != null)
			wait = Math.max(wait, err.retryAfterSeconds * 1000);
		const message = (err instanceof Error ? err.message : String(err)).slice(0, 500);
		writeState(deps.now(), {
			status: blocked ? 'blocked' : 'error',
			lastFetched: fetched,
			lastMarked: marked,
			lastError: message,
			consecutiveFailures: failures,
			nextAllowedAt: new Date(deps.now() + wait).toISOString()
		});
		return result(false, blocked ? 'blocked' : 'error', message, { fetched, marked, requests });
	} finally {
		if (stillCurrent()) running = false;
		await client?.close().catch(() => undefined);
	}
}

/**
 * Re-apply FA/FFA marks from history already cached locally. No network.
 * Only routes with a successful fetch (`status='ok'`) are reconciled — including those with
 * zero history rows — so Refresh → Re-apply can clear imported credits removed upstream.
 * Unfetched / `missing` routes are left alone.
 */
export function applyCachedHistoryMarks(
	rules: MarkRules,
	loginOverride?: string | null
): { marked: number; routes: number } {
	ensureSchema();
	const login = ownerLogin({ ownerLogin: loginOverride });
	if (!login) return { marked: 0, routes: 0 };

	const fetches = db
		.select({ routeExternalId: routeHistoryFetches.routeExternalId })
		.from(routeHistoryFetches)
		.where(and(eq(routeHistoryFetches.provider, PROVIDER), eq(routeHistoryFetches.status, 'ok')))
		.all();

	const rows = db.select().from(routeHistory).where(eq(routeHistory.provider, PROVIDER)).all();
	const byRoute = new Map<string, RouteHistoryEntry[]>();
	for (const r of rows) {
		const list = byRoute.get(r.routeExternalId) ?? [];
		list.push({ id: r.historyExternalId, type: r.type, climbers: r.climbers, date: r.historyDate });
		byRoute.set(r.routeExternalId, list);
	}

	let marked = 0;
	for (const { routeExternalId } of fetches) {
		const history = byRoute.get(routeExternalId) ?? [];
		if (applyMark(routeExternalId, history, login, rules)) marked += 1;
	}
	return { marked, routes: fetches.length };
}

/** Forget which routes were checked so they're fetched again, 100 per run. Keeps history rows. */
export function resetRouteHistoryFetches(): number {
	ensureSchema();
	return db.delete(routeHistoryFetches).where(eq(routeHistoryFetches.provider, PROVIDER)).run()
		.changes;
}

export function routeHistoryStatus(
	config: RouteHistoryConfig,
	now = Date.now()
): RouteHistoryStatus {
	ensureSchema();
	const state = readState();
	const count = (q: ReturnType<typeof sql<number>>) => Number(db.get<{ n: number }>(q)?.n ?? 0);
	const totalRoutes = count(sql`SELECT count(*) AS n FROM routes WHERE provider = ${PROVIDER}`);
	const fetchedRoutes = count(
		sql`SELECT count(*) AS n FROM route_history_fetches f JOIN routes r
			ON r.provider = f.provider AND r.external_id = f.route_external_id WHERE f.provider = ${PROVIDER}`
	);
	const pendingRoutes = db
		.select({ n: sql<number>`count(*)` })
		.from(routes)
		.leftJoin(
			routeHistoryFetches,
			and(
				eq(routeHistoryFetches.provider, routes.provider),
				eq(routeHistoryFetches.routeExternalId, routes.externalId)
			)
		)
		.where(and(eq(routes.provider, PROVIDER), pendingFetchCondition(config.refreshDays ?? 0, now)))
		.get()!.n;
	return {
		enabled: config.enabled,
		refreshDays: config.refreshDays ?? 0,
		hasApiKey: Boolean(config.apiKey),
		// A stored 'running' with no live run means the process died mid-run.
		status: running ? 'running' : state?.status === 'running' ? 'idle' : (state?.status ?? 'idle'),
		running,
		lastRunAt: state?.lastRunAt ?? null,
		lastFetched: state?.lastFetched ?? 0,
		lastMarked: state?.lastMarked ?? 0,
		lastError: state?.lastError ?? null,
		nextAllowedAt: state?.nextAllowedAt ?? null,
		totalRoutes,
		fetchedRoutes,
		pendingRoutes,
		historyRows: count(sql`SELECT count(*) AS n FROM route_history WHERE provider = ${PROVIDER}`),
		importedMarks: count(
			sql`SELECT count(*) AS n FROM first_ascents WHERE provider = ${PROVIDER} AND source = 'import'`
		),
		perRun: ROUTES_PER_RUN
	};
}
