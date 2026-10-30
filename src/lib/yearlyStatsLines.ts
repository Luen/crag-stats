/** Pure helpers for Yearly stats within-year overlays (testable without Svelte). */

export type DayMetricPoint = { date: string; value: number };

/** 0-based day-of-year for an ISO YYYY-MM-DD (UTC). */
export function dayOfYearIndex(iso: string): number {
	const y = Number(iso.slice(0, 4));
	const start = Date.UTC(y, 0, 1);
	const t = Date.UTC(y, Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
	return Math.max(0, Math.round((t - start) / 86400000));
}

export function daysInCalendarYear(year: number): number {
	const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	return leap ? 366 : 365;
}

/**
 * Polyline fractions (0…1) along the Jan–Dec axis for a year's climb days,
 * ending with a flat segment to 1 when the last climb is before Dec 31.
 */
export function yearLineFractions(sortedClimbDates: string[], year: number): number[] {
	const daysInYear = daysInCalendarYear(year);
	const denom = Math.max(1, daysInYear - 1);
	const fracs: number[] = [0];
	let lastIndex = -1;
	for (const date of sortedClimbDates) {
		lastIndex = dayOfYearIndex(date);
		fracs.push(lastIndex / denom);
	}
	if (sortedClimbDates.length > 0 && lastIndex < daysInYear - 1) {
		fracs.push(1);
	}
	return fracs;
}
