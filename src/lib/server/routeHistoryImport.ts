/**
 * Settings → Import route history (#68).
 *
 * Pulls public FA/FFA (and other history types) from `/api/route/ids?show=info` via
 * browser TLS impersonation, caches rows, and auto-marks first_ascents when history
 * names the owner as `@login`.
 */
import { and, eq } from 'drizzle-orm';
import { isFirstAscentImportSkipped, setFirstAscent, type FirstAscentKind } from './firstAscents';
import { db, ensureSchema } from './db';
import { firstAscents, profiles, routeHistory, routeHistoryImportState, routes } from './db/schema';
import { env } from './env';
import {
	fetchRoutesWithHistory,
	RouteHistoryUnavailableError
} from './providers/thecrag/routeHistoryApi';
import { ownerKindsFromHistory } from './providers/thecrag/routeHistoryParse';

const PROVIDER = 'thecrag';
/** Routes per API call — small enough for CF-friendly traffic. */
const BATCH_SIZE = 10;
/** Pause between batches (~1 req/s as in #68). */
const BATCH_GAP_MS = 1000;

export type RouteHistoryImportStatus = {
	provider: string;
	offset: number;
	total: number;
	fetched: number;
	marked: number;
	skipped: number;
	errors: number;
	status: string;
	lastError: string | null;
	updatedAt: string | null;
	/** True when a run can continue from offset < total. */
	resumable: boolean;
};

export type RouteHistoryImportResult = RouteHistoryImportStatus & {
	ok: boolean;
	message?: string;
	/** Marks applied in this invocation only. */
	markedThisRun: number;
};

let importing = false;

function sleep(ms: number) {
	return new Promise<void>((r) => setTimeout(r, ms));
}

function nowIso() {
	return new Date().toISOString();
}

function listRouteExternalIds(): string[] {
	ensureSchema();
	return db
		.select({ externalId: routes.externalId })
		.from(routes)
		.where(eq(routes.provider, PROVIDER))
		.all()
		.map((r) => r.externalId)
		.filter(Boolean)
		.sort();
}

function ownerLogin(): string | null {
	ensureSchema();
	return (
		db.select({ login: profiles.login }).from(profiles).where(eq(profiles.provider, PROVIDER)).get()
			?.login ?? null
	);
}

function readState(): RouteHistoryImportStatus {
	ensureSchema();
	const row = db
		.select()
		.from(routeHistoryImportState)
		.where(eq(routeHistoryImportState.provider, PROVIDER))
		.get();
	if (!row) {
		return {
			provider: PROVIDER,
			offset: 0,
			total: 0,
			fetched: 0,
			marked: 0,
			skipped: 0,
			errors: 0,
			status: 'idle',
			lastError: null,
			updatedAt: null,
			resumable: false
		};
	}
	return {
		provider: row.provider,
		offset: row.offset,
		total: row.total,
		fetched: row.fetched,
		marked: row.marked,
		skipped: row.skipped,
		errors: row.errors,
		status: row.status,
		lastError: row.lastError,
		updatedAt: row.updatedAt,
		resumable: row.offset > 0 && row.offset < row.total && row.status !== 'running'
	};
}

function writeState(
	patch: Partial<{
		offset: number;
		total: number;
		fetched: number;
		marked: number;
		skipped: number;
		errors: number;
		status: string;
		lastError: string | null;
	}>
) {
	ensureSchema();
	const updatedAt = nowIso();
	const cur = readState();
	const next = {
		provider: PROVIDER,
		offset: patch.offset ?? cur.offset,
		total: patch.total ?? cur.total,
		fetched: patch.fetched ?? cur.fetched,
		marked: patch.marked ?? cur.marked,
		skipped: patch.skipped ?? cur.skipped,
		errors: patch.errors ?? cur.errors,
		status: patch.status ?? cur.status,
		lastError: patch.lastError !== undefined ? patch.lastError : cur.lastError,
		updatedAt
	};
	db.insert(routeHistoryImportState)
		.values(next)
		.onConflictDoUpdate({
			target: routeHistoryImportState.provider,
			set: {
				offset: next.offset,
				total: next.total,
				fetched: next.fetched,
				marked: next.marked,
				skipped: next.skipped,
				errors: next.errors,
				status: next.status,
				lastError: next.lastError,
				updatedAt
			}
		})
		.run();
}

function upsertHistoryRows(
	routeExternalId: string,
	entries: { id: string; type: string; climbers: string | null; date: string | null }[]
) {
	const updatedAt = nowIso();
	for (const e of entries) {
		db.insert(routeHistory)
			.values({
				provider: PROVIDER,
				routeExternalId,
				historyExternalId: e.id,
				type: e.type,
				climbers: e.climbers,
				historyDate: e.date,
				rawJson: JSON.stringify(e),
				updatedAt
			})
			.onConflictDoUpdate({
				target: [
					routeHistory.provider,
					routeHistory.routeExternalId,
					routeHistory.historyExternalId
				],
				set: {
					type: e.type,
					climbers: e.climbers,
					historyDate: e.date,
					rawJson: JSON.stringify(e),
					updatedAt
				}
			})
			.run();
	}
}

function existingMark(routeExternalId: string): FirstAscentKind | null {
	const row = db
		.select({ kind: firstAscents.kind })
		.from(firstAscents)
		.where(
			and(eq(firstAscents.provider, PROVIDER), eq(firstAscents.routeExternalId, routeExternalId))
		)
		.get();
	return row?.kind === 'FA' || row?.kind === 'FFA' ? row.kind : null;
}

export function getRouteHistoryImportStatus(): RouteHistoryImportStatus {
	return readState();
}

export type RunRouteHistoryImportOpts = {
	/** Start from offset 0 and reset counters. */
	restart?: boolean;
	/** Overwrite existing FA/FFA marks when history names the owner. */
	replaceExisting?: boolean;
	/** Ignore the skip list from previous unmarks. */
	reapplyUnmarked?: boolean;
	/** Max batches this invocation (for tests / short runs). Default: until done. */
	maxBatches?: number;
};

/**
 * Run (or resume) a rate-limited import. Safe to call again after a crash — uses stored offset.
 */
export async function runRouteHistoryImport(
	opts: RunRouteHistoryImportOpts = {}
): Promise<RouteHistoryImportResult> {
	const apiKey = env('THECRAG_API_KEY').trim();
	if (!apiKey) {
		return {
			...readState(),
			ok: false,
			markedThisRun: 0,
			message: 'THECRAG_API_KEY is not set'
		};
	}
	if (importing) {
		return {
			...readState(),
			ok: false,
			markedThisRun: 0,
			message: 'Route history import already in progress'
		};
	}

	importing = true;
	let markedThisRun = 0;

	try {
		const ids = listRouteExternalIds();
		const login = ownerLogin();
		if (!login) {
			writeState({
				status: 'error',
				lastError: 'No theCrag profile login in the local DB — sync the logbook first.'
			});
			return {
				...readState(),
				ok: false,
				markedThisRun: 0,
				message: 'No theCrag profile login — sync the API logbook first so we know your @login.'
			};
		}

		const prev = readState();
		// Fresh run when asked, when the route set changed, or when the last run already finished.
		const restart =
			opts.restart ||
			prev.status === 'done' ||
			prev.offset >= ids.length ||
			prev.total !== ids.length;
		let offset = restart ? 0 : Math.min(prev.offset, ids.length);
		if (restart) {
			writeState({
				offset: 0,
				total: ids.length,
				fetched: 0,
				marked: 0,
				skipped: 0,
				errors: 0,
				status: 'running',
				lastError: null
			});
		} else {
			writeState({ status: 'running', lastError: null, total: ids.length });
		}

		let batches = 0;
		const maxBatches = opts.maxBatches ?? Number.POSITIVE_INFINITY;

		while (offset < ids.length && batches < maxBatches) {
			const slice = ids.slice(offset, offset + BATCH_SIZE);
			try {
				const routesPayload = await fetchRoutesWithHistory(apiKey, slice);
				const byId = new Map(routesPayload.map((r) => [r.id, r]));

				let fetched = readState().fetched;
				let marked = readState().marked;
				let skipped = readState().skipped;

				for (const routeId of slice) {
					const payload = byId.get(routeId);
					const history = payload?.history ?? [];
					upsertHistoryRows(routeId, history);
					fetched += 1;

					const kind = ownerKindsFromHistory(history, login);
					if (!kind) {
						skipped += 1;
						continue;
					}

					const skipUnmark = !opts.reapplyUnmarked && isFirstAscentImportSkipped(PROVIDER, routeId);
					if (skipUnmark) {
						skipped += 1;
						continue;
					}

					const existing = existingMark(routeId);
					if (existing && !opts.replaceExisting) {
						skipped += 1;
						continue;
					}

					setFirstAscent(PROVIDER, routeId, kind, { source: 'import' });
					marked += 1;
					markedThisRun += 1;
				}

				offset += slice.length;
				writeState({
					offset,
					fetched,
					marked,
					skipped,
					status: 'running',
					lastError: null
				});
			} catch (err) {
				const message =
					err instanceof RouteHistoryUnavailableError
						? err.message
						: err instanceof Error
							? err.message
							: String(err);
				writeState({
					status: 'error',
					errors: readState().errors + 1,
					lastError: message.slice(0, 500)
				});
				return {
					...readState(),
					ok: false,
					markedThisRun,
					message
				};
			}

			batches += 1;
			if (offset < ids.length && batches < maxBatches) {
				await sleep(BATCH_GAP_MS);
			}
		}

		const done = offset >= ids.length;
		writeState({
			offset,
			status: done ? 'done' : 'idle',
			lastError: null
		});

		return {
			...readState(),
			ok: true,
			markedThisRun,
			message: done
				? `Finished: marked ${readState().marked} FA/FFA from ${readState().fetched} routes.`
				: `Paused after ${batches} batch(es); resume to continue (${offset}/${ids.length}).`
		};
	} finally {
		importing = false;
	}
}
