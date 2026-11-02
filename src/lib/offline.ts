/** Explicit public-only downloads; never cache arbitrary SSR or SvelteKit data responses. */
export const OFFLINE_SCHEMA = 1;
export const OFFLINE_MAX_ROWS = 5000;
export const OFFLINE_MAX_BYTES = 10 * 1024 * 1024;
export const OFFLINE_TTL = 7 * 24 * 60 * 60 * 1000;

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
