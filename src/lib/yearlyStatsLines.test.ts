import { describe, expect, it } from 'vitest';
import { dayOfYearIndex, daysInCalendarYear, yearLineFractions } from './yearlyStatsLines';

describe('yearlyStatsLines', () => {
	it('dayOfYearIndex is 0-based from 1 Jan', () => {
		expect(dayOfYearIndex('2024-01-01')).toBe(0);
		expect(dayOfYearIndex('2024-01-02')).toBe(1);
		expect(dayOfYearIndex('2024-12-31')).toBe(365); // leap
		expect(dayOfYearIndex('2023-12-31')).toBe(364);
	});

	it('extends flat to year end after the last climb', () => {
		expect(daysInCalendarYear(2020)).toBe(366);
		const fracs = yearLineFractions(['2020-03-01', '2020-06-15'], 2020);
		expect(fracs[0]).toBe(0);
		expect(fracs.at(-1)).toBe(1);
		expect(fracs.length).toBe(4); // Jan start + 2 climbs + Dec flat
	});

	it('does not add a flat tip when the last climb is Dec 31', () => {
		const fracs = yearLineFractions(['2023-12-31'], 2023);
		expect(fracs).toEqual([0, 1]);
	});

	it('returns only the January origin when there are no climbs', () => {
		expect(yearLineFractions([], 2021)).toEqual([0]);
	});
});
