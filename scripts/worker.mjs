/**
 * Standalone sync worker for Docker Compose.
 * Runs migrations, triggers an immediate sync via the app, then schedules SYNC_CRON.
 */
import cron from 'node-cron';
import { runMigrations } from './migrate.mjs';

const expr = process.env.SYNC_CRON || '0 6 * * *';

runMigrations();

async function pingAppSync() {
	const base = process.env.APP_INTERNAL_URL || 'http://app:3000';
	try {
		const res = await fetch(`${base}/api/sync`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-worker-secret': process.env.SESSION_SECRET || ''
			}
		});
		if (!res.ok) {
			console.error('[worker] sync endpoint returned', res.status);
			return;
		}
		const json = await res.json();
		console.log('[worker] sync ok', json);
	} catch (err) {
		console.error(
			'[worker] could not reach app sync endpoint:',
			err instanceof Error ? err.message : err
		);
	}
}

console.log(`[worker] crag-stats worker up (cron: ${expr})`);
await pingAppSync();

if (cron.validate(expr)) {
	cron.schedule(expr, () => {
		pingAppSync().catch(console.error);
	});
} else {
	console.warn('[worker] invalid SYNC_CRON');
}

setInterval(() => {}, 1 << 30);
