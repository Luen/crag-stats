/** A logged calendar date in UTC; timestamps retain their written date, never a zone conversion. */
export function calendarDay(raw: string | null | undefined): string | null {
	const day = (raw ?? '').trim().slice(0, 10);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day.startsWith('0000-')) return null;
	const date = new Date(`${day}T12:00:00Z`);
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === day ? day : null;
}
