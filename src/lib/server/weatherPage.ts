import { eq } from 'drizzle-orm';
import { buildWeatherConditionsView } from '#lib/weatherStats';
import { buildWeatherPerformanceView } from '#lib/weatherPerformance';
import { ascentWeatherKey } from '#lib/weatherKeys';
import { calendarDay } from '#lib/calendarDay';
import { theCragAscentUrl } from '#lib/thecragUrls';
import { isTickCountedInAnalytics, type TickTypeSettings } from '#lib/tickSettings';
import { getTickTypeSettings } from './appSettings';
import { db, ensureSchema } from './db';
import { ascents, routes } from './db/schema';
import { loadWeatherSnapshotMap, loadWeatherCachedKeys } from './weatherEngine';
import { attachWeatherLocation, loadWeatherLocations } from './weatherLocations';
import { isOutdoorLogbookRow } from './logbookWeather';

/** Local cache only: no notes, provider payloads or import actions reach the page. */
export function getWeatherPageData(tickSettings?: TickTypeSettings) {
	ensureSchema();
	const locations = loadWeatherLocations();
	const settings = tickSettings ?? getTickTypeSettings();
	const rows = db
		.select({
			routeId: routes.id,
			ascentId: ascents.id,
			ascentDate: ascents.ascentDate,
			ascentLabel: ascents.ascentLabel,
			pitchLabel: ascents.pitchLabel,
			ascentUrl: ascents.ascentUrl,
			externalId: ascents.externalId,
			provider: ascents.provider,
			isSend: ascents.isSend,
			isAttempt: ascents.isAttempt,
			tickType: ascents.tickType,
			effectiveGradeScore: ascents.effectiveGradeScore,
			gradeScore: routes.gradeScore,
			gradeSystem: routes.gradeSystem,
			gearStyle: routes.gearStyle,
			routeName: routes.name,
			cragName: routes.cragName,
			tagsJson: routes.tagsJson,
			url: routes.url,
			lat: routes.lat,
			lon: routes.lon
		})
		.from(ascents)
		.innerJoin(routes, eq(ascents.routeId, routes.id))
		.all()
		.filter((row) => isTickCountedInAnalytics(row.tickType, settings))
		.map((row) => {
			const base = row.ascentLabel?.trim() || row.routeName;
			return {
				...attachWeatherLocation(row, locations),
				outdoor: isOutdoorLogbookRow(row),
				routeName:
					row.pitchLabel && !base.toLowerCase().includes(row.pitchLabel.toLowerCase())
						? `${base} (${row.pitchLabel})`
						: base,
				ascentUrl:
					row.ascentUrl || (row.provider === 'thecrag' ? theCragAscentUrl(row.externalId) : null)
			};
		});
	const weather = loadWeatherSnapshotMap();
	const checked = loadWeatherCachedKeys();
	const keys = new Set<string>();
	let unresolvedAscents = 0;
	for (const row of rows) {
		if (!row.outdoor || !calendarDay(row.ascentDate)) continue;
		const key = ascentWeatherKey(row);
		if (key) keys.add(key);
		else unresolvedAscents++;
	}
	return {
		conditions: buildWeatherConditionsView(rows, weather),
		performance: buildWeatherPerformanceView(rows, weather),
		coverage: {
			resolvedDays: keys.size,
			cachedDays: [...keys].filter((key) => weather.has(key)).length,
			unavailableDays: [...keys].filter((key) => checked.has(key) && !weather.has(key)).length,
			uncheckedDays: [...keys].filter((key) => !checked.has(key)).length,
			unresolvedAscents
		}
	};
}
