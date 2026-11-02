import { json } from '@sveltejs/kit';
import { getRouteHistoryStatus } from '#lib/server/routeHistoryImport';
import { getWeatherImportStatus } from '#lib/server/weatherImport';

/**
 * GET /settings/import-status — route-data and weather import counts for live progress on
 * Settings. Read-only, local counts only; never contacts theCrag or Open-Meteo. Gated with
 * the rest of /settings by the auth hook.
 */
export function GET() {
	return json(
		{
			serverNow: Date.now(),
			routeHistory: getRouteHistoryStatus(),
			weatherImport: getWeatherImportStatus()
		},
		{ headers: { 'Cache-Control': 'no-store' } }
	);
}
