/**
 * Weather conditions dashboard card (#272): what your outdoor climbing days looked like,
 * from the opt-in Open-Meteo cache. Pure — callers pass rows plus the cached-day lookup.
 *
 * A "day" here is a location-day: one calendar day at one rounded lat/lon (the cache key),
 * so a day split across two crags counts twice and a gym session never counts.
 */
import {
	isFairWeather,
	isFreezeWeather,
	isHeatWeather,
	isRainWeather,
	isSnowWeather,
	isWindyWeather,
	ascentWeatherKey,
	type WeatherLocation,
	weatherAscentDay,
	type WeatherLookupMap,
	type WeatherSnapshot
} from './weatherKeys';

export type WeatherAscentRow = {
	ascentDate: string | null;
	weatherLocation?: WeatherLocation | null;
	ascentId?: number | null;
	lat?: number | null;
	lon?: number | null;
	/** False for likely indoor routes; undefined counts as outdoor. */
	outdoor?: boolean;
	routeName?: string | null;
	url?: string | null;
	ascentUrl?: string | null;
};

export type WeatherExtreme = {
	tempC: number;
	routeName: string | null;
	/** `YYYY-MM-DD` */
	date: string;
	/** theCrag ascent link (preferred) or route link. */
	href: string | null;
};

export type WeatherShareKey = 'rain' | 'snow' | 'freeze' | 'heat';

export type WeatherShare = {
	key: WeatherShareKey;
	label: string;
	days: number;
	/** Share of days with weather, 0–100, one decimal. */
	pct: number;
};

export type WeatherHistogramBin = {
	id: string;
	label: string;
	days: number;
};

/** The fair-weather metric needs at least this many outdoor days with cached weather (#280). */
export const FAIR_WEATHER_MIN_DAYS = 20;

export type FairWeatherLabel = 'fair-leaning' | 'all-weather' | 'mixed';

export type FairWeatherMetric = {
	/** Days with cached weather the metric is based on (>= {@link FAIR_WEATHER_MIN_DAYS}). */
	days: number;
	/** 15-25°C, dry, no snow/thunderstorm. */
	fairDays: number;
	/** Heat, freezing, rain, snow or very windy. */
	toughDays: number;
	fairPct: number;
	toughPct: number;
	label: FairWeatherLabel;
};

export type WeatherConditionsView = {
	/** Outdoor location-days with route coordinates. */
	outdoorDays: number;
	withWeather: number;
	withoutWeather: number;
	hottest: WeatherExtreme | null;
	coldest: WeatherExtreme | null;
	shares: WeatherShare[];
	/** Daily high (°C) in 5° bins; first bin is below 0°, last is 35° and up. */
	histogram: WeatherHistogramBin[];
	/** Fair-weather vs all-weather mix; null until enough weather days (#280). */
	fairWeather: FairWeatherMetric | null;
};

const HIST_STEP = 5;
const HIST_MIN = 0;
const HIST_MAX = 35;

export function histogramBinLabel(index: number): string {
	const bins = (HIST_MAX - HIST_MIN) / HIST_STEP + 2; // <0, 0–4 … 30–34, 35+
	if (index <= 0) return `<${HIST_MIN}°`;
	if (index >= bins - 1) return `${HIST_MAX}°+`;
	const from = HIST_MIN + (index - 1) * HIST_STEP;
	return `${from}–${from + HIST_STEP - 1}°`;
}

/** Logbook drill-down using the same exact Celsius edges as the histogram. */
export function histogramBinHref(index: number): string {
	const last = (HIST_MAX - HIST_MIN) / HIST_STEP + 1;
	if (index <= 0) return `/logbook?weatherHighMax=${HIST_MIN}`;
	if (index >= last) return `/logbook?weatherHighMin=${HIST_MAX}`;
	const from = HIST_MIN + (index - 1) * HIST_STEP;
	return `/logbook?weatherHighMin=${from}&weatherHighMax=${from + HIST_STEP}`;
}

export function histogramBinIndex(tempMaxC: number): number {
	if (tempMaxC < HIST_MIN) return 0;
	if (tempMaxC >= HIST_MAX) return (HIST_MAX - HIST_MIN) / HIST_STEP + 1;
	return Math.floor((tempMaxC - HIST_MIN) / HIST_STEP) + 1;
}

type DayAgg = {
	day: string;
	weather: WeatherSnapshot | null;
	rep: WeatherAscentRow;
};

function repWins(a: WeatherAscentRow, b: WeatherAscentRow): boolean {
	// Lowest ascent id is the representative climb for a day; rows without an id lose.
	const ai = a.ascentId ?? Number.MAX_SAFE_INTEGER;
	const bi = b.ascentId ?? Number.MAX_SAFE_INTEGER;
	return ai < bi;
}

export function isToughWeather(w: WeatherSnapshot): boolean {
	return (
		isHeatWeather(w) ||
		isFreezeWeather(w) ||
		isRainWeather(w) ||
		isSnowWeather(w) ||
		isWindyWeather(w)
	);
}

/** Mostly fair days lean fair-weather; half or more tough days read as all-weather. */
export function fairWeatherLabel(fairPct: number, toughPct: number): FairWeatherLabel {
	// A mild, dry day can still be windy or freezing overnight; tough takes priority.
	if (toughPct >= 50) return 'all-weather';
	if (fairPct >= 60) return 'fair-leaning';
	return 'mixed';
}

export function buildFairWeatherMetric(days: readonly WeatherSnapshot[]): FairWeatherMetric | null {
	if (days.length < FAIR_WEATHER_MIN_DAYS) return null;
	const fairDays = days.filter(isFairWeather).length;
	const toughDays = days.filter(isToughWeather).length;
	const fairPct = pct(fairDays, days.length);
	const toughPct = pct(toughDays, days.length);
	return {
		days: days.length,
		fairDays,
		toughDays,
		fairPct,
		toughPct,
		label: fairWeatherLabel((fairDays / days.length) * 100, (toughDays / days.length) * 100)
	};
}

function pct(days: number, total: number): number {
	return total > 0 ? Math.round((days / total) * 1000) / 10 : 0;
}

function extreme(
	days: DayAgg[],
	pick: (w: WeatherSnapshot) => number | null,
	better: (a: number, b: number) => boolean
): WeatherExtreme | null {
	let best: { temp: number; agg: DayAgg } | null = null;
	for (const agg of days) {
		if (!agg.weather) continue;
		const t = pick(agg.weather);
		if (t == null || !Number.isFinite(t)) continue;
		if (
			!best ||
			better(t, best.temp) ||
			(t === best.temp && agg.day.localeCompare(best.agg.day) < 0)
		) {
			best = { temp: t, agg };
		}
	}
	if (!best) return null;
	return {
		tempC: best.temp,
		routeName: (best.agg.rep.routeName || '').trim() || null,
		date: best.agg.day,
		href: best.agg.rep.ascentUrl || best.agg.rep.url || null
	};
}

/**
 * Null until at least one outdoor climbing day has cached weather, so the card stays hidden
 * for owners who never enabled the import (same pattern as route popularity).
 */
export function buildWeatherConditionsView(
	rows: readonly WeatherAscentRow[],
	weatherByKey: WeatherLookupMap | null | undefined
): WeatherConditionsView | null {
	if (!weatherByKey || weatherByKey.size === 0) return null;

	const days = new Map<string, DayAgg>();
	for (const row of rows) {
		if (row.outdoor === false) continue;
		const day = weatherAscentDay(row.ascentDate);
		const key = ascentWeatherKey(row);
		if (!day || !key) continue;
		const cur = days.get(key);
		if (cur) {
			if (repWins(row, cur.rep)) cur.rep = row;
			continue;
		}
		days.set(key, { day, weather: weatherByKey.get(key) ?? null, rep: row });
	}

	const all = [...days.values()];
	const withData = all.filter((d) => d.weather != null);
	if (withData.length === 0) return null;

	const count = (test: (w: WeatherSnapshot) => boolean) =>
		withData.filter((d) => test(d.weather!)).length;
	const shareOf = (key: WeatherShareKey, label: string, days: number): WeatherShare => ({
		key,
		label,
		days,
		pct: pct(days, withData.length)
	});

	const bins = (HIST_MAX - HIST_MIN) / HIST_STEP + 2;
	const histogram: WeatherHistogramBin[] = Array.from({ length: bins }, (_, i) => ({
		id: `hist:${i}`,
		label: histogramBinLabel(i),
		days: 0
	}));
	for (const d of withData) {
		const t = d.weather!.tempMaxC;
		if (t == null || !Number.isFinite(t)) continue;
		histogram[histogramBinIndex(t)]!.days += 1;
	}

	return {
		outdoorDays: all.length,
		withWeather: withData.length,
		withoutWeather: all.length - withData.length,
		hottest: extreme(
			all,
			(w) => w.tempMaxC,
			(a, b) => a > b
		),
		coldest: extreme(
			all,
			(w) => w.tempMinC,
			(a, b) => a < b
		),
		shares: [
			shareOf('rain', 'Rainy', count(isRainWeather)),
			shareOf('snow', 'Snowy', count(isSnowWeather)),
			shareOf('freeze', 'Freezing', count(isFreezeWeather)),
			shareOf('heat', 'Hot', count(isHeatWeather))
		],
		histogram,
		fairWeather: buildFairWeatherMetric(withData.map((d) => d.weather!))
	};
}
