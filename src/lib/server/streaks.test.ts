import { beforeEach, expect, it } from 'vitest';
import { buildBadges } from './badges';
import { getDashboardStats, wipeAllData } from './analytics';
import { upsertAscents } from './ingest';
import type { DashboardExtraRow } from './dashboardExtras';
const day = (i: number) => new Date(Date.UTC(2024, 1, 1 + i)).toISOString().slice(0, 10);
const row = (i: number): DashboardExtraRow => ({
	ascentDate: day(i),
	ascentId: i + 1,
	isSend: false,
	tickType: 'Attempt',
	routeName: 'Synthetic climb',
	gearStyle: 'Gym'
});
it('earns each threshold once on the earliest completion day and counts attempts/indoor days', () => {
	const rows = Array.from({ length: 30 }, (_, i) => row(i));
	const badges = buildBadges([
		...rows.toReversed(),
		row(0),
		{ ...row(0), ascentDate: '2024-02-30' }
	]);
	for (const n of [7, 10, 30])
		expect(badges.earned.find((b) => b.id === `streak_days_${n}`)?.date).toBe(day(n - 1));
	expect(badges.almost.some((b) => b.id.startsWith('streak_days_'))).toBe(false);
	expect(buildBadges(rows.slice(0, 6)).earned.some((b) => b.id.startsWith('streak_days_'))).toBe(
		false
	);
});
it('gaps break streaks, duplicates do not extend them and later breaks do not erase earned badges', () => {
	const first = Array.from({ length: 10 }, (_, i) => row(i));
	expect(
		buildBadges(first.filter((_, i) => i !== 4)).earned.some((b) => b.id.startsWith('streak_days_'))
	).toBe(false);
	expect(
		buildBadges(Array(40).fill(row(0))).earned.some((b) => b.id.startsWith('streak_days_'))
	).toBe(false);
	const badges = buildBadges([...first, { ...row(40), ascentDate: '2026-01-01' }]);
	expect(badges.earned.find((b) => b.id === 'streak_days_10')?.date).toBe(day(9));
});
beforeEach(() => wipeAllData());
it('returns the all-time longest range through the real dashboard, choosing the earliest tie', () => {
	const dates = [
		...Array.from({ length: 10 }, (_, i) => day(i)),
		...Array.from({ length: 10 }, (_, i) => day(i + 15))
	];
	upsertAscents(
		dates.map((ascentDate, i) => ({
			provider: 'thecrag',
			externalId: `streak-${i}`,
			ascentDate,
			isSend: false,
			isAttempt: true,
			route: {
				provider: 'thecrag',
				externalId: 'streak-route',
				name: 'Synthetic streak',
				gearStyle: 'Gym'
			}
		}))
	);
	expect(getDashboardStats().streaks).toMatchObject({
		longestDays: 10,
		longestStartDate: day(0),
		longestEndDate: day(9)
	});
	expect(getDashboardStats().badges.earned.find((b) => b.id === 'streak_days_10')?.date).toBe(
		day(9)
	);
});
