import { calendarDay as validWeekdayDay } from '#lib/calendarDay';
/**
 * Weekday distribution for the dashboard (Dreeve-style “Weekday” card).
 * A session = a calendar day with ≥1 matching ascent (same idea as Sessions per week).
 * Weekday is taken from the YYYY-MM-DD string in UTC (logbook dates have no time).
 */

import { matchesClimbStyle } from '#lib/climbStyle';

export type WeekdayId = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sun … Sat (Date#getUTCDay)

export type WeekdayMetric = 'sessions' | 'ascents';

/** Style chips on the card — “all” includes top-rope / alpine / unknown, etc. */
export type WeekdayStyleKey = 'all' | 'sport' | 'trad' | 'boulder';

const DISCIPLINE_KEYS = ['sport', 'trad', 'boulder'] as const;

/** Display order Monday → Sunday. */
export const WEEKDAY_ORDER: readonly WeekdayId[] = [1, 2, 3, 4, 5, 6, 0];

export const WEEKDAY_LABELS: Record<WeekdayId, string> = {
	0: 'Sun',
	1: 'Mon',
	2: 'Tue',
	3: 'Wed',
	4: 'Thu',
	5: 'Fri',
	6: 'Sat'
};

export const WEEKDAY_FULL: Record<WeekdayId, string> = {
	0: 'Sunday',
	1: 'Monday',
	2: 'Tuesday',
	3: 'Wednesday',
	4: 'Thursday',
	5: 'Friday',
	6: 'Saturday'
};

export const WEEKDAY_STYLE_KEYS: readonly WeekdayStyleKey[] = [
	'all',
	'sport',
	'trad',
	'boulder'
] as const;

export type WeekdayRow = {
	weekday: WeekdayId;
	label: string;
	/** Unique calendar days with ≥1 matching ascent. */
	sessions: number;
	/** Total matching ascent rows that day-of-week. */
	ascents: number;
};

export type WeekdaySlice = {
	rows: WeekdayRow[];
	totalSessions: number;
	totalAscents: number;
};

export type WeekdayStyleBuckets = Record<WeekdayStyleKey, WeekdaySlice>;

export type WeekdayStatsView = {
	allTime: WeekdayStyleBuckets;
	last12Weeks: WeekdayStyleBuckets;
};

export type WeekdayAscentInput = {
	date: string | null | undefined;
	/** Route discipline from the logbook row. */
	gearStyle?: string | null;
	/** Climbed style when the ascent overrides the route (same as logbook filters). */
	ascentGearStyle?: string | null;
};

/** Strict YYYY-MM-DD with a real calendar month/day (rejects 2018-00-00 / 2024-02-31). */

export function weekdayOfIsoDay(day: string): WeekdayId {
	return new Date(`${day}T12:00:00Z`).getUTCDay() as WeekdayId;
}

/**
 * Sport / Trad / Boulder chips an ascent belongs to.
 * Matches logbook style filters: ascent style OR route style.
 */
export function weekdayDisciplines(
	ascentGearStyle: string | null | undefined,
	gearStyle: string | null | undefined
): Array<'sport' | 'trad' | 'boulder'> {
	const out: Array<'sport' | 'trad' | 'boulder'> = [];
	for (const key of DISCIPLINE_KEYS) {
		if (matchesClimbStyle(ascentGearStyle, key) || matchesClimbStyle(gearStyle, key)) {
			out.push(key);
		}
	}
	return out;
}

/** Single-field helper (route or climbed style). Prefer weekdayDisciplines when both exist. */
export function weekdayDiscipline(
	gearStyle: string | null | undefined
): 'sport' | 'trad' | 'boulder' | null {
	return weekdayDisciplines(null, gearStyle)[0] ?? null;
}

function emptyCounts(): { sessions: Set<string>[]; ascents: number[] } {
	return {
		sessions: [new Set(), new Set(), new Set(), new Set(), new Set(), new Set(), new Set()],
		ascents: [0, 0, 0, 0, 0, 0, 0]
	};
}

function toSlice(counts: { sessions: Set<string>[]; ascents: number[] }): WeekdaySlice {
	const rows = WEEKDAY_ORDER.map((weekday) => ({
		weekday,
		label: WEEKDAY_LABELS[weekday],
		sessions: counts.sessions[weekday]!.size,
		ascents: counts.ascents[weekday]!
	}));
	return {
		rows,
		totalSessions: rows.reduce((s, r) => s + r.sessions, 0),
		totalAscents: rows.reduce((s, r) => s + r.ascents, 0)
	};
}

export function pickMostActive(
	rows: WeekdayRow[],
	metric: WeekdayMetric
): { weekday: WeekdayId; label: string; value: number } | null {
	let best: WeekdayRow | null = null;
	for (const row of rows) {
		const value = metric === 'sessions' ? row.sessions : row.ascents;
		if (value === 0) continue;
		const bestValue = best ? (metric === 'sessions' ? best.sessions : best.ascents) : -1;
		const tieBreak = best
			? metric === 'sessions'
				? row.ascents > best.ascents
				: row.sessions > best.sessions
			: false;
		if (!best || value > bestValue || (value === bestValue && tieBreak)) {
			best = row;
		}
	}
	if (!best) return null;
	return {
		weekday: best.weekday,
		label: WEEKDAY_FULL[best.weekday],
		value: metric === 'sessions' ? best.sessions : best.ascents
	};
}

/** ISO day 12 weeks (84 days) before `todayIso` (inclusive window). */
export function last12WeeksCutoff(todayIso: string): string {
	const d = new Date(`${todayIso}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() - 83);
	return d.toISOString().slice(0, 10);
}

function emptyBuckets(): Record<WeekdayStyleKey, ReturnType<typeof emptyCounts>> {
	return {
		all: emptyCounts(),
		sport: emptyCounts(),
		trad: emptyCounts(),
		boulder: emptyCounts()
	};
}

function addTo(
	bucket: { sessions: Set<string>[]; ascents: number[] },
	weekday: WeekdayId,
	day: string
) {
	bucket.sessions[weekday]!.add(day);
	bucket.ascents[weekday]! += 1;
}

function bucketsToStyle(
	buckets: Record<WeekdayStyleKey, ReturnType<typeof emptyCounts>>
): WeekdayStyleBuckets {
	return {
		all: toSlice(buckets.all),
		sport: toSlice(buckets.sport),
		trad: toSlice(buckets.trad),
		boulder: toSlice(buckets.boulder)
	};
}

export function buildWeekdayStats(
	ascents: WeekdayAscentInput[],
	todayIso = new Date().toISOString().slice(0, 10)
): WeekdayStatsView {
	const cutoff = last12WeeksCutoff(todayIso);
	const allTime = emptyBuckets();
	const last12 = emptyBuckets();

	for (const row of ascents) {
		const day = validWeekdayDay(row.date);
		if (!day) continue;
		const wd = weekdayOfIsoDay(day);
		const disciplines = weekdayDisciplines(row.ascentGearStyle, row.gearStyle);

		addTo(allTime.all, wd, day);
		for (const discipline of disciplines) addTo(allTime[discipline], wd, day);

		if (day >= cutoff && day <= todayIso) {
			addTo(last12.all, wd, day);
			for (const discipline of disciplines) addTo(last12[discipline], wd, day);
		}
	}

	return {
		allTime: bucketsToStyle(allTime),
		last12Weeks: bucketsToStyle(last12)
	};
}

export { calendarDay as validWeekdayDay } from '#lib/calendarDay';
