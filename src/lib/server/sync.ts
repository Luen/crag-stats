import { env, getTheCragSyncConfiguration } from './env';
import { syncTheCragCsv } from './csvLogbookSync';
import { syncIsCurrent } from './syncGeneration';
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
 * API mode pulls the full logbook, upserts creates/updates, then reconciles deletions.
 * Opt-in CSV mode uses the website export and remains upsert-only.
 *
 * `opts.full` is retained for Settings UI compatibility; API mode always reconciles.
 */
export async function runTheCragSync(opts?: { full?: boolean }) {
	void opts;
	const configuration = getTheCragSyncConfiguration();
	const apiKey = env('THECRAG_API_KEY').trim();
	if (!configuration.configured) {
		throw new Error(
			configuration.mode === 'api'
				? 'THECRAG_API_KEY is not set'
				: configuration.mode === 'csv'
					? 'CSV sync requires THECRAG_USERNAME, THECRAG_PASSWORD and a non-placeholder SESSION_SECRET (16+ characters).'
					: 'THECRAG_SYNC_MODE must be api or csv.'
		);
	}
	if (syncing) {
		return { skipped: true as const, reason: 'Sync already in progress' };
	}

	syncing = true;
	const stillCurrent = syncIsCurrent();
	const assertCurrent = () => {
		if (!stillCurrent())
			throw new Error('Sync cancelled because local data or the saved login was cleared.');
	};
	const provider = 'thecrag';
	getOrCreateSyncState(provider);
	updateSyncState(provider, {
		status: 'running',
		lastSyncAt: new Date().toISOString(),
		lastError: null
	});

	try {
		if (configuration.mode === 'csv') {
			const result = await syncTheCragCsv(stillCurrent);
			assertCurrent();
			refreshProjects();
			updateSyncState(provider, {
				status: 'idle',
				cursor: null,
				lastSuccessAt: new Date().toISOString(),
				lastError: null
			});
			triggerRouteHistoryImport('after sync');
			return { skipped: false as const, ...result, maxEpoch: null, pruned: 0 };
		}
		const seen = new Set<string>();

		// Always full pull — incremental `since` cannot detect deletes.
		const result = await syncTheCragAll(apiKey, { since: null }, async (batch) => {
			assertCurrent();
			if (batch.profile) upsertProfile(batch.profile);
			upsertAscents(batch.ascents);
			for (const a of batch.ascents) seen.add(a.externalId);
		});
		assertCurrent();

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

		// Opt-in (ROUTE_HISTORY_IMPORT): check the next 100 routes' history in the background.
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
		if (stillCurrent()) {
			updateSyncState(provider, { status: 'error', lastError: message });
		} else {
			// Forget/Wipe cancelled this run — clear the running pill without recording success.
			updateSyncState(provider, { status: 'idle', lastError: null });
		}
		throw err;
	} finally {
		syncing = false;
	}
}

export function getSyncStatus() {
	return getOrCreateSyncState('thecrag');
}
