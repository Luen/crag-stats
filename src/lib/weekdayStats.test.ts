import { describe, expect, it } from 'vitest';
import {
	buildWeekdayStats,
	last12WeeksCutoff,
	weekdayOfIsoDay,
	WEEKDAY_FULL
} from './weekdayStats';

describe('weekdayStats', () => {
	it('maps ISO days to UTC weekdays', () => {
		// 2024-01-01 was a Monday
		expect(weekdayOfIsoDay('2024-01-01')).toBe(1);
		expect(weekdayOfIsoDay('2024-01-06')).toBe(6);
		expect(weekdayOfIsoDay('2024-01-07')).toBe(0);
	});

	it('counts unique session days and ascents per weekday', () => {
		const stats = buildWeekdayStats(
			[
				'2024-01-01', // Mon
				'2024-01-01', // same day → one session, two ascents
				'2024-01-06', // Sat
				'2024-01-13', // Sat
				'2018-00-00', // invalid
				null
			],
			'2024-01-20'
		);
		const mon = stats.allTime.find((r) => r.weekday === 1)!;
		const sat = stats.allTime.find((r) => r.weekday === 6)!;
		expect(mon.sessions).toBe(1);
		expect(mon.ascents).toBe(2);
		expect(sat.sessions).toBe(2);
		expect(sat.ascents).toBe(2);
		expect(stats.mostActiveAllTime?.label).toBe(WEEKDAY_FULL[6]);
		expect(stats.mostActiveAllTime?.sessions).toBe(2);
		expect(stats.allTime.map((r) => r.label)).toEqual([
			'Mon',
			'Tue',
			'Wed',
			'Thu',
			'Fri',
			'Sat',
			'Sun'
		]);
	});

	it('scopes last 12 weeks to an 84-day window ending today', () => {
		expect(last12WeeksCutoff('2024-04-10')).toBe('2024-01-18');
		const stats = buildWeekdayStats(
			[
				'2023-12-01', // outside window
				'2024-02-05', // Mon inside
				'2024-04-08' // Mon inside
			],
			'2024-04-10'
		);
		expect(stats.totalSessionsAllTime).toBe(3);
		expect(stats.totalSessionsLast12).toBe(2);
		expect(stats.mostActiveLast12?.weekday).toBe(1);
	});
});
