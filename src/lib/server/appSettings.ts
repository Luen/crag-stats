import { eq } from 'drizzle-orm';
import { resolveDisplaySystems, type DisplayGradeSystems } from '#lib/grades';
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from '#lib/i18n';
import { authScope, isAuthEnabled } from './auth';
import { db, ensureSchema } from './db';
import { appSettings } from './db/schema';
import { resolveShowNotes, type ShowNotes } from './notes';
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
	| 'locale';

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

export function getAppLocale(): SupportedLocale {
	const stored = getAppSetting('locale');
	return stored && isSupportedLocale(stored) ? stored : DEFAULT_LOCALE;
}
