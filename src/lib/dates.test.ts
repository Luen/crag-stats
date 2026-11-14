import { describe, expect, it } from 'vitest';
import {
	formatCalendarDate,
	formatDateTime,
	formatNumber,
	parseDateFormat,
	resolveDateDisplay
} from './dates';

const iso = '2026-10-27T04:21:27.000Z';

describe('formatDateTime', () => {
	it('formats in the configured zone, not the host zone', () => {
		const brisbane = formatDateTime(iso, { locale: 'en-AU', timeZone: 'Australia/Brisbane' });
		const utc = formatDateTime(iso, { locale: 'en-AU', timeZone: 'UTC' });
		expect(brisbane).toContain('2:21');
		expect(utc).toContain('4:21');
	});

	it('is stable for the same input (SSR == client)', () => {
		const d = { locale: 'en-AU', timeZone: 'Australia/Brisbane' };
		expect(formatDateTime(iso, d)).toBe(formatDateTime(iso, d));
	});

	it('handles missing and invalid values', () => {
		expect(formatDateTime(null)).toBe('');
		expect(formatDateTime('not a date')).toBe('');
	});

	it('falls back on a bad locale/zone instead of throwing', () => {
		expect(formatDateTime(iso, { locale: 'en-AU', timeZone: 'Not/AZone' })).not.toBe('');
	});

	it('formats with custom date format', () => {
		expect(
			formatDateTime(iso, {
				locale: 'en-US',
				timeZone: 'UTC',
				dateFormat: 'dd/mm/yyyy'
			})
		).toBe('27/10/2026, 4:21 AM');

		expect(
			formatDateTime(iso, {
				locale: 'en-US',
				timeZone: 'UTC',
				dateFormat: 'mm/dd/yyyy'
			})
		).toBe('10/27/2026, 4:21 AM');

		expect(
			formatDateTime(iso, {
				locale: 'en-US',
				timeZone: 'UTC',
				dateFormat: 'yyyy-mm-dd'
			})
		).toBe('2026-10-27, 4:21 AM');
	});
});

describe('formatCalendarDate', () => {
	const day = '2026-10-27';

	it('formats day according to chosen date format', () => {
		expect(
			formatCalendarDate(day, { locale: 'en-AU', timeZone: 'UTC', dateFormat: 'dd/mm/yyyy' })
		).toBe('27/10/2026');
		expect(
			formatCalendarDate(day, { locale: 'en-AU', timeZone: 'UTC', dateFormat: 'mm/dd/yyyy' })
		).toBe('10/27/2026');
		expect(
			formatCalendarDate(day, { locale: 'en-AU', timeZone: 'UTC', dateFormat: 'yyyy-mm-dd' })
		).toBe('2026-10-27');
		expect(formatCalendarDate(day, { locale: 'en-AU', timeZone: 'UTC', dateFormat: 'auto' })).toBe(
			'27 Oct 2026'
		);
	});

	it('handles invalid or empty inputs gracefully', () => {
		expect(formatCalendarDate(null)).toBe('');
		expect(formatCalendarDate('')).toBe('');
		expect(formatCalendarDate('invalid')).toBe('invalid');
	});
});

describe('formatNumber / resolveDateDisplay', () => {
	it('uses the display locale', () => {
		expect(formatNumber(1234, { locale: 'en-AU', timeZone: 'UTC' })).toBe('1,234');
	});
	it('prefers explicit values', () => {
		expect(resolveDateDisplay('en-GB', 'Europe/London', 'dd/mm/yyyy')).toEqual({
			locale: 'en-GB',
			timeZone: 'Europe/London',
			dateFormat: 'dd/mm/yyyy'
		});
		expect(resolveDateDisplay('', '').locale).toBe('en-AU');
		expect(resolveDateDisplay('', '').dateFormat).toBe('auto');
	});
	it('parses valid date formats and rejects invalid', () => {
		expect(parseDateFormat('auto')).toBe('auto');
		expect(parseDateFormat('dd/mm/yyyy')).toBe('dd/mm/yyyy');
		expect(parseDateFormat('mm/dd/yyyy')).toBe('mm/dd/yyyy');
		expect(parseDateFormat('yyyy-mm-dd')).toBe('yyyy-mm-dd');
		expect(parseDateFormat('invalid')).toBeNull();
	});
});
