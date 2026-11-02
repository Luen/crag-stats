/** Public-only downloads; never cache arbitrary SSR or SvelteKit data responses. */
export const OFFLINE_SCHEMA = 1;
export const OFFLINE_MAX_ROWS = 5000;
export const OFFLINE_MAX_BYTES = 10 * 1024 * 1024;
export const OFFLINE_TTL = 7 * 24 * 60 * 60 * 1000;
export const OFFLINE_REFRESH_INTERVAL = 60 * 60 * 1000;
export const OFFLINE_RETRY_INTERVAL = 5 * 60 * 1000;
export const OFFLINE_SYNC_TAG = 'crag-offline-refresh';

export type OfflineRefreshState = { enabled: boolean; lastAttempt: number };

export function offlineRefreshDue(
	snapshot: OfflineSnapshot | null,
	state: OfflineRefreshState | null,
	now = Date.now()
): boolean {
	if (state && (!state.enabled || now - state.lastAttempt < OFFLINE_RETRY_INTERVAL)) return false;
	return (
		!snapshot ||
		!snapshotIsFresh(snapshot, now) ||
		now - Date.parse(snapshot.savedAt) >= OFFLINE_REFRESH_INTERVAL
	);
}

export type OfflineSnapshot = {
	schema: number;
	savedAt: string;
	revision: string;
	total: number;
	summary: { ascents: number; sends: number; heightM: number };
	rows: {
		id: number;
		date: string | null;
		name: string;
		grade: string | null;
		tick: string | null;
		crag: string | null;
		partners: string | null;
	}[];
};

export function snapshotIsFresh(snapshot: OfflineSnapshot, now = Date.now()): boolean {
	const saved = Date.parse(snapshot.savedAt);
	return (
		snapshot.schema === OFFLINE_SCHEMA &&
		Number.isFinite(saved) &&
		saved <= now &&
		now - saved < OFFLINE_TTL
	);
}
