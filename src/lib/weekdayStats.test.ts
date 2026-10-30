import { describe, expect, it } from 'vitest';
import {
	buildWeekdayStats,
	last12WeeksCutoff,
	pickMostActive,
	weekdayDiscipline,
	weekdayOfIsoDay,
	WEEKDAY_FULL
} from './weekdayStats';

describe('weekdayStats', () => {
	it('maps ISO days to UTC weekdays', () => {
		expect(weekdayOfIsoDay('2024-01-01')).toBe(1);
		expect(weekdayOfIsoDay('2024-01-06')).toBe(6);
		expect(weekdayOfIsoDay('2024-01-07')).toBe(0);
	});

	it('classifies Sport / Trad / Boulder gear styles', () => {
		expect(weekdayDiscipline('Sport')).toBe('sport');
		expect(weekdayDiscipline('trad alpine')).toBe('trad');
		expect(weekdayDiscipline('Boulder')).toBe('boulder');
		expect(weekdayDiscipline('Top rope')).toBeNull();
		expect(weekdayDiscipline(null)).toBeNull();
	});

	it('counts unique session days and ascents per weekday', () => {
		const stats = buildWeekdayStats(
			[
				{ date: '2024-01-01', gearStyle: 'Sport' },
				{ date: '2024-01-01', gearStyle: 'Sport' },
				{ date: '2024-01-06', gearStyle: 'Boulder' },
				{ date: '2024-01-13', gearStyle: 'Sport' },
				{ date: '2018-00-00', gearStyle: 'Sport' },
				{ date: null }
			],
			'2024-01-20'
		);
		const all = stats.allTime.all;
		const mon = all.rows.find((r) => r.weekday === 1)!;
		const sat = all.rows.find((r) => r.weekday === 6)!;
		expect(mon.sessions).toBe(1);
		expect(mon.ascents).toBe(2);
		expect(sat.sessions).toBe(2);
		expect(sat.ascents).toBe(2);
		expect(pickMostActive(all.rows, 'sessions')?.label).toBe(WEEKDAY_FULL[6]);
		expect(all.rows.map((r) => r.label)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
	});

	it('filters Sport / Trad / Boulder sessions separately', () => {
		const stats = buildWeekdayStats(
			[
				{ date: '2024-01-01', gearStyle: 'Sport' }, // Mon
				{ date: '2024-01-06', gearStyle: 'Boulder' }, // Sat
				{ date: '2024-01-06', gearStyle: 'Sport' }, // Sat sport too
				{ date: '2024-01-07', gearStyle: 'Top rope' } // Sun — all only
			],
			'2024-01-20'
		);
		expect(stats.allTime.sport.rows.find((r) => r.weekday === 1)?.sessions).toBe(1);
		expect(stats.allTime.sport.rows.find((r) => r.weekday === 6)?.sessions).toBe(1);
		expect(stats.allTime.boulder.rows.find((r) => r.weekday === 6)?.sessions).toBe(1);
		expect(stats.allTime.boulder.totalSessions).toBe(1);
		expect(stats.allTime.all.totalSessions).toBe(3); // Mon, Sat, Sun
		expect(stats.allTime.trad.totalSessions).toBe(0);
	});

	it('scopes last 12 weeks and picks most-active by metric', () => {
		expect(last12WeeksCutoff('2024-04-10')).toBe('2024-01-18');
		const stats = buildWeekdayStats(
			[
				{ date: '2023-12-01', gearStyle: 'Sport' },
				{ date: '2024-02-05', gearStyle: 'Sport' },
				{ date: '2024-04-08', gearStyle: 'Sport' },
				{ date: '2024-04-08', gearStyle: 'Sport' },
				{ date: '2024-04-08', gearStyle: 'Sport' }
			],
			'2024-04-10'
		);
		expect(stats.allTime.all.totalSessions).toBe(3);
		expect(stats.last12Weeks.all.totalSessions).toBe(2);
		expect(pickMostActive(stats.last12Weeks.all.rows, 'sessions')?.weekday).toBe(1);
		// Same session count Mon×2 days vs… only Mon in window; ascents prefer 8 Apr (3 ticks)
		const byAscents = pickMostActive(stats.last12Weeks.all.rows, 'ascents');
		expect(byAscents?.weekday).toBe(1);
		expect(byAscents?.value).toBe(4); // 1 on Feb 5 + 3 on Apr 8
	});
});
