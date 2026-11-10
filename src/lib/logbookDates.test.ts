import { describe, expect, it } from 'vitest';
import { logbookDates } from './logbookDates';

describe('inclusive logbook calendar ranges', () => {
	it('normalizes legacy year and season links without a competing hidden filter', () => {
		expect(logbookDates({ year: 2024 }, '2026-11-10')).toEqual({
			from: '2024-01-01',
			to: '2024-12-31',
			error: ''
		});
		expect(logbookDates({ season: 'ytd' }, '2026-11-10')).toEqual({
			from: '2026-01-01',
			to: '2026-11-10',
			error: ''
		});
		expect(logbookDates({ season: 'last_year' }, '2026-11-10').to).toBe('2025-12-31');
		expect(logbookDates({ from: '2024-02-29', year: 2025, season: 'ytd' })).toEqual({
			from: '2024-02-29',
			to: '',
			error: ''
		});
	});
	it.each([
		{ from: '2025-02-29' },
		{ to: '2024-02-30' },
		{ from: '0000-01-01' },
		{ from: '2024-03-01', to: '2024-02-29' },
		{ from: '2024-02-29T00:00:00Z' }
	])('rejects invalid/reversed bounds %j', (input) => {
		expect(logbookDates(input).error).not.toBe('');
	});
	it('keeps the same range under very different time zones', () => {
		const old = process.env.TZ;
		try {
			for (const tz of ['Pacific/Kiritimati', 'America/Los_Angeles']) {
				process.env.TZ = tz;
				expect(logbookDates({ from: '2024-03-10', to: '2024-03-10' })).toEqual({
					from: '2024-03-10',
					to: '2024-03-10',
					error: ''
				});
			}
		} finally {
			if (old == null) delete process.env.TZ;
			else process.env.TZ = old;
		}
	});
});
