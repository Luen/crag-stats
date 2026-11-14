/**
 * Deterministic date/number formatting. The server passes the same locale + time zone to
 * the client (layout data), so SSR output matches hydration and times show in the owner's
 * zone even when the container runs in UTC.
 */

export type DateFormat = 'auto' | 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';

export const DATE_FORMAT_OPTIONS = [
	{
		id: 'auto' as const,
		label: 'Auto (Locale-based)',
		hint: 'Derives format from your display locale or browser'
	},
	{
		id: 'dd/mm/yyyy' as const,
		label: 'DD/MM/YYYY (Day first)',
		hint: 'UK, Australia, Europe, and Latin America'
	},
	{
		id: 'mm/dd/yyyy' as const,
		label: 'MM/DD/YYYY (Month first)',
		hint: 'United States'
	},
	{
		id: 'yyyy-mm-dd' as const,
		label: 'YYYY-MM-DD (ISO 8601)',
		hint: 'Unambiguous international standard'
	}
] as const;

export type DateDisplay = {
	locale: string;
	timeZone: string;
	dateFormat?: DateFormat;
};

export const DEFAULT_DATE_DISPLAY: DateDisplay = {
	locale: 'en-AU',
	timeZone: 'UTC',
	dateFormat: 'auto'
};

export function parseDateFormat(raw: unknown): DateFormat | null {
	if (raw === 'auto' || raw === 'dd/mm/yyyy' || raw === 'mm/dd/yyyy' || raw === 'yyyy-mm-dd') {
		return raw;
	}
	return null;
}

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

	const fmt = display.dateFormat ?? 'auto';
	if (fmt !== 'auto') {
		const parts = safeFormatter(display, {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).formatToParts(d);
		const map: Record<string, string> = {};
		for (const p of parts) {
			map[p.type] = p.value;
		}
		const y = map.year || '';
		const m = map.month || '';
		const day = map.day || '';
		let dateStr = '';
		if (fmt === 'dd/mm/yyyy') dateStr = `${day}/${m}/${y}`;
		else if (fmt === 'mm/dd/yyyy') dateStr = `${m}/${day}/${y}`;
		else if (fmt === 'yyyy-mm-dd') dateStr = `${y}-${m}-${day}`;

		if (opts.timeStyle) {
			const timeStr = safeFormatter(display, {
				timeStyle: opts.timeStyle
			}).format(d);
			return `${dateStr}, ${timeStr}`;
		}
		return dateStr;
	}

	return safeFormatter(display, opts).format(d);
}

export function formatNumber(n: number, display: DateDisplay = DEFAULT_DATE_DISPLAY): string {
	try {
		return n.toLocaleString(display.locale);
	} catch {
		return n.toLocaleString(DEFAULT_DATE_DISPLAY.locale);
	}
}

/** Resolve display settings from env-style values and stored settings. */
export function resolveDateDisplay(
	locale?: string,
	timeZone?: string,
	dateFormat?: string | null
): DateDisplay {
	const tz = timeZone?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
	return {
		locale: locale?.trim() || DEFAULT_DATE_DISPLAY.locale,
		timeZone: tz,
		dateFormat: parseDateFormat(dateFormat) ?? 'auto'
	};
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
	const raw10 = day.slice(0, 10);
	const year = raw10.slice(0, 4);
	const month = raw10.slice(5, 7);
	const dayNum = raw10.slice(8, 10);

	const fmt = display.dateFormat ?? 'auto';
	if (fmt === 'dd/mm/yyyy') {
		return `${dayNum}/${month}/${year}`;
	}
	if (fmt === 'mm/dd/yyyy') {
		return `${month}/${dayNum}/${year}`;
	}
	if (fmt === 'yyyy-mm-dd') {
		return `${year}-${month}-${dayNum}`;
	}

	const d = new Date(`${raw10}T12:00:00Z`);
	if (Number.isNaN(d.getTime())) return raw10;
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
