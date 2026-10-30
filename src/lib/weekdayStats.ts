/**
 * Weekday distribution for the dashboard (Dreeve-style “Weekday” card).
 * A session = a calendar day with ≥1 ascent (same as Sessions per week).
 * Weekday is taken from the YYYY-MM-DD string in UTC (logbook dates have no time).
 */

export type WeekdayId = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sun … Sat (Date#getUTCDay)

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

export type WeekdayRow = {
	weekday: WeekdayId;
	label: string;
	/** Unique calendar days with ≥1 ascent. */
	sessions: number;
	/** Total ascent rows that day-of-week. */
	ascents: number;
};

export type WeekdayStatsView = {
	allTime: WeekdayRow[];
	last12Weeks: WeekdayRow[];
	mostActiveAllTime: { weekday: WeekdayId; label: string; sessions: number } | null;
	mostActiveLast12: { weekday: WeekdayId; label: string; sessions: number } | null;
	totalSessionsAllTime: number;
	totalSessionsLast12: number;
};

function validDay(iso: string | null | undefined): string | null {
	const d = (iso ?? '').slice(0, 10);
	return /^\d{4}-\d{2}-\d{2}$/.test(d) && !d.includes('-00') ? d : null;
}

export function weekdayOfIsoDay(day: string): WeekdayId {
	return new Date(`${day}T12:00:00Z`).getUTCDay() as WeekdayId;
}

function emptyCounts(): { sessions: Set<string>[]; ascents: number[] } {
	return {
		sessions: [new Set(), new Set(), new Set(), new Set(), new Set(), new Set(), new Set()],
		ascents: [0, 0, 0, 0, 0, 0, 0]
	};
}

function toRows(counts: { sessions: Set<string>[]; ascents: number[] }): WeekdayRow[] {
	return WEEKDAY_ORDER.map((weekday) => ({
		weekday,
		label: WEEKDAY_LABELS[weekday],
		sessions: counts.sessions[weekday]!.size,
		ascents: counts.ascents[weekday]!
	}));
}

function mostActive(
	rows: WeekdayRow[]
): { weekday: WeekdayId; label: string; sessions: number } | null {
	let best: WeekdayRow | null = null;
	for (const row of rows) {
		if (row.sessions === 0) continue;
		if (
			!best ||
			row.sessions > best.sessions ||
			(row.sessions === best.sessions && row.ascents > best.ascents)
		) {
			best = row;
		}
	}
	if (!best) return null;
	return {
		weekday: best.weekday,
		label: WEEKDAY_FULL[best.weekday],
		sessions: best.sessions
	};
}

/** ISO day 12 weeks (84 days) before `todayIso` (inclusive window starts the next day). */
export function last12WeeksCutoff(todayIso: string): string {
	const d = new Date(`${todayIso}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() - 83);
	return d.toISOString().slice(0, 10);
}

export function buildWeekdayStats(
	ascentDates: (string | null | undefined)[],
	todayIso = new Date().toISOString().slice(0, 10)
): WeekdayStatsView {
	const cutoff = last12WeeksCutoff(todayIso);
	const all = emptyCounts();
	const recent = emptyCounts();

	for (const raw of ascentDates) {
		const day = validDay(raw);
		if (!day) continue;
		const wd = weekdayOfIsoDay(day);
		all.sessions[wd]!.add(day);
		all.ascents[wd]! += 1;
		if (day >= cutoff && day <= todayIso) {
			recent.sessions[wd]!.add(day);
			recent.ascents[wd]! += 1;
		}
	}

	const allTime = toRows(all);
	const last12Weeks = toRows(recent);
	return {
		allTime,
		last12Weeks,
		mostActiveAllTime: mostActive(allTime),
		mostActiveLast12: mostActive(last12Weeks),
		totalSessionsAllTime: allTime.reduce((s, r) => s + r.sessions, 0),
		totalSessionsLast12: last12Weeks.reduce((s, r) => s + r.sessions, 0)
	};
}
