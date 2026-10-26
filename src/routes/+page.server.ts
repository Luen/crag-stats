import { getDashboardStats } from '#lib/server/analytics';
import { getSyncStatus } from '#lib/server/sync';

export function load() {
	const stats = getDashboardStats();
	const sync = getSyncStatus();
	return { stats, sync };
}
