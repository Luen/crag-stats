/**
 * Route-history import wiring (#68): reads `.env`, plugs the impers client into the engine, and
 * starts runs in the background (after each logbook sync, on a schedule, or from Settings). Off
 * unless ROUTE_DATA_IMPORT=true. All pacing and caching rules live in `routeHistoryEngine.ts`.
 */
import { env, envFlag, logbookMode, theCragUsername } from './env';
import { openRouteHistoryClient } from './providers/thecrag/routeHistoryApi';
import { triggerWeatherImport } from './weatherImport';
import {
	applyCachedHistoryMarks,
	parseRouteDataRefreshDays,
	resetRouteHistoryFetches,
	routeHistoryStatus,
	runRouteHistoryImportOnce,
	type MarkRules,
	type RouteHistoryConfig,
	type RouteHistoryDeps,
	type RouteHistoryRunResult,
	type RouteHistoryStatus
} from './routeHistoryEngine';

/**
 * FA/FFA identity, from `.env` only when the logbook arrives by CSV: an API sync saves
 * `profiles.login`, which is the account this install actually holds. Reading the variable
 * in API mode would let a leftover value (it predates this feature) stop matching.
 */
function configuredOwnerLogin(): string | null {
	return logbookMode() === 'csv' ? theCragUsername() : null;
}

export function routeHistoryConfig(): RouteHistoryConfig {
	return {
		enabled: envFlag('ROUTE_DATA_IMPORT'),
		apiKey: env('THECRAG_API_KEY').trim(),
		ownerLogin: configuredOwnerLogin(),
		refreshDays: parseRouteDataRefreshDays(env('ROUTE_DATA_REFRESH_DAYS')),
		weatherEnabled: envFlag('WEATHER_IMPORT')
	};
}

const deps: RouteHistoryDeps = {
	openClient: openRouteHistoryClient,
	sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
	now: () => Date.now()
};

export function isRouteHistoryImportEnabled(): boolean {
	return routeHistoryConfig().enabled;
}

export function getRouteHistoryStatus(): RouteHistoryStatus {
	return routeHistoryStatus(routeHistoryConfig());
}

/** Run one batch of up to 100 routes now and wait for it (tests / scripts). */
export async function runRouteHistoryImport(): Promise<RouteHistoryRunResult> {
	const result = await runRouteHistoryImportOnce(routeHistoryConfig(), deps);
	if (result.outcome === 'ran') triggerWeatherImport('route locations');
	return result;
}

/**
 * Start one run in the background and return straight away. Safe to call often: the engine
 * refuses while a run is active, inside the 1-minute run gap, or during a back-off.
 */
export function triggerRouteHistoryImport(reason: string): boolean {
	const c = routeHistoryConfig();
	if (!c.enabled || !c.apiKey) return false;
	void runRouteHistoryImportOnce(c, deps)
		.then((r) => {
			if (r.outcome === 'ran') triggerWeatherImport('route locations');
			if (r.outcome === 'ran' || r.outcome === 'blocked' || r.outcome === 'error') {
				console.log(`[crag-stats] route data (${reason}): ${r.message}`);
			}
		})
		.catch((err) => {
			console.error(
				'[crag-stats] route data import run failed:',
				err instanceof Error ? err.message : err
			);
		});
	return true;
}

export function reapplyRouteHistoryMarks(rules: MarkRules) {
	return applyCachedHistoryMarks(rules, configuredOwnerLogin());
}

export function refreshAllRouteHistory(): number {
	return resetRouteHistoryFetches();
}
