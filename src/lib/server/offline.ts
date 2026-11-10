import { createHash, randomUUID } from 'node:crypto';
import { authScope, isAuthEnabled } from './auth';
import { getAppSetting, getDisplayGradeSystems, setAppSetting } from './appSettings';
import { getDashboardStats, listLogbook } from './analytics';
import { OFFLINE_SCHEMA, OFFLINE_MAX_ROWS, type OfflineSnapshot } from '#lib/offline';

export function offlineAllowed(): boolean {
	return !(isAuthEnabled() && authScope() === 'all');
}

/** Wipe revokes previous public downloads when that browser next reaches this server. */
export function offlineRevision(): string {
	let revision = getAppSetting('offline_revision');
	if (!revision) {
		revision = randomUUID();
		setAppSetting('offline_revision', revision);
	}
	return createHash('sha256')
		.update(
			JSON.stringify([
				revision,
				'display-grades-v1',
				getAppSetting('show_notes'),
				getDisplayGradeSystems()
			])
		)
		.digest('hex');
}

export function buildOfflineSnapshot(): OfflineSnapshot {
	const logbook = listLogbook({
		limit: OFFLINE_MAX_ROWS,
		includeNotes: false,
		gradeSystems: getDisplayGradeSystems()
	});
	const stats = getDashboardStats(getDisplayGradeSystems());
	// Whitelist fields, even though listLogbook already removes notes. Raw JSON stays server-side.
	return {
		schema: OFFLINE_SCHEMA,
		savedAt: new Date().toISOString(),
		revision: offlineRevision(),
		total: logbook.total,
		summary: { ascents: stats.totalAscents, sends: stats.totalSends, heightM: stats.heightM },
		rows: logbook.rows.map((r) => ({
			id: r.id,
			date: r.ascentDate,
			name: r.displayName,
			grade: r.gradeLabel,
			tick: r.tickType,
			crag: r.cragName,
			partners: r.partners
		}))
	};
}
