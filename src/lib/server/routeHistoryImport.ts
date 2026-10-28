/**
 * Route-history import wiring (#68): reads `.env`, plugs the impers client into the engine, and
 * starts runs in the background (after each logbook sync, or from Settings). Off unless
 * ROUTE_HISTORY_IMPORT=true. All pacing and caching rules live in `routeHistoryEngine.ts`.
 */
import { env, envFlag } from './env';
import { openRouteHistoryClient } from './providers/thecrag/routeHistoryApi';
import {
	applyCachedHistoryMarks,
	resetRouteHistoryFetches,
	routeHistoryStatus,
	runRouteHistoryImportOnce,
	type MarkRules,
	type RouteHistoryConfig,
	type RouteHistoryDeps,
	type RouteHistoryRunResult,
	type RouteHistoryStatus
} from './routeHistoryEngine';

function config(): RouteHistoryConfig {
	return {
		enabled: envFlag('ROUTE_HISTORY_IMPORT'),
		apiKey: env('THECRAG_API_KEY').trim()
	};
}

const deps: RouteHistoryDeps = {
	openClient: openRouteHistoryClient,
	sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
	now: () => Date.now()
};

export function isRouteHistoryImportEnabled(): boolean {
	return config().enabled;
}

export function getRouteHistoryStatus(): RouteHistoryStatus {
	return routeHistoryStatus(config());
}

/** Run one batch of up to 100 routes now and wait for it (tests / scripts). */
export function runRouteHistoryImport(): Promise<RouteHistoryRunResult> {
	return runRouteHistoryImportOnce(config(), deps);
}

/**
 * Start one run in the background and return straight away. Safe to call often: the engine
 * refuses while a run is active, inside the 1-minute run gap, or during a back-off.
 */
export function triggerRouteHistoryImport(reason: string): boolean {
	const c = config();
	if (!c.enabled || !c.apiKey) return false;
	void runRouteHistoryImportOnce(c, deps)
		.then((r) => {
			if (r.outcome === 'ran' || r.outcome === 'blocked' || r.outcome === 'error') {
				console.log(`[crag-stats] route history (${reason}): ${r.message}`);
			}
		})
		.catch((err) => {
			console.error(
				'[crag-stats] route history run failed:',
				err instanceof Error ? err.message : err
			);
		});
	return true;
}

export function reapplyRouteHistoryMarks(rules: MarkRules) {
	return applyCachedHistoryMarks(rules);
}

export function refreshAllRouteHistory(): number {
	return resetRouteHistoryFetches();
}
