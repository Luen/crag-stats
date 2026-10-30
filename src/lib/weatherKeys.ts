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
};

/** WMO weather interpretation codes that indicate snowfall (Open-Meteo / WMO). */
const SNOW_CODES = new Set([71, 72, 73, 74, 75, 76, 77, 85, 86]);

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

export type WeatherCondition = 'heat' | 'freeze' | 'rain' | 'snow';

export function weatherConditions(w: WeatherSnapshot): WeatherCondition[] {
	const out: WeatherCondition[] = [];
	if (isHeatWeather(w)) out.push('heat');
	if (isFreezeWeather(w)) out.push('freeze');
	if (isSnowWeather(w)) out.push('snow');
	else if (isRainWeather(w)) out.push('rain');
	return out;
}
