import { env } from './env';
import { syncTheCragAll } from './providers/thecrag';
import { getOrCreateSyncState, updateSyncState, upsertAscents, upsertProfile } from './ingest';
import { refreshProjects } from './projects';

let syncing = false;

export async function runTheCragSync(opts?: { full?: boolean }) {
	const apiKey = env('THECRAG_API_KEY').trim();
	if (!apiKey) {
		throw new Error('THECRAG_API_KEY is not set');
	}
	if (syncing) {
		return { skipped: true as const, reason: 'Sync already in progress' };
	}

	syncing = true;
	const provider = 'thecrag';
	const state = getOrCreateSyncState(provider);
	const since = opts?.full ? null : state.cursor;
	updateSyncState(provider, { status: 'running', lastSyncAt: new Date().toISOString(), lastError: null });

	try {
		const result = await syncTheCragAll(apiKey, { since }, async (batch) => {
			if (batch.profile) upsertProfile(batch.profile);
			upsertAscents(batch.ascents);
		});

		if (result.profile) upsertProfile(result.profile);
		refreshProjects();

		updateSyncState(provider, {
			status: 'idle',
			cursor: result.maxEpoch != null ? String(result.maxEpoch) : state.cursor,
			lastSuccessAt: new Date().toISOString(),
			lastError: null
		});

		return {
			skipped: false as const,
			count: result.count,
			maxEpoch: result.maxEpoch,
			profileName: result.profile?.name ?? null
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
