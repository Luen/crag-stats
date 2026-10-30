/**
 * Logbook weather facets (#273): ascent -> cached Open-Meteo day, with the same outdoor
 * rule as the importer. Indoor routes never match a weather filter or show chips.
 */
import {
	lookupAscentWeather,
	roundCoord,
	weatherAscentDay,
	weatherDayKey,
	type WeatherLookupMap,
	type WeatherSnapshot
} from '#lib/weatherKeys';
import { isLikelyIndoorRoute } from './venue';

export type LogbookWeatherRow = {
	ascentDate: string | null;
	lat: number | null;
	lon: number | null;
	gearStyle: string | null;
	routeName: string;
	cragName: string | null;
	tagsJson: string | null;
};

export function isOutdoorLogbookRow(r: LogbookWeatherRow): boolean {
	return !isLikelyIndoorRoute({
		gearStyle: r.gearStyle,
		name: r.routeName,
		cragName: r.cragName,
		tagsJson: r.tagsJson
	});
}

/** Cached weather for an outdoor ascent, else null (indoor, no coords, not cached). */
export function logbookRowWeather(
	map: WeatherLookupMap | null | undefined,
	r: LogbookWeatherRow
): WeatherSnapshot | null {
	if (!map || map.size === 0) return null;
	return lookupAscentWeather(map, { ...r, outdoor: isOutdoorLogbookRow(r) });
}

/**
 * Outdoor ascents with coordinates and a past day that have no usable cached weather: the
 * importer's backlog. Today (UTC) is excluded because the archive is incomplete for it.
 */
export function isMissingLogbookWeather(
	map: WeatherLookupMap | null | undefined,
	r: LogbookWeatherRow,
	todayUtc: string
): boolean {
	const day = weatherAscentDay(r.ascentDate);
	if (!day || day >= todayUtc) return false;
	if (r.lat == null || r.lon == null) return false;
	if (!Number.isFinite(r.lat) || !Number.isFinite(r.lon)) return false;
	if (!isOutdoorLogbookRow(r)) return false;
	return !map?.has(weatherDayKey(roundCoord(r.lat), roundCoord(r.lon), day));
}
