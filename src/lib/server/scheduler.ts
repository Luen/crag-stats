import cron from 'node-cron';
import { env, hasTheCragApiKey } from './env';
import { runTheCragSync } from './sync';

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
}
