import { describe, expect, it } from 'vitest';
import { formatDateTime, formatNumber, resolveDateDisplay } from './dates';

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
});

describe('formatNumber / resolveDateDisplay', () => {
	it('uses the display locale', () => {
		expect(formatNumber(1234, { locale: 'en-AU', timeZone: 'UTC' })).toBe('1,234');
	});
	it('prefers explicit values', () => {
		expect(resolveDateDisplay('en-GB', 'Europe/London')).toEqual({
			locale: 'en-GB',
			timeZone: 'Europe/London'
		});
		expect(resolveDateDisplay('', '').locale).toBe('en-AU');
	});
});
