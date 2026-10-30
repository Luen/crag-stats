/**
 * Outdoor weather-day import engine (#268). Free of env wiring so tests can inject a client.
 * Opt-in via WEATHER_IMPORT; paced Open-Meteo archive fetches for outdoor logbook days with
 * route lat/lon. Cache key = rounded lat/lon (1 decimal) + calendar day.
 */
import { asc, eq, sql } from 'drizzle-orm';
import {
	roundCoord,
	weatherAscentDay,
	weatherDayKey,
	type WeatherSnapshot
} from '#lib/weatherKeys';
import { isLikelyIndoorRoute } from './venue';
import { db, ensureSchema } from './db';
import { ascents, routes, weatherDays, weatherImportState } from './db/schema';
import type { OpenMeteoClient } from './providers/openMeteo';

/** Location-days fetched per run (each sync, or Settings "Fetch next"). */
export const DAYS_PER_RUN = 50;
/** Minimum gap between Open-Meteo requests (≥ 1 s, with margin). */
export const MIN_REQUEST_GAP_MS = 1100;
/** Minimum gap between two runs. */
export const MIN_RUN_INTERVAL_MS = 60_000;

const HOUR = 3_600_000;
const BLOCK_BACKOFF_MS = 24 * HOUR;
const BLOCK_BACKOFF_MAX_MS = 7 * 24 * HOUR;
const ERROR_BACKOFF_MS = HOUR;
const ERROR_BACKOFF_MAX_MS = 24 * HOUR;

export type WeatherImportConfig = {
	enabled: boolean;
};

export type WeatherImportDeps = {
	client: OpenMeteoClient;
	sleep: (ms: number) => Promise<void>;
	now: () => number;
};

export type WeatherRunResult = {
	ok: boolean;
	outcome: string;
	message: string;
	fetched: number;
	requests: number;
};

export type WeatherImportStatus = {
	enabled: boolean;
	status: string;
	running: boolean;
	lastRunAt: string | null;
	lastFetched: number;
	lastError: string | null;
	nextAllowedAt: string | null;
	retryAt: number;
	totalPending: number;
	cachedOk: number;
	perRun: number;
};

type PendingDay = { latKey: number; lonKey: number; day: string };

let running = false;
let lastRequestAt = 0;
let runGeneration = 0;

/** Test hook: forget in-process pacing state. */
export function resetWeatherPacing() {
	running = false;
	lastRequestAt = 0;
}

/** Cancel any in-flight import before wiping local data. */
export function invalidateWeatherRuns() {
	runGeneration += 1;
	running = false;
}

type State = typeof weatherImportState.$inferSelect;

function readState(): State | undefined {
	ensureSchema();
	return db.select().from(weatherImportState).where(eq(weatherImportState.id, 1)).get();
}

function writeState(now: number, patch: Partial<Omit<State, 'id' | 'updatedAt'>>) {
	const updatedAt = new Date(now).toISOString();
	const cur = readState();
	if (!cur) {
		db.insert(weatherImportState)
			.values({
				id: 1,
				status: patch.status ?? 'idle',
				lastRunAt: patch.lastRunAt ?? null,
				lastFetched: patch.lastFetched ?? 0,
				lastError: patch.lastError ?? null,
				consecutiveFailures: patch.consecutiveFailures ?? 0,
				nextAllowedAt: patch.nextAllowedAt ?? null,
				updatedAt
			})
			.run();
		return;
	}
	db.update(weatherImportState)
		.set({
			status: patch.status ?? cur.status,
			lastRunAt: patch.lastRunAt !== undefined ? patch.lastRunAt : cur.lastRunAt,
			lastFetched: patch.lastFetched !== undefined ? patch.lastFetched : cur.lastFetched,
			lastError: patch.lastError !== undefined ? patch.lastError : cur.lastError,
			consecutiveFailures:
				patch.consecutiveFailures !== undefined
					? patch.consecutiveFailures
					: cur.consecutiveFailures,
			nextAllowedAt: patch.nextAllowedAt !== undefined ? patch.nextAllowedAt : cur.nextAllowedAt,
			updatedAt
		})
		.where(eq(weatherImportState.id, 1))
		.run();
}

function utcToday(now: number): string {
	return new Date(now).toISOString().slice(0, 10);
}

function isValidDay(day: string): boolean {
	return weatherAscentDay(day) === day;
}

/**
 * Outdoor ascents with route coordinates whose (lat_key, lon_key, day) is not yet cached.
 * Archive data is incomplete for "today", so only days strictly before UTC today are queued.
 */
export function listPendingWeatherDays(limit: number, now: number): PendingDay[] {
	ensureSchema();
	const today = utcToday(now);
	// Oldest climb days first so large backlogs unlock early-history badges before recent ones.
	const rows = db
		.select({
			ascentDate: ascents.ascentDate,
			lat: routes.lat,
			lon: routes.lon,
			gearStyle: routes.gearStyle,
			routeName: routes.name,
			cragName: routes.cragName,
			tagsJson: routes.tagsJson
		})
		.from(ascents)
		.innerJoin(routes, eq(ascents.routeId, routes.id))
		.orderBy(asc(ascents.ascentDate))
		.all();

	const cached = loadWeatherCachedKeys();

	const seen = new Set<string>();
	const pending: PendingDay[] = [];
	for (const row of rows) {
		const day = (row.ascentDate || '').trim().slice(0, 10);
		if (!isValidDay(day) || day >= today) continue;
		if (row.lat == null || row.lon == null) continue;
		if (!Number.isFinite(row.lat) || !Number.isFinite(row.lon)) continue;
		if (
			isLikelyIndoorRoute({
				gearStyle: row.gearStyle,
				name: row.routeName,
				cragName: row.cragName,
				tagsJson: row.tagsJson
			})
		) {
			continue;
		}
		const latKey = roundCoord(row.lat);
		const lonKey = roundCoord(row.lon);
		const key = weatherDayKey(latKey, lonKey, day);
		if (seen.has(key) || cached.has(key)) continue;
		seen.add(key);
		pending.push({ latKey, lonKey, day });
		if (pending.length >= limit) break;
	}
	return pending;
}

function countPending(now: number): number {
	// Cap the scan for status UI; exact backlog can be large.
	return listPendingWeatherDays(10_000, now).length;
}

function countCachedOk(): number {
	ensureSchema();
	const row = db
		.select({ n: sql<number>`count(*)` })
		.from(weatherDays)
		.where(eq(weatherDays.status, 'ok'))
		.get();
	return Number(row?.n ?? 0);
}

function upsertWeatherDay(
	latKey: number,
	lonKey: number,
	day: string,
	fields: {
		tempMaxC: number | null;
		tempMinC: number | null;
		precipMm: number | null;
		weatherCode: number | null;
		humidityMean: number | null;
		windMaxKmh: number | null;
		windMeanKmh: number | null;
		status: string;
		fetchedAt: string;
	}
) {
	db.insert(weatherDays)
		.values({
			latKey,
			lonKey,
			day,
			tempMaxC: fields.tempMaxC,
			tempMinC: fields.tempMinC,
			precipMm: fields.precipMm,
			weatherCode: fields.weatherCode,
			humidityMean: fields.humidityMean,
			windMaxKmh: fields.windMaxKmh,
			windMeanKmh: fields.windMeanKmh,
			source: 'open-meteo',
			status: fields.status,
			fetchedAt: fields.fetchedAt
		})
		.onConflictDoUpdate({
			target: [weatherDays.latKey, weatherDays.lonKey, weatherDays.day],
			set: {
				tempMaxC: fields.tempMaxC,
				tempMinC: fields.tempMinC,
				precipMm: fields.precipMm,
				weatherCode: fields.weatherCode,
				humidityMean: fields.humidityMean,
				windMaxKmh: fields.windMaxKmh,
				windMeanKmh: fields.windMeanKmh,
				source: 'open-meteo',
				status: fields.status,
				fetchedAt: fields.fetchedAt
			}
		})
		.run();
}

async function pace(deps: WeatherImportDeps) {
	const gap = MIN_REQUEST_GAP_MS - (deps.now() - lastRequestAt);
	if (gap > 0) await deps.sleep(gap);
	lastRequestAt = deps.now();
}

function backoffMs(kind: 'block' | 'error', failures: number, retryAfterMs?: number): number {
	const base = kind === 'block' ? BLOCK_BACKOFF_MS : ERROR_BACKOFF_MS;
	const max = kind === 'block' ? BLOCK_BACKOFF_MAX_MS : ERROR_BACKOFF_MAX_MS;
	const exp = Math.min(max, base * 2 ** Math.max(0, failures - 1));
	if (retryAfterMs != null && retryAfterMs > exp) return retryAfterMs;
	return exp;
}

export function weatherImportStatus(
	config: WeatherImportConfig,
	now = Date.now()
): WeatherImportStatus {
	ensureSchema();
	const state = readState();
	const nextAllowed = state?.nextAllowedAt ? Date.parse(state.nextAllowedAt) : 0;
	const lastRun = state?.lastRunAt ? Date.parse(state.lastRunAt) : 0;
	const intervalReady = lastRun ? lastRun + MIN_RUN_INTERVAL_MS : 0;
	const retryAt = Math.max(nextAllowed || 0, intervalReady || 0, running ? now + 1000 : 0);
	return {
		enabled: config.enabled,
		status: running ? 'running' : (state?.status ?? 'idle'),
		running,
		lastRunAt: state?.lastRunAt ?? null,
		lastFetched: state?.lastFetched ?? 0,
		lastError: state?.lastError ?? null,
		nextAllowedAt: state?.nextAllowedAt ?? null,
		retryAt,
		totalPending: config.enabled ? countPending(now) : 0,
		cachedOk: countCachedOk(),
		perRun: DAYS_PER_RUN
	};
}

export async function runWeatherImportOnce(
	config: WeatherImportConfig,
	deps: WeatherImportDeps
): Promise<WeatherRunResult> {
	const result = (
		ok: boolean,
		outcome: string,
		message: string,
		extra: Partial<WeatherRunResult> = {}
	): WeatherRunResult => ({
		ok,
		outcome,
		message,
		fetched: 0,
		requests: 0,
		...extra
	});

	if (!config.enabled) {
		return result(false, 'disabled', 'Weather import is off (set WEATHER_IMPORT=true).');
	}
	if (running) return result(false, 'busy', 'A weather import run is already in progress.');

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

	const pending = listPendingWeatherDays(DAYS_PER_RUN, now);
	if (!pending.length) {
		return result(true, 'done', 'Every outdoor day with coordinates has weather cached.');
	}

	running = true;
	const myGeneration = runGeneration;
	const stillCurrent = () => myGeneration === runGeneration;
	writeState(now, { status: 'running', lastRunAt: new Date(now).toISOString(), lastError: null });

	let fetched = 0;
	let requests = 0;
	try {
		for (const item of pending) {
			if (!stillCurrent()) {
				writeState(deps.now(), { status: 'idle', lastError: null });
				return result(false, 'cancelled', 'Weather import cancelled (data wipe).', {
					fetched,
					requests
				});
			}
			await pace(deps);
			requests += 1;
			const res = await deps.client.fetchDaily({
				latitude: item.latKey,
				longitude: item.lonKey,
				startDate: item.day,
				endDate: item.day
			});
			const fetchedAt = new Date(deps.now()).toISOString();
			if (!res.ok) {
				const failures = (readState()?.consecutiveFailures ?? 0) + 1;
				const blocked = res.status === 429 || res.status === 503;
				const wait = backoffMs(blocked ? 'block' : 'error', failures, res.retryAfterMs);
				const nextAllowedAt = new Date(deps.now() + wait).toISOString();
				writeState(deps.now(), {
					status: blocked ? 'blocked' : 'error',
					lastFetched: fetched,
					lastError: res.message,
					consecutiveFailures: failures,
					nextAllowedAt
				});
				return result(false, blocked ? 'blocked' : 'error', res.message, { fetched, requests });
			}

			const match = res.days.find((d) => d.day === item.day);
			if (!match) {
				upsertWeatherDay(item.latKey, item.lonKey, item.day, {
					tempMaxC: null,
					tempMinC: null,
					precipMm: null,
					weatherCode: null,
					humidityMean: null,
					windMaxKmh: null,
					windMeanKmh: null,
					status: 'missing',
					fetchedAt
				});
			} else {
				upsertWeatherDay(item.latKey, item.lonKey, item.day, {
					tempMaxC: match.tempMaxC,
					tempMinC: match.tempMinC,
					precipMm: match.precipMm,
					weatherCode: match.weatherCode,
					humidityMean: match.humidityMean,
					windMaxKmh: match.windMaxKmh,
					windMeanKmh: match.windMeanKmh,
					status: 'ok',
					fetchedAt
				});
			}
			fetched += 1;
		}

		writeState(deps.now(), {
			status: 'idle',
			lastFetched: fetched,
			lastError: null,
			consecutiveFailures: 0,
			nextAllowedAt: null
		});
		return result(
			true,
			'ran',
			`Cached weather for ${fetched} outdoor day${fetched === 1 ? '' : 's'}.`,
			{ fetched, requests }
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		const failures = (readState()?.consecutiveFailures ?? 0) + 1;
		const wait = backoffMs('error', failures);
		writeState(deps.now(), {
			status: 'error',
			lastFetched: fetched,
			lastError: message,
			consecutiveFailures: failures,
			nextAllowedAt: new Date(deps.now() + wait).toISOString()
		});
		return result(false, 'error', message, { fetched, requests });
	} finally {
		running = false;
	}
}

/** Load ok weather rows into a lookup map for badge evaluation. */
export function loadWeatherSnapshotMap(): Map<string, WeatherSnapshot> {
	ensureSchema();
	const map = new Map<string, WeatherSnapshot>();
	const rows = db
		.select({
			latKey: weatherDays.latKey,
			lonKey: weatherDays.lonKey,
			day: weatherDays.day,
			tempMaxC: weatherDays.tempMaxC,
			tempMinC: weatherDays.tempMinC,
			precipMm: weatherDays.precipMm,
			weatherCode: weatherDays.weatherCode,
			windMaxKmh: weatherDays.windMaxKmh,
			humidityMean: weatherDays.humidityMean
		})
		.from(weatherDays)
		.where(eq(weatherDays.status, 'ok'))
		.all();
	for (const r of rows) {
		map.set(weatherDayKey(r.latKey, r.lonKey, r.day), {
			tempMaxC: r.tempMaxC,
			tempMinC: r.tempMinC,
			precipMm: r.precipMm,
			weatherCode: r.weatherCode,
			windMaxKmh: r.windMaxKmh,
			humidityMean: r.humidityMean
		});
	}
	return map;
}

/** All checked location-days, including provider responses with no available data. */
export function loadWeatherCachedKeys(): Set<string> {
	ensureSchema();
	return new Set(
		db
			.select({ latKey: weatherDays.latKey, lonKey: weatherDays.lonKey, day: weatherDays.day })
			.from(weatherDays)
			.all()
			.map((r) => weatherDayKey(r.latKey, r.lonKey, r.day))
	);
}
