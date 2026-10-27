import { eq } from 'drizzle-orm';
import type { GradeSystem } from '#lib/grades';
import { parseGradeSystem } from './analytics';
import { authScope, isAuthEnabled } from './auth';
import { db, ensureSchema } from './db';
import { appSettings } from './db/schema';
import { env } from './env';
import { resolveSearchIndexing, type SearchIndexing } from './seo';

export type { SearchIndexing };

/** Keys stored in `app_settings` (migration 0008). */
export type AppSettingKey = 'search_indexing' | 'grade_system' | 'dashboard_layout';

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

/** Site default grade system: Settings value → PREFERRED_GRADE_SYSTEM env → Ewbank. */
export function getPreferredGradeSystem(): GradeSystem {
	return parseGradeSystem(getAppSetting('grade_system') || env('PREFERRED_GRADE_SYSTEM', 'ewbank'));
}
