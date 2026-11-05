/**
 * Rock type vs performance (#388): how your sends went on different rock types from
 * route `tags_json` Rock type tags. Pure — callers pass ascent rows.
 *
 * Ascents on the same rock and calendar day share a cluster (same idea as weather
 * location-days). Rates use the cluster-robust helpers from `#lib/weatherPerformance`.
 * Correlation only — crag choice and trips confound rock type.
 */
import { calendarDay } from './calendarDay';
import {
	buildPerformanceBaseline,
	performanceGradeKind,
	performanceGradeScore,
	NEAR_LIMIT_STEP
} from './performanceBaseline';
import { parseTagsJson } from './routeTags';
import { tickKind } from './ticks';
import {
	compareRates,
	MIN_RATE_ASCENTS,
	MIN_SIGNAL_DAYS,
	ratioStats,
	SIGNAL_Z,
	type WeatherPerformanceMetric,
	type WeatherRate
} from './weatherPerformance';

export type RockPerformanceRow = {
	ascentDate: string | null;
	tagsJson?: string | null;
	isSend?: boolean | null;
	isAttempt?: boolean | null;
	tickType?: string | null;
	gearStyle?: string | null;
	gradeSystem?: string | null;
	effectiveGradeScore?: number | null;
	gradeScore?: number | null;
};

/** Card needs this many tagged climbing days before it shows rates. */
export const ROCK_PERFORMANCE_MIN_DAYS = 20;
/** Cap distinct rock bands; the rest fold into Other. */
export const ROCK_PERFORMANCE_MAX_BANDS = 12;

export type RockPerformanceMetric = WeatherPerformanceMetric;
export type RockRate = WeatherRate;

export type RockPerformanceBand = {
	id: string;
	label: string;
	href: string | null;
	ascents: number;
	days: number;
	sendRate: RockRate;
	nearLimit: RockRate;
	onsightFlash: RockRate;
};

export type RockPerformanceOverall = {
	ascents: number;
	days: number;
	sendRate: number | null;
	nearLimit: number | null;
	onsightFlash: number | null;
};

export type RockPerformanceView = {
	ready: boolean;
	minDays: number;
	/** Sends + attempts on any route (tagged or not). */
	allAscents: number;
	/** Of those, ascents with a Rock type tag — the analysed set. */
	ascents: number;
	/** Distinct calendar days in the analysed set. */
	days: number;
	/** Distinct rock names before folding into Other. */
	rockCount: number;
	overall: RockPerformanceOverall;
	bands: RockPerformanceBand[];
};

type DayTally = {
	ascents: number;
	sends: number;
	baselineSends: number;
	nearLimit: number;
	onsightFlash: number;
};

type Cluster = { num: number; den: number };

/** Case-insensitive rock type name from route tags; null when missing. */
export function rockTypeName(tagsJson: string | null | undefined): string | null {
	const rock = parseTagsJson(tagsJson).find((t) => t.category.trim().toLowerCase() === 'rock type');
	const name = rock?.name?.trim();
	return name ? name : null;
}

function round1(x: number): number {
	return Math.round(x * 10) / 10;
}

function rockHref(name: string): string {
	return `/logbook?rock=${encodeURIComponent(name)}`;
}

/**
 * Null when no tagged send/attempt exists (card stays hidden). Below
 * {@link ROCK_PERFORMANCE_MIN_DAYS} tagged days the view is returned with `ready: false`.
 */
export function buildRockPerformanceView(
	rows: readonly RockPerformanceRow[]
): RockPerformanceView | null {
	const baseline = buildPerformanceBaseline(rows, () => true);
	/** Canonical lower-case key → display label (first seen casing). */
	const labels = new Map<string, string>();
	/** `${rockKey}::${day}` → tallies. */
	const clusters = new Map<string, DayTally>();
	let allAscents = 0;
	let ascents = 0;
	const taggedDays = new Set<string>();

	for (const row of rows) {
		if (!(row.isSend || row.isAttempt)) continue;
		const day = calendarDay(row.ascentDate);
		if (!day) continue;
		allAscents += 1;
		const label = rockTypeName(row.tagsJson);
		if (!label) continue;
		ascents += 1;
		taggedDays.add(day);
		const rockKey = label.toLowerCase();
		if (!labels.has(rockKey)) labels.set(rockKey, label);
		const clusterKey = `${rockKey}::${day}`;
		const tally = clusters.get(clusterKey) ?? {
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
			const score = performanceGradeScore(row);
			const ref = score != null ? baseline(row) : null;
			if (score != null && ref != null) {
				tally.baselineSends += 1;
				if (score >= ref - NEAR_LIMIT_STEP[performanceGradeKind(row)]) tally.nearLimit += 1;
			}
		}
		clusters.set(clusterKey, tally);
	}

	if (ascents === 0) return null;

	type RockBucket = { key: string | null; label: string; tallies: DayTally[]; ascents: number };
	const byRock = new Map<string, RockBucket>();
	for (const [clusterKey, tally] of clusters) {
		const rockKey = clusterKey.slice(0, clusterKey.indexOf('::'));
		const bucket = byRock.get(rockKey) ?? {
			key: rockKey,
			label: labels.get(rockKey) ?? rockKey,
			tallies: [],
			ascents: 0
		};
		bucket.tallies.push(tally);
		bucket.ascents += tally.ascents;
		byRock.set(rockKey, bucket);
	}

	const sorted = [...byRock.values()].sort(
		(a, b) => b.ascents - a.ascents || a.label.localeCompare(b.label)
	);
	const rockCount = sorted.length;
	let bandBuckets: RockBucket[];
	if (sorted.length <= ROCK_PERFORMANCE_MAX_BANDS) {
		bandBuckets = sorted;
	} else {
		const head = sorted.slice(0, ROCK_PERFORMANCE_MAX_BANDS - 1);
		const rest = sorted.slice(ROCK_PERFORMANCE_MAX_BANDS - 1);
		const other: RockBucket = {
			key: null,
			label: 'Other',
			tallies: rest.flatMap((b) => b.tallies),
			ascents: rest.reduce((s, b) => s + b.ascents, 0)
		};
		bandBuckets = [...head, other];
	}

	const allTallies = [...clusters.values()];
	const sendClusters = (list: DayTally[]) => list.map((d) => ({ num: d.sends, den: d.ascents }));
	const nearClusters = (list: DayTally[]) =>
		list.map((d) => ({ num: d.nearLimit, den: d.baselineSends }));
	const osClusters = (list: DayTally[]) => list.map((d) => ({ num: d.onsightFlash, den: d.sends }));
	const overallPct = (list: Cluster[]) => {
		const s = ratioStats(list);
		return s.p != null && s.den > 0 ? round1(s.p * 100) : null;
	};

	const ready = taggedDays.size >= ROCK_PERFORMANCE_MIN_DAYS;
	const bands: RockPerformanceBand[] = ready
		? bandBuckets.map((bucket) => {
				const inBand = bucket.tallies;
				const inSet = new Set(inBand);
				const rest = allTallies.filter((t) => !inSet.has(t));
				return {
					id: bucket.key == null ? 'aggregate:other' : `rock:${bucket.key}`,
					label: bucket.label,
					href: bucket.key == null ? null : rockHref(bucket.label),
					ascents: bucket.ascents,
					days: inBand.length,
					sendRate: compareRates(sendClusters(inBand), sendClusters(rest)),
					nearLimit: compareRates(nearClusters(inBand), nearClusters(rest)),
					onsightFlash: compareRates(osClusters(inBand), osClusters(rest))
				};
			})
		: [];

	return {
		ready,
		minDays: ROCK_PERFORMANCE_MIN_DAYS,
		allAscents,
		ascents,
		days: taggedDays.size,
		rockCount,
		overall: {
			ascents,
			days: taggedDays.size,
			sendRate: overallPct(sendClusters(allTallies)),
			nearLimit: overallPct(nearClusters(allTallies)),
			onsightFlash: overallPct(osClusters(allTallies))
		},
		bands
	};
}

export function strongestRockSignal(
	bands: readonly RockPerformanceBand[],
	metric: RockPerformanceMetric
): RockPerformanceBand | null {
	let best: RockPerformanceBand | null = null;
	for (const band of bands) {
		const rate = band[metric];
		if (!rate.signal || rate.z == null) continue;
		if (!best || Math.abs(rate.z) > Math.abs(best[metric].z!)) best = band;
	}
	return best;
}

export { MIN_RATE_ASCENTS, MIN_SIGNAL_DAYS, SIGNAL_Z };
