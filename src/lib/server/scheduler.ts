import cron from 'node-cron';
import { env, hasTheCragApiKey } from './env';
import { getSyncStatus, runTheCragSync } from './sync';

let started = false;

export function startScheduler() {
	if (started) return;
	if (typeof process === 'undefined') return;
	if (!hasTheCragApiKey()) return;

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
	if (state.lastSuccessAt) return;
	console.log('[crag-stats] no successful sync yet, starting initial sync');
	runTheCragSync()
		.then((result) => {
			if (!result.skipped) console.log(`[crag-stats] initial sync done (${result.count} ascents)`);
		})
		.catch((err) => {
			console.error('[crag-stats] initial sync failed:', err instanceof Error ? err.message : err);
		});
}
