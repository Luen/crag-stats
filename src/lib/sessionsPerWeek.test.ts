import { describe, expect, it } from 'vitest';
import {
	averageSessionsPerWeek,
	buildSessionsPerWeek,
	isoWeekNumber,
	mondayOf,
	mondaysOverlappingYear
} from './sessionsPerWeek';

describe('mondayOf / isoWeekNumber', () => {
	it('aligns to Monday UTC', () => {
		expect(mondayOf('2026-01-07')).toBe('2026-01-05'); // Wed → Mon
		expect(mondayOf('2026-01-04')).toBe('2025-12-29'); // Sun → previous Mon
	});
	it('returns ISO week numbers', () => {
		expect(isoWeekNumber('2026-01-05')).toBe(2);
	});
});

describe('buildSessionsPerWeek', () => {
	it('counts distinct days per week and fills empty weeks for the year', () => {
		const stats = buildSessionsPerWeek([
			'2026-01-05',
			'2026-01-05', // same day → one session
			'2026-01-06',
			'2026-01-12',
			'2025-06-01'
		]);
		expect(stats.years).toEqual(['2026', '2025']);
		const w2026 = stats.byYear['2026']!;
		expect(w2026.length).toBe(mondaysOverlappingYear(2026).length);
		const first = w2026.find((w) => w.weekStart === '2026-01-05');
		expect(first?.sessions).toBe(2);
		const second = w2026.find((w) => w.weekStart === '2026-01-12');
		expect(second?.sessions).toBe(1);
		expect(averageSessionsPerWeek(w2026)).toBeGreaterThan(0);
	});

	it('ignores invalid dates', () => {
		expect(buildSessionsPerWeek([null, '2018-00-00', '']).years).toEqual([]);
	});
});
