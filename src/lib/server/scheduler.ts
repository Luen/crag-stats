import cron from 'node-cron';
import { env, getTheCragSyncConfiguration } from './env';
import { triggerRouteHistoryImport } from './routeHistoryImport';
import { getSyncStatus, runTheCragSync } from './sync';
import { triggerWeatherImport } from './weatherImport';

let started = false;

export function startScheduler() {
	if (started) return;
	if (typeof process === 'undefined') return;
	if (!getTheCragSyncConfiguration().configured) return;

	const expr = env('SYNC_CRON', '0 6 * * *');
	if (!cron.validate(expr)) {
		console.warn(`[crag-stats] Invalid SYNC_CRON "${expr}", scheduler not started`);
		return;
	}

	cron.schedule(expr, () => {
		runTheCragSync().catch((err) => {
			console.error(
				'[crag-stats] scheduled sync failed:',
				err instanceof Error ? err.message : err
			);
		});
	});
	started = true;
	console.log(`[crag-stats] sync scheduler started (${expr})`);

	runInitialSyncIfNeeded();
}

/**
 * Fresh install: pull the logbook straight away instead of waiting for the
 * first cron tick. "Fresh" = no sync has ever succeeded; a failed first attempt
 * is retried on the next boot.
 */
function runInitialSyncIfNeeded() {
	const state = getSyncStatus();
	if (state.lastSuccessAt) {
		resumePendingImports();
		return;
	}
	console.log('[crag-stats] no successful sync yet, starting initial sync');
	runTheCragSync()
		.then((result) => {
			if (!result.skipped) console.log(`[crag-stats] initial sync done (${result.count} ascents)`);
		})
		.catch((err) => {
			console.error('[crag-stats] initial sync failed:', err instanceof Error ? err.message : err);
		});
}

/**
 * Existing install: pick up opted-in background work an upgrade queued (e.g. new weather area
 * lookups) instead of waiting for the next sync. Both engines return without a request when
 * nothing is pending, and keep their persisted run gap and back-off across restarts.
 */
function resumePendingImports() {
	triggerRouteHistoryImport('startup');
	triggerWeatherImport('startup');
}
