import { expect, it } from 'vitest';
import { currentPeriodStreak } from './periodStreaks';

it('expires old history and handles empty, invalid and future-only histories', () => {
	for (const period of ['week', 'month'] as const) {
		expect(currentPeriodStreak(['2024-01-01', '2024-02-01'], '2026-11-05', period)).toBe(0);
		expect(currentPeriodStreak([], '2026-11-05', period)).toBe(0);
		expect(currentPeriodStreak(['2026-02-30', '2026-11-06'], '2026-11-05', period)).toBe(0);
	}
});

it('counts Monday-start weeks across ISO week 53 with a one-period grace', () => {
	const days = ['2020-12-21', '2020-12-28', '2021-01-04', '2021-01-04'];
	expect(currentPeriodStreak(days, '2021-01-10', 'week')).toBe(3);
	expect(currentPeriodStreak(days, '2021-01-17', 'week')).toBe(3);
	expect(currentPeriodStreak(days, '2021-01-18', 'week')).toBe(0);
	expect(currentPeriodStreak(['2021-01-03', '2021-01-04'], '2021-01-04', 'week')).toBe(2);
	expect(currentPeriodStreak(['2020-12-21', '2021-01-04'], '2021-01-04', 'week')).toBe(1);
});

it('counts consecutive calendar months across a year and expires after one empty month', () => {
	const days = ['2025-11-30', '2025-12-01', '2026-01-31'];
	expect(currentPeriodStreak(days, '2026-01-31', 'month')).toBe(3);
	expect(currentPeriodStreak(days, '2026-02-28', 'month')).toBe(3);
	expect(currentPeriodStreak(days, '2026-03-01', 'month')).toBe(0);
	expect(currentPeriodStreak(['2025-11-30', '2026-01-31'], '2026-01-31', 'month')).toBe(1);
});
