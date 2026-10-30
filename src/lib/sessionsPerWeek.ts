import { calendarDay as validDay } from '#lib/calendarDay';
/**
 * Sessions per week for the dashboard card (#244).
 * A session = a calendar day with ≥1 logged ascent (same idea as project sessions).
 */

export type SessionsWeek = {
	/** Monday (UTC) of the week */
	weekStart: string;
	/** ISO week number 1–53 */
	week: number;
	sessions: number;
};

export type SessionsPerWeekStats = {
	years: string[];
	/** Weeks for each calendar year (ISO weeks that contain a day in that year). */
	byYear: Record<string, SessionsWeek[]>;
};

/** Monday UTC of the ISO week containing `day`. */
export function mondayOf(day: string): string {
	const d = new Date(`${day}T12:00:00Z`);
	const dow = d.getUTCDay(); // 0=Sun … 6=Sat
	const delta = dow === 0 ? -6 : 1 - dow;
	d.setUTCDate(d.getUTCDate() + delta);
	return d.toISOString().slice(0, 10);
}

/** ISO week number (1–53) for a Monday (or any day in that week). */
export function isoWeekNumber(day: string): number {
	const d = new Date(`${mondayOf(day)}T12:00:00Z`);
	// Thursday of this week determines the ISO week-year.
	const thu = new Date(d);
	thu.setUTCDate(d.getUTCDate() + 3);
	const yearStart = new Date(0);
	yearStart.setUTCHours(0, 0, 0, 0);
	yearStart.setUTCFullYear(thu.getUTCFullYear(), 0, 1);
	return 1 + Math.floor((thu.getTime() - yearStart.getTime()) / 86_400_000 / 7);
}

export function addDays(day: string, n: number): string {
	const d = new Date(`${day}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
}

/** Every Monday that overlaps calendar year `year`. */
export function mondaysOverlappingYear(year: number): string[] {
	const yearLabel = String(year).padStart(4, '0');
	const first = mondayOf(`${yearLabel}-01-01`);
	const lastDay = `${yearLabel}-12-31`;
	const out: string[] = [];
	for (let m = first; m <= lastDay || mondayOf(m) <= mondayOf(lastDay); m = addDays(m, 7)) {
		const end = addDays(m, 6);
		if (end < `${yearLabel}-01-01`) continue;
		if (m > lastDay) break;
		out.push(m);
		if (out.length > 60) break;
	}
	return out;
}

export function buildSessionsPerWeek(
	ascentDates: (string | null | undefined)[]
): SessionsPerWeekStats {
	const days = new Set<string>();
	for (const raw of ascentDates) {
		const d = validDay(raw);
		if (d) days.add(d);
	}

	const years = [...new Set([...days].map((d) => d.slice(0, 4)))].sort((a, b) =>
		b.localeCompare(a)
	);

	const byYear: Record<string, SessionsWeek[]> = {};
	for (const y of years) {
		const year = Number(y);
		const counts = new Map<string, number>();
		for (const day of days) {
			if (day.slice(0, 4) !== y) continue;
			const start = mondayOf(day);
			counts.set(start, (counts.get(start) ?? 0) + 1);
		}
		byYear[y] = mondaysOverlappingYear(year).map((weekStart) => ({
			weekStart,
			week: isoWeekNumber(weekStart),
			sessions: counts.get(weekStart) ?? 0
		}));
	}

	return { years, byYear };
}

export function averageSessionsPerWeek(weeks: SessionsWeek[]): number {
	if (!weeks.length) return 0;
	const total = weeks.reduce((s, w) => s + w.sessions, 0);
	return Math.round((total / weeks.length) * 10) / 10;
}
