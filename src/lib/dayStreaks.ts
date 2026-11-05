import { calendarDay } from './calendarDay';
export const STREAK_DAY_THRESHOLDS = [7, 10, 30] as const;
export type DayStreak = { start: string; end: string; length: number };
/** Unique valid written days; UTC arithmetic prevents time-zone and DST shifts. */
export function consecutiveDayRuns(values: Iterable<string | null | undefined>): DayStreak[] {
	const days = [
		...new Set([...values].map(calendarDay).filter((d): d is string => d != null))
	].sort();
	const runs: DayStreak[] = [];
	for (const day of days) {
		const last = runs.at(-1);
		if (last && Date.parse(`${day}T00:00:00Z`) - Date.parse(`${last.end}T00:00:00Z`) === 86400000) {
			last.end = day;
			last.length++;
		} else runs.push({ start: day, end: day, length: 1 });
	}
	return runs;
}
/** Earliest occurrence wins when equally long runs exist. */
export function longestDayRun(runs: readonly DayStreak[]): DayStreak | null {
	return runs.reduce<DayStreak | null>(
		(best, run) =>
			!best || run.length > best.length || (run.length === best.length && run.start < best.start)
				? run
				: best,
		null
	);
}

/** Current UTC day, or yesterday while today has no climb; future logs never extend it. */
export function currentDayStreak(
	values: Iterable<string | null | undefined>,
	today: string
): number {
	const day = calendarDay(today);
	if (!day) return 0;
	const yesterday = new Date(Date.parse(`${day}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
	const runs = consecutiveDayRuns(
		[...values].filter((value) => {
			const date = calendarDay(value);
			return date != null && date <= day;
		})
	);
	const latest = runs.at(-1);
	return latest && (latest.end === day || latest.end === yesterday) ? latest.length : 0;
}
