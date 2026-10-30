/**
 * Shared weather cache keys and day classification (#268).
 * Lat/lon are rounded to 1 decimal so nearby routes at one crag share a row.
 */

/** Round a coordinate to 1 decimal place (Open-Meteo cache key). */
export function roundCoord(value: number): number {
	return Math.round(value * 10) / 10;
}

export function weatherDayKey(latKey: number, lonKey: number, day: string): string {
	return `${latKey}|${lonKey}|${day}`;
}

export type WeatherSnapshot = {
	tempMaxC: number | null;
	tempMinC: number | null;
	precipMm: number | null;
	weatherCode: number | null;
	/** Daily max 10 m wind (km/h); null when not fetched / missing. */
	windMaxKmh?: number | null;
	/** Daily mean relative humidity (%); null when not fetched / missing. */
	humidityMean?: number | null;
};

/** WMO weather interpretation codes that indicate snowfall (Open-Meteo / WMO). */
const SNOW_CODES = new Set([71, 72, 73, 74, 75, 76, 77, 85, 86]);

/** WMO thunderstorm / severe codes — not “fair” / bluebird. */
const STORM_CODES = new Set([95, 96, 97, 98, 99]);

/** Outdoor day counts as very windy at or above this max wind (km/h). */
export const WINDY_MAX_KMH = 50;

/** Pleasant high for bluebird / fair days (°C inclusive). */
export const FAIR_TEMP_MIN_C = 15;
export const FAIR_TEMP_MAX_C = 25;

/** Mean humidity at or above this % counts as sticky. */
export const STICKY_HUMIDITY_PCT = 85;

/** Non-snow precip (mm) that counts as a storm-send day. */
export const STORM_PRECIP_MM = 10;

export function isSnowWeather(w: WeatherSnapshot): boolean {
	if (w.weatherCode != null && SNOW_CODES.has(w.weatherCode)) return true;
	const precip = w.precipMm;
	const tmax = w.tempMaxC;
	return precip != null && precip >= 1 && tmax != null && tmax <= 1;
}

export function isHeatWeather(w: WeatherSnapshot): boolean {
	return w.tempMaxC != null && w.tempMaxC >= 35;
}

export function isFreezeWeather(w: WeatherSnapshot): boolean {
	return w.tempMinC != null && w.tempMinC <= 0;
}

/** Rain that is not classified as snow (precip ≥ 1 mm). */
export function isRainWeather(w: WeatherSnapshot): boolean {
	if (isSnowWeather(w)) return false;
	return w.precipMm != null && w.precipMm >= 1;
}

/** Very windy: daily max 10 m wind ≥ {@link WINDY_MAX_KMH} km/h (#281). */
export function isWindyWeather(w: WeatherSnapshot): boolean {
	const wind = w.windMaxKmh;
	return wind != null && wind >= WINDY_MAX_KMH;
}

/** Thunderstorm / severe WMO code. */
export function isStormCode(w: WeatherSnapshot): boolean {
	return w.weatherCode != null && STORM_CODES.has(w.weatherCode);
}

/**
 * Bluebird / fair day: high in 15–25°C, precip ≈ 0, not snow/storm WMO (#271).
 * Used by badges, logbook `weather=fair`, and fair-weather metrics.
 */
export function isFairWeather(w: WeatherSnapshot): boolean {
	const tmax = w.tempMaxC;
	if (tmax == null || tmax < FAIR_TEMP_MIN_C || tmax > FAIR_TEMP_MAX_C) return false;
	const precip = w.precipMm;
	if (precip == null || !Number.isFinite(precip) || precip < 0 || precip >= 0.1) return false;
	if (isSnowWeather(w) || isStormCode(w)) return false;
	return true;
}

/** High mean humidity (≥ {@link STICKY_HUMIDITY_PCT}%). */
export function isStickyHumidity(w: WeatherSnapshot): boolean {
	const h = w.humidityMean;
	return h != null && h >= STICKY_HUMIDITY_PCT;
}

/** Heavy non-snow precip (≥ {@link STORM_PRECIP_MM} mm). */
export function isStormPrecip(w: WeatherSnapshot): boolean {
	if (isSnowWeather(w)) return false;
	return w.precipMm != null && w.precipMm >= STORM_PRECIP_MM;
}

export type WeatherCondition =
	'heat' | 'freeze' | 'rain' | 'snow' | 'wind' | 'fair' | 'sticky' | 'storm';

export function weatherConditions(w: WeatherSnapshot): WeatherCondition[] {
	const out: WeatherCondition[] = [];
	if (isHeatWeather(w)) out.push('heat');
	if (isFreezeWeather(w)) out.push('freeze');
	if (isSnowWeather(w)) out.push('snow');
	else if (isRainWeather(w)) out.push('rain');
	if (isWindyWeather(w)) out.push('wind');
	if (isFairWeather(w)) out.push('fair');
	if (isStickyHumidity(w)) out.push('sticky');
	if (isStormPrecip(w) || isStormCode(w)) out.push('storm');
	return out;
}

/** Lookup of cached `ok` Open-Meteo days by {@link weatherDayKey}. */
export type WeatherLookupMap = ReadonlyMap<string, WeatherSnapshot>;

/**
 * Calendar day (`YYYY-MM-DD`) for an ascent date, or null when missing / partial
 * (`2018-00-00`). Shared by badges, logbook, calendar and dashboard weather surfaces.
 */
export function weatherAscentDay(date: string | null | undefined): string | null {
	if (!date) return null;
	const key = date.trim().slice(0, 10);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
	const parsed = new Date(`${key}T12:00:00Z`);
	if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== key) return null;
	return key;
}

/** Cache key for an ascent's (rounded lat, lon, day), or null without coords / valid day. */
export function ascentWeatherKey(row: {
	ascentDate: string | null | undefined;
	lat?: number | null;
	lon?: number | null;
}): string | null {
	const day = weatherAscentDay(row.ascentDate);
	if (!day) return null;
	if (row.lat == null || row.lon == null) return null;
	if (!Number.isFinite(row.lat) || !Number.isFinite(row.lon)) return null;
	return weatherDayKey(roundCoord(row.lat), roundCoord(row.lon), day);
}

/**
 * Cached weather for one ascent. Null when the map is absent/empty, coordinates or day are
 * missing, the day is not cached, or the route is indoor (`outdoor === false`).
 */
export function lookupAscentWeather(
	map: WeatherLookupMap | null | undefined,
	row: {
		ascentDate: string | null | undefined;
		lat?: number | null;
		lon?: number | null;
		/** Pass `false` for indoor/gym routes: they never match. Defaults to true. */
		outdoor?: boolean;
	}
): WeatherSnapshot | null {
	if (!map || map.size === 0 || row.outdoor === false) return null;
	const key = ascentWeatherKey(row);
	return key ? (map.get(key) ?? null) : null;
}

/** Logbook / chip facets backed by the weather cache. */
export const WEATHER_FILTER_KEYS = ['heat', 'freeze', 'rain', 'snow', 'fair'] as const;
export type WeatherFilterKey = (typeof WEATHER_FILTER_KEYS)[number];

export function isWeatherFilterKey(v: string | null | undefined): v is WeatherFilterKey {
	return v != null && (WEATHER_FILTER_KEYS as readonly string[]).includes(v);
}

/** Whether a cached day matches one logbook weather facet. */
export function matchesWeatherFilter(w: WeatherSnapshot, key: WeatherFilterKey): boolean {
	switch (key) {
		case 'heat':
			return isHeatWeather(w);
		case 'freeze':
			return isFreezeWeather(w);
		case 'rain':
			return isRainWeather(w);
		case 'snow':
			return isSnowWeather(w);
		case 'fair':
			return isFairWeather(w);
	}
}

export type WeatherChipKey = 'heat' | 'freeze' | 'rain' | 'snow' | 'wind' | 'fair';

/** Structured chip data; the component formats numbers with the display locale. */
export type WeatherChip = {
	key: WeatherChipKey;
	/** Visible word, e.g. "Hot". Never colour-only. */
	name: string;
	value: number | null;
	unit: '°C' | 'mm' | 'km/h' | null;
};

/**
 * Chips for one cached day (logbook rows, recent activities). Empty when nothing notable;
 * callers hide the whole strip then. Each chip is plain text so it reads without colour.
 */
export function weatherChips(w: WeatherSnapshot): WeatherChip[] {
	const out: WeatherChip[] = [];
	if (isHeatWeather(w))
		out.push({ key: 'heat', name: 'Hot', value: Math.round(w.tempMaxC!), unit: '°C' });
	if (isFreezeWeather(w))
		out.push({ key: 'freeze', name: 'Freezing', value: Math.round(w.tempMinC!), unit: '°C' });
	if (isSnowWeather(w)) out.push({ key: 'snow', name: 'Snow', value: null, unit: null });
	else if (isRainWeather(w))
		out.push({ key: 'rain', name: 'Rain', value: Math.round(w.precipMm! * 10) / 10, unit: 'mm' });
	if (isWindyWeather(w))
		out.push({ key: 'wind', name: 'Windy', value: Math.round(w.windMaxKmh!), unit: 'km/h' });
	if (isFairWeather(w))
		out.push({ key: 'fair', name: 'Fair', value: Math.round(w.tempMaxC!), unit: '°C' });
	return out;
}
