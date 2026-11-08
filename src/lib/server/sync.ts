import { env, getTheCragSyncConfiguration } from './env';
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
import { triggerWeatherImport } from './weatherImport';

let syncing = false;

/**
 * Sync theCrag → local SQLite.
 *
 * Pulls the full logbook from theCrag's API, upserts creates/updates, then reconciles
 * deletions. All programmatic access to theCrag goes through its API; the CSV export is
 * only ever uploaded by hand in Settings (upsert-only).
 *
 * `opts.full` is retained for Settings UI compatibility; every sync reconciles.
 */
export async function runTheCragSync(opts?: { full?: boolean }) {
	void opts;
	const configuration = getTheCragSyncConfiguration();
	const apiKey = env('THECRAG_API_KEY').trim();
	if (!configuration.configured) {
		throw new Error(
			configuration.csvModeRemoved
				? 'Automatic CSV sync has been removed (theCrag requires API access for automated sync). Set THECRAG_API_KEY, or upload your CSV export in Settings.'
				: 'THECRAG_API_KEY is not set'
		);
	}
	if (syncing) {
		return { skipped: true as const, reason: 'Sync already in progress' };
	}

	syncing = true;
	const stillCurrent = syncIsCurrent();
	const assertCurrent = () => {
		if (!stillCurrent()) throw new Error('Sync cancelled because local data was cleared.');
	};
	const provider = 'thecrag';
	getOrCreateSyncState(provider);
	updateSyncState(provider, {
		status: 'running',
		lastSyncAt: new Date().toISOString(),
		lastError: null
	});

	try {
		const seen = new Set<string>();
		const created = { routes: 0, ascents: 0 };

		// Always full pull — incremental `since` cannot detect deletes.
		const result = await syncTheCragAll(apiKey, { since: null }, async (batch) => {
			assertCurrent();
			if (batch.profile) upsertProfile(batch.profile);
			const inserted = upsertAscents(batch.ascents);
			created.routes += inserted.routes;
			created.ascents += inserted.ascents;
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

		// Opt-in (ROUTE_DATA_IMPORT): check the next 100 routes' history in the background.
		triggerRouteHistoryImport('after sync');
		// Opt-in (WEATHER_IMPORT): cache Open-Meteo daily weather for outdoor days (#268).
		triggerWeatherImport('after sync');

		return {
			skipped: false as const,
			count: result.count,
			created,
			maxEpoch: result.maxEpoch,
			profileName: result.profile?.name ?? null,
			pruned
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		if (stillCurrent()) {
			updateSyncState(provider, { status: 'error', lastError: message });
		} else {
			// Wipe cancelled this run — clear the running pill without recording success.
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
