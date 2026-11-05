/**
 * Weather vs performance (#365): how your outdoor ascents went in different weather, from the
 * opt-in Open-Meteo cache. Pure — callers pass rows plus the cached-day lookup.
 *
 * The unit is an outdoor ascent with a cached location-day. Ascents on one day share its
 * weather, so they are not independent: rates are compared with a cluster-robust test where
 * each location-day is one cluster. Everything here is a correlation, never a cause.
 */
import { calendarDay } from './calendarDay';
import { usesVScale } from './grades';
import { displayStyle } from './logbookStyle';
import { tickKind } from './ticks';
import {
	ascentWeatherKey,
	isCalmWeather,
	isFairWeather,
	isFreezeWeather,
	isHeatWeather,
	isRainWeather,
	isSnowWeather,
	isWindyWeather,
	type WeatherLocation,
	type WeatherLookupMap,
	type WeatherSnapshot
} from './weatherKeys';

export type WeatherPerformanceRow = {
	ascentDate: string | null;
	weatherLocation?: WeatherLocation | null;
	lat?: number | null;
	lon?: number | null;
	/** False for likely indoor routes; undefined counts as outdoor. */
	outdoor?: boolean;
	isSend?: boolean | null;
	isAttempt?: boolean | null;
	tickType?: string | null;
	gearStyle?: string | null;
	gradeSystem?: string | null;
	effectiveGradeScore?: number | null;
	gradeScore?: number | null;
};

/** The card needs this many outdoor location-days with cached weather before it shows rates. */
export const WEATHER_PERFORMANCE_MIN_DAYS = 20;
/** A band shows a rate only with at least this many ascents in the rate's denominator… */
export const MIN_RATE_ASCENTS = 10;
/** …spread over at least this many location-days. */
export const MIN_RATE_DAYS = 3;
/** Each side of a comparison needs this many location-days before it can stand out. */
export const MIN_SIGNAL_DAYS = 5;
/** Two-sided 95% threshold for the cluster-robust z statistic. */
export const SIGNAL_Z = 1.96;
/** Near-limit window: your hardest same-style send in this many days before the ascent. */
export const NEAR_LIMIT_WINDOW_DAYS = 365;
/** Grades below that reference that still count as near-limit (same steps as training load). */
export const NEAR_LIMIT_STEP = { route: 2, boulder: 1 } as const;

export type WeatherPerformanceMetric = 'sendRate' | 'nearLimit' | 'onsightFlash';
export type WeatherPerformanceDimension = 'temperature' | 'conditions';

export type WeatherRate = {
	/** Numerator: sends, near-limit sends or onsight/flash sends. */
	count: number;
	/** Denominator: ascents, sends with a grade baseline, or sends. */
	total: number;
	/** Location-days contributing to the denominator. */
	days: number;
	/** 0–100, one decimal; null below the minimum sample. */
	pct: number | null;
	/** Difference from all other weather days, percentage points (one decimal). */
	diffPts: number | null;
	/** Cluster-robust z against all other weather days (two decimals); null when untestable. */
	z: number | null;
	/** Set only when |z| ≥ {@link SIGNAL_Z} and both sides have enough days. */
	signal: 'higher' | 'lower' | null;
};

export type WeatherPerformanceBand = {
	id: string;
	label: string;
	/** Logbook drill-down using the existing weather filters; null where none exists. */
	href: string | null;
	/** Outdoor sends + attempts with cached weather in this band. */
	ascents: number;
	days: number;
	sendRate: WeatherRate;
	nearLimit: WeatherRate;
	onsightFlash: WeatherRate;
};

export type WeatherPerformanceGroup = {
	key: WeatherPerformanceDimension;
	label: string;
	/** True when one day can fall in several bands (conditions). */
	overlapping: boolean;
	bands: WeatherPerformanceBand[];
};

export type WeatherPerformanceOverall = {
	ascents: number;
	days: number;
	sendRate: number | null;
	nearLimit: number | null;
	onsightFlash: number | null;
};

export type WeatherPerformanceView = {
	/** False until {@link WEATHER_PERFORMANCE_MIN_DAYS} location-days have weather. */
	ready: boolean;
	minDays: number;
	/** Outdoor sends + attempts with a weather location and valid day, cached or not. */
	outdoorAscents: number;
	/** Of those, ascents whose location-day is cached: the analysed set. */
	ascents: number;
	/** Analysed ascents whose weather comes from an approximate place or area polygon. */
	approximateAscents: number;
	/** Distinct location-days in the analysed set. */
	days: number;
	overall: WeatherPerformanceOverall;
	groups: WeatherPerformanceGroup[];
};

type Kind = keyof typeof NEAR_LIMIT_STEP;

type BandDef = {
	id: string;
	label: string;
	href: string | null;
	test: (w: WeatherSnapshot) => boolean;
};

/** Daily-high edges (°C). Bands include their lower edge and exclude their upper edge. */
export const TEMPERATURE_EDGES = [10, 18, 25, 30] as const;

function temperatureBands(): BandDef[] {
	const edges = TEMPERATURE_EDGES;
	const high = (w: WeatherSnapshot) =>
		w.tempMaxC != null && Number.isFinite(w.tempMaxC) ? w.tempMaxC : null;
	const out: BandDef[] = [
		{
			id: 'temp:lt',
			label: `Under ${edges[0]}°`,
			href: `/logbook?weatherHighMax=${edges[0]}`,
			test: (w) => {
				const t = high(w);
				return t != null && t < edges[0];
			}
		}
	];
	for (let i = 0; i < edges.length - 1; i++) {
		const from = edges[i]!;
		const to = edges[i + 1]!;
		out.push({
			id: `temp:${from}`,
			label: `${from}–${to - 1}°`,
			href: `/logbook?weatherHighMin=${from}&weatherHighMax=${to}`,
			test: (w) => {
				const t = high(w);
				return t != null && t >= from && t < to;
			}
		});
	}
	const last = edges[edges.length - 1]!;
	out.push({
		id: 'temp:gte',
		label: `${last}°+`,
		href: `/logbook?weatherHighMin=${last}`,
		test: (w) => {
			const t = high(w);
			return t != null && t >= last;
		}
	});
	return out;
}

/** Dry needs measured precipitation: a missing value is unknown, never dry. */
export function isDryWeather(w: WeatherSnapshot): boolean {
	const p = w.precipMm;
	return p != null && Number.isFinite(p) && p >= 0 && p < 1 && !isSnowWeather(w);
}

const CONDITION_BANDS: BandDef[] = [
	{ id: 'cond:fair', label: 'Fair', href: '/logbook?weather=fair', test: isFairWeather },
	{ id: 'cond:dry', label: 'Dry', href: null, test: isDryWeather },
	{ id: 'cond:rain', label: 'Rainy', href: '/logbook?weather=rain', test: isRainWeather },
	{ id: 'cond:snow', label: 'Snowy', href: '/logbook?weather=snow', test: isSnowWeather },
	{ id: 'cond:heat', label: 'Hot', href: '/logbook?weather=heat', test: isHeatWeather },
	{ id: 'cond:freeze', label: 'Freezing', href: '/logbook?weather=freeze', test: isFreezeWeather },
	{ id: 'cond:calm', label: 'Calm', href: '/logbook?weather=calm', test: isCalmWeather },
	{ id: 'cond:wind', label: 'Windy', href: '/logbook?weather=wind', test: isWindyWeather }
];

/** Per location-day tallies; one cluster in the robust variance. */
type DayTally = {
	weather: WeatherSnapshot;
	ascents: number;
	sends: number;
	baselineSends: number;
	nearLimit: number;
	onsightFlash: number;
};

type Cluster = { num: number; den: number };
type RatioStats = { num: number; den: number; days: number; p: number | null; v: number | null };

/**
 * Ratio estimate Σnum / Σden with the linearised cluster-robust variance
 * D/(D−1) · Σ(numᵢ − p·denᵢ)² / (Σden)², over clusters with a non-zero denominator.
 */
export function ratioStats(clusters: readonly Cluster[]): RatioStats {
	const used = clusters.filter((c) => c.den > 0);
	const num = used.reduce((s, c) => s + c.num, 0);
	const den = used.reduce((s, c) => s + c.den, 0);
	const days = used.length;
	if (den === 0) return { num, den, days, p: null, v: null };
	const p = num / den;
	if (days < 2) return { num, den, days, p, v: null };
	const ss = used.reduce((s, c) => s + (c.num - p * c.den) ** 2, 0);
	return { num, den, days, p, v: ((days / (days - 1)) * ss) / den ** 2 };
}

function round1(x: number): number {
	return Math.round(x * 10) / 10;
}

function enough(s: RatioStats): boolean {
	return s.p != null && s.den >= MIN_RATE_ASCENTS && s.days >= MIN_RATE_DAYS;
}

/** Band rate compared with every other weather day (the band's complement). */
export function compareRates(band: readonly Cluster[], rest: readonly Cluster[]): WeatherRate {
	const a = ratioStats(band);
	const b = ratioStats(rest);
	const shown = enough(a);
	const out: WeatherRate = {
		count: a.num,
		total: a.den,
		days: a.days,
		pct: shown ? round1(a.p! * 100) : null,
		diffPts: null,
		z: null,
		signal: null
	};
	if (!shown || !enough(b)) return out;
	out.diffPts = round1((a.p! - b.p!) * 100);
	if (a.v == null || b.v == null) return out;
	const se = Math.sqrt(a.v + b.v);
	if (!(se > 0)) return out;
	const z = (a.p! - b.p!) / se;
	out.z = Math.round(z * 100) / 100;
	if (a.days >= MIN_SIGNAL_DAYS && b.days >= MIN_SIGNAL_DAYS && Math.abs(z) >= SIGNAL_Z) {
		out.signal = z > 0 ? 'higher' : 'lower';
	}
	return out;
}

function dayNumber(day: string): number {
	return Date.parse(`${day}T00:00:00Z`) / 86_400_000;
}

function kindOf(row: WeatherPerformanceRow): Kind {
	// Scores on the V-scale compare on V-grades, whatever the style (#72).
	return usesVScale(row.gradeSystem, row.gearStyle) ? 'boulder' : 'route';
}

function scoreOf(row: WeatherPerformanceRow): number | null {
	const s = row.effectiveGradeScore ?? row.gradeScore;
	return s != null && Number.isFinite(s) ? s : null;
}

/** Baseline key: one grade scale and one discipline, so trad never compares with sport. */
function baselineKey(row: WeatherPerformanceRow): string {
	return `${kindOf(row)}|${displayStyle(row.gearStyle)}`;
}

type BaselineIndex = Map<string, { day: number; score: number }[]>;

function buildBaseline(rows: readonly WeatherPerformanceRow[]): BaselineIndex {
	const index: BaselineIndex = new Map();
	for (const row of rows) {
		if (row.outdoor === false || !row.isSend) continue;
		const day = calendarDay(row.ascentDate);
		const score = scoreOf(row);
		if (!day || score == null) continue;
		const key = baselineKey(row);
		const list = index.get(key) ?? [];
		list.push({ day: dayNumber(day), score });
		index.set(key, list);
	}
	for (const list of index.values()) list.sort((a, b) => a.day - b.day);
	return index;
}

/** Hardest same-key outdoor send in the window before `day` (that day itself excluded). */
function referenceScore(
	list: readonly { day: number; score: number }[],
	day: number
): number | null {
	let ref: number | null = null;
	for (const s of list) {
		if (s.day >= day) break;
		if (s.day < day - NEAR_LIMIT_WINDOW_DAYS) continue;
		if (ref == null || s.score > ref) ref = s.score;
	}
	return ref;
}

/**
 * Null until at least one outdoor send/attempt has cached weather, so the card stays hidden
 * for owners who never enabled the import. Below {@link WEATHER_PERFORMANCE_MIN_DAYS}
 * location-days the view is returned with `ready: false` and no bands.
 */
export function buildWeatherPerformanceView(
	rows: readonly WeatherPerformanceRow[],
	weatherByKey: WeatherLookupMap | null | undefined
): WeatherPerformanceView | null {
	if (!weatherByKey || weatherByKey.size === 0) return null;

	const baseline = buildBaseline(rows);
	const days = new Map<string, DayTally>();
	let outdoorAscents = 0;
	let ascents = 0;
	let approximateAscents = 0;

	for (const row of rows) {
		if (row.outdoor === false || !(row.isSend || row.isAttempt)) continue;
		const day = calendarDay(row.ascentDate);
		const key = ascentWeatherKey(row);
		if (!day || !key) continue;
		outdoorAscents += 1;
		const weather = weatherByKey.get(key);
		if (!weather) continue;
		ascents += 1;
		const source = row.weatherLocation?.source;
		if (source === 'place' || source === 'polygon') approximateAscents += 1;

		const tally = days.get(key) ?? {
			weather,
			ascents: 0,
			sends: 0,
			baselineSends: 0,
			nearLimit: 0,
			onsightFlash: 0
		};
		tally.ascents += 1;
		if (row.isSend) {
			tally.sends += 1;
			const kind = tickKind(row.tickType);
			if (kind === 'onsight' || kind === 'flash') tally.onsightFlash += 1;
			const score = scoreOf(row);
			const list = baseline.get(baselineKey(row));
			const ref = score != null && list ? referenceScore(list, dayNumber(day)) : null;
			if (score != null && ref != null) {
				tally.baselineSends += 1;
				if (score >= ref - NEAR_LIMIT_STEP[kindOf(row)]) tally.nearLimit += 1;
			}
		}
		days.set(key, tally);
	}

	if (ascents === 0) return null;

	const all = [...days.values()];
	const sendClusters = (list: DayTally[]) => list.map((d) => ({ num: d.sends, den: d.ascents }));
	const nearClusters = (list: DayTally[]) =>
		list.map((d) => ({ num: d.nearLimit, den: d.baselineSends }));
	const osClusters = (list: DayTally[]) => list.map((d) => ({ num: d.onsightFlash, den: d.sends }));
	const overallPct = (clusters: Cluster[]) => {
		const s = ratioStats(clusters);
		return s.p != null && s.den > 0 ? round1(s.p * 100) : null;
	};

	const ready = all.length >= WEATHER_PERFORMANCE_MIN_DAYS;
	const buildBands = (defs: BandDef[]): WeatherPerformanceBand[] =>
		defs.map((def) => {
			const inBand = all.filter((d) => def.test(d.weather));
			const rest = all.filter((d) => !def.test(d.weather));
			return {
				id: def.id,
				label: def.label,
				href: def.href,
				ascents: inBand.reduce((s, d) => s + d.ascents, 0),
				days: inBand.length,
				sendRate: compareRates(sendClusters(inBand), sendClusters(rest)),
				nearLimit: compareRates(nearClusters(inBand), nearClusters(rest)),
				onsightFlash: compareRates(osClusters(inBand), osClusters(rest))
			};
		});

	return {
		ready,
		minDays: WEATHER_PERFORMANCE_MIN_DAYS,
		outdoorAscents,
		ascents,
		approximateAscents,
		days: all.length,
		overall: {
			ascents,
			days: all.length,
			sendRate: overallPct(sendClusters(all)),
			nearLimit: overallPct(nearClusters(all)),
			onsightFlash: overallPct(osClusters(all))
		},
		groups: ready
			? [
					{
						key: 'temperature',
						label: 'Daily high',
						overlapping: false,
						bands: buildBands(temperatureBands())
					},
					{
						key: 'conditions',
						label: 'Conditions',
						overlapping: true,
						bands: buildBands(CONDITION_BANDS)
					}
				]
			: []
	};
}

/**
 * The band whose rate stands out most for one metric, or null when none does. Used for the
 * card's one-line summary; ties go to the earlier band.
 */
export function strongestSignal(
	group: WeatherPerformanceGroup,
	metric: WeatherPerformanceMetric
): WeatherPerformanceBand | null {
	let best: WeatherPerformanceBand | null = null;
	for (const band of group.bands) {
		const rate = band[metric];
		if (!rate.signal || rate.z == null) continue;
		if (!best || Math.abs(rate.z) > Math.abs(best[metric].z!)) best = band;
	}
	return best;
}
