import { expect, it } from 'vitest';
import { consecutiveDayRuns, currentDayStreak, longestDayRun } from './dayStreaks';
it('uses unique valid written days, including leap/year transitions and timestamp dates', () => {
	expect(
		consecutiveDayRuns([
			'2024-02-29T01:00:00+14:00',
			'2024-02-28',
			'2024-03-01',
			'2024-02-29',
			'2025-02-29',
			null,
			'0000-01-01',
			'2024-00-01',
			'2024-03-03'
		])
	).toEqual([
		{ start: '2024-02-28', end: '2024-03-01', length: 3 },
		{ start: '2024-03-03', end: '2024-03-03', length: 1 }
	]);
	expect(consecutiveDayRuns(['2025-12-31', '2026-01-01'])).toEqual([
		{ start: '2025-12-31', end: '2026-01-01', length: 2 }
	]);
});
it('keeps the earliest equal record and handles empty and single-day histories', () => {
	expect(longestDayRun(consecutiveDayRuns([]))).toBeNull();
	expect(longestDayRun(consecutiveDayRuns(['2026-01-01']))).toEqual({
		start: '2026-01-01',
		end: '2026-01-01',
		length: 1
	});
	const runs = consecutiveDayRuns(['2026-02-01', '2026-02-02', '2026-01-01', '2026-01-02']);
	expect(longestDayRun(runs.toReversed())).toEqual({
		start: '2026-01-01',
		end: '2026-01-02',
		length: 2
	});
});
it('is independent of host timezone and DST', () => {
	const original = process.env.TZ;
	try {
		for (const zone of ['Pacific/Kiritimati', 'America/New_York', 'Australia/Brisbane']) {
			process.env.TZ = zone;
			for (const [today, dates] of [
				['2026-03-09', ['2026-03-07', '2026-03-08', '2026-03-09']],
				['2026-11-02', ['2026-10-31', '2026-11-01', '2026-11-02']]
			] as const) {
				expect(currentDayStreak(dates, today)).toBe(3);
				expect(currentDayStreak([today], today)).toBe(1);
			}
			expect(consecutiveDayRuns(['2026-03-07', '2026-03-08', '2026-03-09'])).toEqual([
				{ start: '2026-03-07', end: '2026-03-09', length: 3 }
			]);
		}
	} finally {
		if (original === undefined) delete process.env.TZ;
		else process.env.TZ = original;
	}
});

it('allows yesterday, ignores future and invalid logs, and expires after a missed day', () => {
	expect(currentDayStreak(['2026-01-01', '2026-01-02'], '2026-01-03')).toBe(2);
	expect(currentDayStreak(['2026-01-01', '2026-01-02'], '2026-01-04')).toBe(0);
	expect(currentDayStreak(['2026-01-03', '2026-01-04', '2026-02-30'], '2026-01-03')).toBe(1);
	expect(currentDayStreak([], '2026-01-03')).toBe(0);
});
