/**
 * Repeats vs new routes: how often you come back to a route versus climbing something new.
 *
 * Every logged ascent (sends and attempts) on a valid written calendar day is either a
 * *first visit* (it falls on the first day you logged that route) or a *repeat* (any later
 * day on the same route). Routes are keyed by provider plus provider route ID, never by name.
 */

import { calendarDay } from '#lib/calendarDay';
import { matchesClimbStyle } from '#lib/climbStyle';

export type RepeatStyleKey = 'all' | 'sport' | 'trad' | 'boulder';
export type RepeatRange = 'all' | 'last12';
export type RepeatPersona = 'explorer' | 'repeater' | 'mixed';

export const REPEAT_STYLE_KEYS: readonly RepeatStyleKey[] = ['all', 'sport', 'trad', 'boulder'];

/** Classified ascents (all styles, all time) before the dashboard shows the card. */
export const REPEAT_MIN_ASCENTS = 20;
/** Classified ascents a slice needs before it gets a persona label. */
export const REPEAT_LABEL_MIN_ASCENTS = 20;
/** Explorer: at least this share of ascents are first visits. */
export const EXPLORER_NEW_SHARE = 0.75;
/** Repeat climber: at least this share of ascents are repeats. */
export const REPEATER_SHARE = 0.5;
/** Most-repeated routes listed per slice. */
export const TOP_REPEATED_LIMIT = 5;
/** "Last 12 months" is the 365-day window ending today (inclusive). */
export const REPEAT_RECENT_DAYS = 365;

export const REPEAT_PERSONA_LABELS: Record<RepeatPersona, string> = {
	explorer: 'Explorer',
	repeater: 'Repeat climber',
	mixed: 'A bit of both'
};

const DISCIPLINES = ['sport', 'trad', 'boulder'] as const;

export type RepeatAscentInput = {
	date: string | null | undefined;
	routeProvider: string | null | undefined;
	routeExternalId: string | null | undefined;
	/** Local route id, used only for `/logbook?route=` links. */
	routeId?: number | null;
	routeName?: string | null;
	cragName?: string | null;
	gearStyle?: string | null;
	ascentGearStyle?: string | null;
};

export type RepeatedRoute = {
	/** Stable provider-scoped key (`provider:externalId`). */
	key: string;
	routeId: number | null;
	routeName: string;
	cragName: string | null;
	/** Distinct days on the route within the range. */
	days: number;
	/** Logged ascents on the route within the range. */
	ascents: number;
	/** Latest day on the route within the range. */
	lastDay: string;
};

export type RepeatSlice = {
	ascents: number;
	/** Ascents on a route's first logged day. */
	newAscents: number;
	/** Ascents on any later day on the same route. */
	repeatAscents: number;
	/** Rounded display shares; they always add up to 100 when ascents > 0. */
	newPct: number | null;
	repeatPct: number | null;
	/** Distinct routes climbed in the range. */
	routes: number;
	/** Routes whose first logged day falls in the range. */
	newRoutes: number;
	/** Routes with at least one repeat ascent in the range. */
	repeatedRoutes: number;
	persona: RepeatPersona | null;
	top: RepeatedRoute[];
};

export type RepeatStyleSlices = Record<RepeatStyleKey, RepeatSlice>;

export type RouteRepeatsView = {
	allTime: RepeatStyleSlices;
	last12Months: RepeatStyleSlices;
	/** First day of the last-12-months window. */
	recentFrom: string;
};

/** Provider-scoped route key; null when either part is missing. */
export function routeRepeatKey(
	provider: string | null | undefined,
	externalId: string | null | undefined
): string | null {
	const p = (provider ?? '').trim().toLowerCase();
	const id = (externalId ?? '').trim();
	return p && id ? `${p}:${id}` : null;
}

/** Persona from exact counts (thresholds apply before any rounding). */
export function repeatPersona(newAscents: number, repeatAscents: number): RepeatPersona | null {
	const total = newAscents + repeatAscents;
	if (total < REPEAT_LABEL_MIN_ASCENTS) return null;
	if (repeatAscents / total >= REPEATER_SHARE) return 'repeater';
	if (newAscents / total >= EXPLORER_NEW_SHARE) return 'explorer';
	return 'mixed';
}

export function repeatRecentFrom(todayIso: string): string {
	const d = new Date(`${todayIso}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() - (REPEAT_RECENT_DAYS - 1));
	return d.toISOString().slice(0, 10);
}

function disciplines(row: RepeatAscentInput): RepeatStyleKey[] {
	const out: RepeatStyleKey[] = ['all'];
	for (const key of DISCIPLINES) {
		if (matchesClimbStyle(row.ascentGearStyle, key) || matchesClimbStyle(row.gearStyle, key)) {
			out.push(key);
		}
	}
	return out;
}

type Classified = {
	key: string;
	day: string;
	repeat: boolean;
	firstDay: string;
	row: RepeatAscentInput;
};

type RouteAgg = {
	days: Set<string>;
	ascents: number;
	repeats: number;
	lastDay: string;
	row: RepeatAscentInput;
};

function buildSlice(items: Classified[], inRange: (day: string) => boolean): RepeatSlice {
	let newAscents = 0;
	let repeatAscents = 0;
	const byRoute = new Map<string, RouteAgg>();
	const newRouteKeys = new Set<string>();

	for (const item of items) {
		if (item.repeat) repeatAscents += 1;
		else newAscents += 1;
		if (inRange(item.firstDay)) newRouteKeys.add(item.key);
		const agg = byRoute.get(item.key) ?? {
			days: new Set<string>(),
			ascents: 0,
			repeats: 0,
			lastDay: item.day,
			row: item.row
		};
		agg.days.add(item.day);
		agg.ascents += 1;
		if (item.repeat) agg.repeats += 1;
		if (item.day >= agg.lastDay) {
			agg.lastDay = item.day;
			agg.row = item.row;
		}
		byRoute.set(item.key, agg);
	}

	const ascents = newAscents + repeatAscents;
	const newPct = ascents > 0 ? Math.round((newAscents / ascents) * 100) : null;

	const top = [...byRoute.entries()]
		.filter(([, agg]) => agg.repeats > 0)
		.sort(
			([ka, a], [kb, b]) =>
				b.days.size - a.days.size ||
				b.ascents - a.ascents ||
				b.lastDay.localeCompare(a.lastDay) ||
				ka.localeCompare(kb)
		)
		.slice(0, TOP_REPEATED_LIMIT)
		.map(([key, agg]) => ({
			key,
			routeId: agg.row.routeId ?? null,
			routeName: (agg.row.routeName ?? '').trim() || 'Unnamed route',
			cragName: (agg.row.cragName ?? '').trim() || null,
			days: agg.days.size,
			ascents: agg.ascents,
			lastDay: agg.lastDay
		}));

	return {
		ascents,
		newAscents,
		repeatAscents,
		newPct,
		repeatPct: newPct == null ? null : 100 - newPct,
		routes: byRoute.size,
		newRoutes: newRouteKeys.size,
		repeatedRoutes: [...byRoute.values()].filter((a) => a.repeats > 0).length,
		persona: repeatPersona(newAscents, repeatAscents),
		top
	};
}

function emptyBuckets(): Record<RepeatStyleKey, Classified[]> {
	return { all: [], sport: [], trad: [], boulder: [] };
}

/**
 * Classify every dated ascent as a first visit or a repeat, overall and for the last
 * 12 months, split by Sport / Trad / Boulder. Returns null below REPEAT_MIN_ASCENTS.
 * First visits are decided from the whole history, so a route first climbed years ago
 * counts as a repeat in the recent window.
 */
export function buildRouteRepeats(
	rows: readonly RepeatAscentInput[],
	todayIso = new Date().toISOString().slice(0, 10)
): RouteRepeatsView | null {
	const dated: { key: string; day: string; row: RepeatAscentInput }[] = [];
	const firstDay = new Map<string, string>();
	for (const row of rows) {
		const key = routeRepeatKey(row.routeProvider, row.routeExternalId);
		const day = calendarDay(row.date);
		if (!key || !day) continue;
		dated.push({ key, day, row });
		const prev = firstDay.get(key);
		if (!prev || day < prev) firstDay.set(key, day);
	}
	if (dated.length < REPEAT_MIN_ASCENTS) return null;

	const recentFrom = repeatRecentFrom(todayIso);
	const isRecent = (day: string) => day >= recentFrom && day <= todayIso;
	const allTime = emptyBuckets();
	const recent = emptyBuckets();

	for (const { key, day, row } of dated) {
		const first = firstDay.get(key)!;
		const item: Classified = { key, day, repeat: day > first, firstDay: first, row };
		for (const style of disciplines(row)) {
			allTime[style].push(item);
			if (isRecent(day)) recent[style].push(item);
		}
	}

	const slices = (
		buckets: Record<RepeatStyleKey, Classified[]>,
		inRange: (day: string) => boolean
	): RepeatStyleSlices => ({
		all: buildSlice(buckets.all, inRange),
		sport: buildSlice(buckets.sport, inRange),
		trad: buildSlice(buckets.trad, inRange),
		boulder: buildSlice(buckets.boulder, inRange)
	});

	return {
		allTime: slices(allTime, () => true),
		last12Months: slices(recent, isRecent),
		recentFrom
	};
}
