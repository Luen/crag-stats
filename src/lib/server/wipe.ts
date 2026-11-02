import { sql } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { resetFirstImport } from './firstImport';
import { invalidateRouteHistoryRuns } from './routeHistoryEngine';
import { forgetTheCragSession } from './theCragWebSession';
import { invalidateWeatherRuns } from './weatherEngine';
import { invalidateWeatherLocations } from './weatherLocations';

/**
 * Settings → Wipe: clears every cached and local table and invalidates in-flight imports.
 * Kept apart from `analytics.ts` so tests that only need a clean DB skip the analytics graph.
 */
export function wipeAllData() {
	ensureSchema();
	db.run(sql`DELETE FROM app_settings WHERE key = 'offline_revision'`);
	forgetTheCragSession();
	resetFirstImport();
	// Abandon any in-flight route-history import before clearing tables (#74).
	invalidateRouteHistoryRuns();
	invalidateWeatherRuns();
	invalidateWeatherLocations();
	db.run(sql`DELETE FROM projects`);
	db.run(sql`DELETE FROM goals`);
	db.run(sql`DELETE FROM first_ascents`);
	db.run(sql`DELETE FROM first_ascent_import_skips`);
	db.run(sql`DELETE FROM route_history`);
	db.run(sql`DELETE FROM route_history_fetches`);
	db.run(sql`DELETE FROM route_history_import_state`);
	db.run(sql`DELETE FROM weather_locations`);
	db.run(sql`DELETE FROM weather_area_cache`);
	db.run(sql`DELETE FROM weather_place_overrides`);
	db.run(sql`DELETE FROM weather_place_searches`);
	db.run(sql`DELETE FROM weather_days`);
	db.run(sql`DELETE FROM weather_import_state`);
	db.run(sql`DELETE FROM ascents`);
	db.run(sql`DELETE FROM routes`);
	db.run(sql`DELETE FROM profiles`);
	db.run(sql`DELETE FROM sync_state`);
}
