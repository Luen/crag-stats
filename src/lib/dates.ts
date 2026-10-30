/**
 * Deterministic date/number formatting. The server passes the same locale + time zone to
 * the client (layout data), so SSR output matches hydration and times show in the owner's
 * zone even when the container runs in UTC.
 */
export type DateDisplay = { locale: string; timeZone: string };

export const DEFAULT_DATE_DISPLAY: DateDisplay = { locale: 'en-AU', timeZone: 'UTC' };

function safeFormatter(display: DateDisplay, opts: Intl.DateTimeFormatOptions) {
	try {
		return new Intl.DateTimeFormat(display.locale, { ...opts, timeZone: display.timeZone });
	} catch {
		// Bad DISPLAY_LOCALE / TZ value — fall back rather than crash the page.
		return new Intl.DateTimeFormat(DEFAULT_DATE_DISPLAY.locale, {
			...opts,
			timeZone: DEFAULT_DATE_DISPLAY.timeZone
		});
	}
}

/** e.g. "27 Oct 2026, 2:21 pm" (en-AU). Empty string for missing/invalid input. */
export function formatDateTime(
	iso: string | null | undefined,
	display: DateDisplay = DEFAULT_DATE_DISPLAY,
	opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return safeFormatter(display, opts).format(d);
}

export function formatNumber(n: number, display: DateDisplay = DEFAULT_DATE_DISPLAY): string {
	try {
		return n.toLocaleString(display.locale);
	} catch {
		return n.toLocaleString(DEFAULT_DATE_DISPLAY.locale);
	}
}

/** Resolve display settings from env-style values (server side). */
export function resolveDateDisplay(locale?: string, timeZone?: string): DateDisplay {
	const tz = timeZone?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
	return { locale: locale?.trim() || DEFAULT_DATE_DISPLAY.locale, timeZone: tz };
}

/**
 * Format a calendar day (`YYYY-MM-DD`) without shifting it through the display time zone,
 * e.g. "27 Oct 2026" (en-AU). Falls back to the raw key for invalid input.
 */
export function formatCalendarDate(
	day: string | null | undefined,
	display: DateDisplay = DEFAULT_DATE_DISPLAY
): string {
	if (!day || !/^\d{4}-\d{2}-\d{2}/.test(day)) return day ?? '';
	const d = new Date(`${day.slice(0, 10)}T12:00:00Z`);
	if (Number.isNaN(d.getTime())) return day.slice(0, 10);
	try {
		return new Intl.DateTimeFormat(display.locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
			d
		);
	} catch {
		return new Intl.DateTimeFormat(DEFAULT_DATE_DISPLAY.locale, {
			dateStyle: 'medium',
			timeZone: 'UTC'
		}).format(d);
	}
}
