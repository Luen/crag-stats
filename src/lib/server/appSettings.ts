import { eq, sql } from 'drizzle-orm';
import { resolveDisplaySystems, type DisplayGradeSystems } from '#lib/grades';
import {
	canonicalTickKey,
	parseTickTypeSettings,
	serializeTickTypeSettings,
	STANDARD_TICKS,
	type AvailableTickType,
	type TickTypeSettings
} from '#lib/tickSettings';
import { authScope, isAuthEnabled } from './auth';
import { db, ensureSchema } from './db';
import { appSettings, ascents } from './db/schema';
import { resolveShowNotes, type ShowNotes } from './notes';
import { classifyTick } from './providers/types';
import { resolveSearchIndexing, type SearchIndexing } from './seo';

export type { SearchIndexing };

/** Keys stored in `app_settings` (migration 0008). */
export type AppSettingKey =
	| 'search_indexing'
	/** Legacy single display system; still read as the fallback for the split keys below. */
	| 'grade_system'
	| 'route_grade_system'
	| 'boulder_grade_system'
	| 'dashboard_layout'
	| 'show_notes'
	| 'offline_revision'
	| 'counted_tick_types';

export function getAppSetting(key: AppSettingKey): string | null {
	ensureSchema();
	return db.select().from(appSettings).where(eq(appSettings.key, key)).get()?.value ?? null;
}

export function setAppSetting(key: AppSettingKey, value: string) {
	ensureSchema();
	const updatedAt = new Date().toISOString();
	db.insert(appSettings)
		.values({ key, value, updatedAt })
		.onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt } })
		.run();
}

export function deleteAppSetting(key: AppSettingKey) {
	ensureSchema();
	db.delete(appSettings).where(eq(appSettings.key, key)).run();
}

export function getSearchIndexing(): SearchIndexing {
	return resolveSearchIndexing({
		authEnabled: isAuthEnabled(),
		scope: authScope(),
		stored: getAppSetting('search_indexing')
	});
}

/** Private ascent notes: Settings only; off when unset. */
export function getShowNotes(): ShowNotes {
	return resolveShowNotes({ stored: getAppSetting('show_notes') });
}

/**
 * Site display systems from Settings: one for routes (Ewbank when unset) and one for
 * boulders (V-scale when unset). Installs that only saved the legacy `grade_system`
 * keep showing what it showed.
 */
export function getDisplayGradeSystems(): DisplayGradeSystems {
	return resolveDisplaySystems({
		route: getAppSetting('route_grade_system'),
		boulder: getAppSetting('boulder_grade_system'),
		legacy: getAppSetting('grade_system')
	});
}

export function getRouteGradeSystem() {
	return getDisplayGradeSystems().route;
}

export function getBoulderGradeSystem() {
	return getDisplayGradeSystems().boulder;
}

export function getTickTypeSettings(): TickTypeSettings {
	return parseTickTypeSettings(getAppSetting('counted_tick_types'));
}

export function setTickTypeSettings(settings: TickTypeSettings) {
	setAppSetting('counted_tick_types', serializeTickTypeSettings(settings));
}

export function listAvailableTickTypes(): AvailableTickType[] {
	ensureSchema();
	const counts = new Map<string, number>();
	try {
		const rows = db
			.select({
				tickType: ascents.tickType,
				count: sql<number>`count(*)`
			})
			.from(ascents)
			.groupBy(ascents.tickType)
			.all();
		for (const r of rows) {
			if (r.tickType) {
				const canon = canonicalTickKey(r.tickType);
				counts.set(canon, (counts.get(canon) ?? 0) + Number(r.count));
			}
		}
	} catch {
		// Schema or table not available yet
	}

	const knownKeys = new Set(STANDARD_TICKS.map((t) => t.key));
	const out: AvailableTickType[] = STANDARD_TICKS.map((t) => ({
		...t,
		count: counts.get(t.key) ?? 0
	}));

	for (const [key, count] of counts.entries()) {
		if (!knownKeys.has(key)) {
			out.push({
				key,
				name: key.charAt(0).toUpperCase() + key.slice(1),
				category: 'other',
				// Provider tick names we don't ship in STANDARD_TICKS still need the
				// right send/attempt flag, or "Sends only" would hide real sends.
				isSend: classifyTick(key).isSend,
				count
			});
		}
	}
	return out;
}
