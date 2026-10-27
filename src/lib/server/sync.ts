import { env } from './env';
import { syncTheCragAll } from './providers/thecrag';
import {
	getOrCreateSyncState,
	reconcileProviderAscents,
	updateSyncState,
	upsertAscents,
	upsertProfile
} from './ingest';
import { refreshProjects } from './projects';
import { repairGradesFromRawJson } from './repairGrades';
import { triggerRouteHistoryImport } from './routeHistoryImport';

let syncing = false;

/**
 * Sync theCrag → local SQLite.
 *
 * Upstream is the source of truth (Dreeve-style): every sync pulls the full
 * logbook, upserts creates/updates (comments, grades, ticks, etc.), then prunes
 * local ascents that no longer exist upstream.
 *
 * `opts.full` is retained for Settings UI compatibility; reconcile always runs.
 */
export async function runTheCragSync(opts?: { full?: boolean }) {
	void opts;
	const apiKey = env('THECRAG_API_KEY').trim();
	if (!apiKey) {
		throw new Error('THECRAG_API_KEY is not set');
	}
	if (syncing) {
		return { skipped: true as const, reason: 'Sync already in progress' };
	}

	syncing = true;
	const provider = 'thecrag';
	getOrCreateSyncState(provider);
	updateSyncState(provider, {
		status: 'running',
		lastSyncAt: new Date().toISOString(),
		lastError: null
	});

	try {
		const seen = new Set<string>();

		// Always full pull — incremental `since` cannot detect deletes.
		const result = await syncTheCragAll(apiKey, { since: null }, async (batch) => {
			if (batch.profile) upsertProfile(batch.profile);
			upsertAscents(batch.ascents);
			for (const a of batch.ascents) seen.add(a.externalId);
		});

		if (result.profile) upsertProfile(result.profile);

		const pruned = reconcileProviderAscents(provider, seen, {
			expectedCount: result.profile?.ascentCount ?? null
		});
		repairGradesFromRawJson();

		refreshProjects();

		updateSyncState(provider, {
			status: 'idle',
			cursor: result.maxEpoch != null ? String(result.maxEpoch) : null,
			lastSuccessAt: new Date().toISOString(),
			lastError: null
		});

		// Opt-in (ROUTE_HISTORY_IMPORT): check the next 20 routes' history in the background.
		triggerRouteHistoryImport('after sync');

		return {
			skipped: false as const,
			count: result.count,
			maxEpoch: result.maxEpoch,
			profileName: result.profile?.name ?? null,
			pruned
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		updateSyncState(provider, { status: 'error', lastError: message });
		throw err;
	} finally {
		syncing = false;
	}
}

export function getSyncStatus() {
	return getOrCreateSyncState('thecrag');
}
