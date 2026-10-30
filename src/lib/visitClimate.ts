/**
 * "Climate on your visits" for the Sectors page (#278): a small summary of the cached
 * weather on the days you actually climbed at a crag. These are your sampled days, not
 * official climate normals, so the view carries its day count and callers must say so.
 */
import {
	isFreezeWeather,
	isHeatWeather,
	isRainWeather,
	isSnowWeather,
	type WeatherSnapshot
} from './weatherKeys';

/** Fewer cached visit days than this say little, so nothing is shown. */
export const VISIT_CLIMATE_MIN_DAYS = 5;

export type VisitClimate = {
	/** Location-days with cached weather at this crag. */
	days: number;
	/** Mean daily high / low over those days (°C, whole degrees). Null if no values. */
	avgHighC: number | null;
	avgLowC: number | null;
	/** Whole percentages of those days. */
	rainPct: number;
	snowPct: number;
	freezePct: number;
	heatPct: number;
};

function mean(values: number[]): number | null {
	if (values.length === 0) return null;
	return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

const pct = (n: number, total: number) => Math.round((n / total) * 100);

/** Null below {@link VISIT_CLIMATE_MIN_DAYS} days so thin samples never read as a climate. */
export function buildVisitClimate(days: readonly WeatherSnapshot[]): VisitClimate | null {
	if (days.length < VISIT_CLIMATE_MIN_DAYS) return null;
	const highs = days.map((d) => d.tempMaxC).filter((v): v is number => v != null);
	const lows = days.map((d) => d.tempMinC).filter((v): v is number => v != null);
	const count = (test: (w: WeatherSnapshot) => boolean) => days.filter(test).length;
	return {
		days: days.length,
		avgHighC: mean(highs),
		avgLowC: mean(lows),
		rainPct: pct(count(isRainWeather), days.length),
		snowPct: pct(count(isSnowWeather), days.length),
		freezePct: pct(count(isFreezeWeather), days.length),
		heatPct: pct(count(isHeatWeather), days.length)
	};
}
