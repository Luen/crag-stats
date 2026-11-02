/** How often Settings re-reads import counts while a route-data or weather run is active. */
export const IMPORT_PROGRESS_POLL_MS = 2500;

export interface ImportProgressSnapshot<R, W> {
	serverNow: number;
	routeHistory: R;
	weatherImport: W;
}

/**
 * Pick the newer of the page-load snapshot and the last polled one. A form action reloads
 * the page data, which must win over an older poll; a poll newer than the load wins.
 */
export function freshestSnapshot<T extends { serverNow: number }>(loaded: T, polled: T | null): T {
	return polled && polled.serverNow > loaded.serverNow ? polled : loaded;
}

/** Poll only while a run is active, so an idle Settings page sends no requests. */
export function importsRunning(snapshot: {
	routeHistory: { running: boolean };
	weatherImport: { running: boolean };
}): boolean {
	return snapshot.routeHistory.running || snapshot.weatherImport.running;
}
