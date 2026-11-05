import { calendarDay } from './calendarDay';

type Period = 'week' | 'month';

function periodIndex(day: string, period: Period): number {
	if (period === 'month') return Number(day.slice(0, 4)) * 12 + Number(day.slice(5, 7)) - 1;
	// 1970-01-01 was Thursday: adding three anchors integer weeks on Monday.
	return Math.floor((Date.parse(`${day}T00:00:00Z`) / 86400000 + 3) / 7);
}

/** Anchor to this period, or the preceding one until this period's first climb. */
export function currentPeriodStreak(
	values: Iterable<string | null | undefined>,
	today: string,
	period: Period
): number {
	const day = calendarDay(today);
	if (!day) return 0;
	const periods = new Set<number>();
	for (const raw of values) {
		const date = calendarDay(raw);
		if (date && date <= day) periods.add(periodIndex(date, period));
	}
	let cursor = periodIndex(day, period);
	if (!periods.has(cursor)) cursor--;
	let count = 0;
	while (periods.has(cursor)) {
		count++;
		cursor--;
	}
	return count;
}
