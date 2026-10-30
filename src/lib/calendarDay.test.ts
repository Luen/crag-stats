import { expect, it } from 'vitest';
import { calendarDay } from './calendarDay';
import { buildPartnerStats } from './partnerStats';
import { buildSessionsPerWeek } from './sessionsPerWeek';
import { buildWeekdayStats, validWeekdayDay } from './weekdayStats';
import { weatherAscentDay } from './weatherKeys';

it('rejects placeholders, impossible dates and unknown year; accepts real leap days and timestamp dates', () => {
	for (const bad of [
		null,
		undefined,
		'',
		'2018-00-00',
		'2024-02-31',
		'2025-02-29',
		'2024-13-01',
		'0000-01-01'
	])
		expect(calendarDay(bad)).toBeNull();
	expect(calendarDay('2024-02-29')).toBe('2024-02-29');
	expect(calendarDay('2024-01-01T23:00:00-12:00')).toBe('2024-01-01');
});
it('uses the same session-day set for Partners, Weekday, weekly sessions and weather', () => {
	const dates = [
		'2018-00-00',
		'2024-02-31',
		'2025-02-29',
		'2024-02-29',
		'2024-02-29T12:00:00Z',
		'2024-03-01'
	];
	expect(
		buildPartnerStats(dates.map((ascentDate) => ({ ascentDate, partners: 'Pat' })))[0]?.sessions
	).toBe(2);
	expect(buildWeekdayStats(dates.map((date) => ({ date }))).allTime.all.totalSessions).toBe(2);
	expect(
		Object.values(buildSessionsPerWeek(dates).byYear)
			.flat()
			.reduce((n, w) => n + w.sessions, 0)
	).toBe(2);
	expect(dates.map(validWeekdayDay)).toEqual(dates.map(calendarDay));
	expect(dates.map(weatherAscentDay)).toEqual(dates.map(calendarDay));
});

it('keeps valid four-digit early years safe in weekly session arithmetic', () => {
	expect(calendarDay('0099-01-02')).toBe('0099-01-02');
	const stats = buildSessionsPerWeek(['0099-01-02']);
	expect(stats.byYear['0099']?.reduce((n, w) => n + w.sessions, 0)).toBe(1);
	expect(stats.byYear['0099']?.some((w) => w.week === 1 && w.sessions === 1)).toBe(true);
});
