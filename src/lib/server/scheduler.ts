import cron from 'node-cron';
import { env, getTheCragSyncConfiguration } from './env';
import { isRouteHistoryImportEnabled, triggerRouteHistoryImport } from './routeHistoryImport';
import { getSyncStatus, runTheCragSync } from './sync';
import { isWeatherImportEnabled, triggerWeatherImport } from './weatherImport';

let started = false;

export function startScheduler() {
	if (started) return;
	if (typeof process === 'undefined') return;

	const logbookConfigured = getTheCragSyncConfiguration().configured;
	// Route data and weather can run without a logbook key: a CSV-only install keeps
	// THECRAG_API_KEY unset (so the API sync never prunes the CSV rows) while
	// ROUTE_DATA_API_KEY still authorises route lookups.
	const importsConfigured = isRouteHistoryImportEnabled() || isWeatherImportEnabled();
	if (!logbookConfigured && !importsConfigured) return;
	started = true;

	if (logbookConfigured) {
		startLogbookSync();
	} else {
		console.log('[crag-stats] logbook sync off (CSV mode or no key); background imports stay on');
		resumePendingImports();
	}

	if (importsConfigured) scheduleImportRuns();
}

/** Logbook pull on SYNC_CRON. Without a valid expression, no sync is scheduled. */
function startLogbookSync() {
	const expr = env('SYNC_CRON', '0 6 * * *').trim();
	// Explicit opt-out: no scheduled or boot-time sync; Settings → Sync now still works.
	if (expr.toLowerCase() === 'off') {
		console.log('[crag-stats] SYNC_CRON=off, logbook sync not scheduled');
		return;
	}
	if (!cron.validate(expr)) {
		console.warn(`[crag-stats] Invalid SYNC_CRON "${expr}", logbook sync not scheduled`);
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
	console.log(`[crag-stats] sync scheduler started (${expr})`);

	runInitialSyncIfNeeded();
}

/**
 * Background route data / weather on IMPORT_CRON, independent of the logbook schedule so a
 * CSV-only or monthly-sync install still drains its queue. The engines' own run gap and
 * back-off make a tick with nothing pending a no-op request-wise.
 */
function scheduleImportRuns() {
	const expr = env('IMPORT_CRON', '0 6 * * *').trim();
	if (expr.toLowerCase() === 'off') {
		console.log('[crag-stats] IMPORT_CRON=off, background imports not scheduled');
		return;
	}
	if (!cron.validate(expr)) {
		console.warn(`[crag-stats] Invalid IMPORT_CRON "${expr}", background imports not scheduled`);
		return;
	}

	cron.schedule(expr, () => resumePendingImports());
	console.log(`[crag-stats] background import scheduler started (${expr})`);
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
