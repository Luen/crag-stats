import { calendarDay } from '#lib/calendarDay';

/** Explicit inclusive bounds > legacy year > preset. Keep written days, without timezone conversion. */
export function logbookDates(
	input: { from?: string; to?: string; year?: number; season?: string },
	today = new Date().toISOString().slice(0, 10)
) {
	let from = input.from ?? '';
	let to = input.to ?? '';
	if (from || to) {
		if (
			(from && (from.length !== 10 || !calendarDay(from))) ||
			(to && (to.length !== 10 || !calendarDay(to)))
		) {
			return { from, to, error: 'Enter valid calendar dates in From and To.' };
		}
	} else if (
		input.year != null &&
		Number.isInteger(input.year) &&
		input.year >= 1 &&
		input.year <= 9999
	) {
		const year = String(input.year).padStart(4, '0');
		from = `${year}-01-01`;
		to = `${year}-12-31`;
	} else if (input.season === 'ytd') {
		from = `${today.slice(0, 4)}-01-01`;
		to = today;
	} else if (input.season === 'last_year') {
		const year = String(Number(today.slice(0, 4)) - 1).padStart(4, '0');
		from = `${year}-01-01`;
		to = `${year}-12-31`;
	}
	return { from, to, error: from && to && from > to ? 'From must be on or before To.' : '' };
}
