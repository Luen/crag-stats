import { describe, expect, it } from 'vitest';
import { BADGE_CATALOG, buildBadges, formatBadgeDate } from './badges';
import { buildMilestones, firstAscentSends, type DashboardExtraRow } from './dashboardExtras';

function row(partial: Partial<DashboardExtraRow> & { ascentDate: string }): DashboardExtraRow {
	return {
		isSend: false,
		tickType: 'Attempt',
		routeName: 'Test Route',
		...partial
	};
}

describe('formatBadgeDate', () => {
	it('formats ISO dates with year', () => {
		expect(formatBadgeDate('2018-04-22')).toBe('Apr 22, 2018');
		expect(formatBadgeDate('2024-08-27')).toBe('Aug 27, 2024');
	});
});

describe('buildBadges', () => {
	it('exposes a fixed catalog size', () => {
		expect(BADGE_CATALOG.length).toBeGreaterThanOrEqual(30);
		const empty = buildBadges([]);
		expect(empty.earnedCount).toBe(0);
		expect(empty.totalCount).toBe(BADGE_CATALOG.length);
		expect(empty.locked.length).toBe(BADGE_CATALOG.length);
	});

	it('earns first moves, session, and send from logbook order', () => {
		const rows: DashboardExtraRow[] = [
			row({
				ascentDate: '2020-01-01',
				tickType: 'Attempt',
				isSend: false,
				routeName: 'Warmup',
				ascentId: 1
			}),
			row({
				ascentDate: '2020-01-02',
				tickType: 'Red point',
				isSend: true,
				routeName: 'First Blood',
				gearStyle: 'Sport',
				ascentId: 2
			})
		];
		const { earned } = buildBadges(rows);
		const ids = new Set(earned.map((b) => b.id));
		expect(ids.has('first_moves')).toBe(true);
		expect(ids.has('first_session')).toBe(true);
		expect(ids.has('first_send')).toBe(true);
		expect(ids.has('style_sport')).toBe(true);
		expect(earned.find((b) => b.id === 'first_moves')?.detail).toMatch(/Imported 2 climbs/);
	});

	it('picks same-day firsts by ascent id, not alphabetical route name', () => {
		const rows: DashboardExtraRow[] = [
			row({
				ascentDate: '2018-04-22',
				tickType: 'Flash',
				isSend: true,
				routeName: 'Nacho Libre',
				ascentId: 177
			}),
			row({
				ascentDate: '2018-04-22',
				tickType: 'Flash',
				isSend: true,
				routeName: 'Torched',
				ascentId: 165
			}),
			row({
				ascentDate: '2018-04-27',
				tickType: 'Onsight',
				isSend: true,
				routeName: 'Honeycomb',
				ascentId: 91
			}),
			row({
				ascentDate: '2018-04-27',
				tickType: 'Onsight',
				isSend: true,
				routeName: 'Mumble Crumble',
				ascentId: 47
			})
		];
		const { earned } = buildBadges(rows);
		expect(earned.find((b) => b.id === 'first_session')?.routeName).toBe('Torched');
		expect(earned.find((b) => b.id === 'first_send')?.routeName).toBe('Torched');
		expect(earned.find((b) => b.id === 'first_send')?.detail).toMatch(/Flash/);
		expect(earned.find((b) => b.id === 'first_flash')?.routeName).toBe('Torched');
		expect(earned.find((b) => b.id === 'first_onsight')?.routeName).toBe('Mumble Crumble');
	});

	it('counts onsights and weekend sends', () => {
		const rows: DashboardExtraRow[] = [];
		for (let i = 0; i < 10; i++) {
			rows.push(
				row({
					ascentDate: `2024-02-${String(i + 1).padStart(2, '0')}`,
					tickType: 'Onsight',
					isSend: true,
					routeName: `OS ${i + 1}`,
					gearStyle: 'Sport'
				})
			);
		}
		// Five Saturdays for weekend_5
		for (let i = 0; i < 5; i++) {
			rows.push(
				row({
					ascentDate: `2024-03-${String(2 + i * 7).padStart(2, '0')}`, // Mar 2,9,16,23,30 2024 = Saturdays
					tickType: 'Red point',
					isSend: true,
					routeName: `WE ${i + 1}`,
					gearStyle: 'Sport'
				})
			);
		}
		const { earned } = buildBadges(rows);
		const ids = new Set(earned.map((b) => b.id));
		expect(ids.has('first_onsight')).toBe(true);
		expect(ids.has('onsight_10')).toBe(true);
		expect(ids.has('weekend_5')).toBe(true);
		expect(earned.find((b) => b.id === 'onsight_10')?.detail).toMatch(/10th/);
	});

	it('tracks countries and does not drop earned badges when activity stops', () => {
		const rows: DashboardExtraRow[] = [
			row({
				ascentDate: '2019-05-01',
				isSend: true,
				tickType: 'Tick',
				country: 'Australia',
				routeName: 'Local'
			}),
			row({
				ascentDate: '2019-06-01',
				isSend: true,
				tickType: 'Tick',
				country: 'Spain',
				routeName: 'Away'
			})
		];
		const once = buildBadges(rows);
		expect(once.earned.some((b) => b.id === 'country_2')).toBe(true);
		// Same history again (no new climbs) still earns — breaks don't erase.
		const again = buildBadges(rows);
		expect(again.earnedCount).toBe(once.earnedCount);
	});

	it('never treats first-go-only as needing later badges incorrectly', () => {
		const rows = [
			row({
				ascentDate: '2021-03-01',
				isSend: true,
				tickType: 'Onsight',
				routeName: 'Gift',
				gearStyle: 'Sport',
				gradeBand: 2,
				gradeScore: 18
			})
		];
		const { earned } = buildBadges(rows);
		expect(earned.some((b) => b.id === 'first_send')).toBe(true);
		expect(earned.some((b) => b.id === 'band_intermediate')).toBe(true);
		expect(earned.some((b) => b.id === 'new_high')).toBe(true);
	});
});

describe('first ascent badges and milestones', () => {
	// Route 1: an attempt, then the first send (2021-03-05), then a repeat. Marked FA.
	const fa = (p: Partial<DashboardExtraRow> & { ascentDate: string }) =>
		row({ routeId: 1, routeName: 'New Line', firstAscent: 'FA', ...p });

	it('dates the FA by the first send of the marked route', () => {
		const rows = [
			fa({ ascentDate: '2021-03-01', ascentId: 1 }),
			fa({ ascentDate: '2021-03-05', ascentId: 2, isSend: true, tickType: 'Red point' }),
			fa({ ascentDate: '2022-01-01', ascentId: 3, isSend: true, tickType: 'Red point' })
		];
		const earned = buildBadges(rows).earned;
		const badge = earned.find((b) => b.id === 'first_fa');
		expect(badge?.date).toBe('2021-03-05');
		expect(badge?.detail).toContain('First ascent · New Line');
		expect(earned.some((b) => b.id === 'first_ffa')).toBe(false);

		expect(buildMilestones(rows).items.filter((i) => i.kind === 'fa')).toEqual([
			{ id: 'fa:1', kind: 'fa', label: 'First ascent', date: '2021-03-05', detail: 'New Line' }
		]);
		expect(firstAscentSends(rows).map((s) => s.day)).toEqual(['2021-03-05']);
	});

	it("doesn't earn anything until the marked route is sent", () => {
		const rows = [fa({ ascentDate: '2021-03-01', ascentId: 1 })];
		expect(buildBadges(rows).earned.some((b) => b.id === 'first_fa')).toBe(false);
		expect(buildMilestones(rows).items.some((i) => i.kind === 'fa')).toBe(false);
	});

	it('counts distinct routes for 5 First Ascents, mixing FA and FFA', () => {
		const rows = Array.from({ length: 5 }, (_, i) =>
			row({
				ascentDate: `2023-0${i + 1}-10`,
				ascentId: i + 1,
				routeId: 10 + i,
				routeName: `Line ${i}`,
				isSend: true,
				tickType: 'Red point',
				firstAscent: i === 2 ? 'FFA' : 'FA'
			})
		);
		const earned = buildBadges(rows).earned;
		expect(earned.find((b) => b.id === 'first_ffa')?.date).toBe('2023-03-10');
		expect(earned.find((b) => b.id === 'fa_5')?.date).toBe('2023-05-10');
		expect(earned.some((b) => b.id === 'fa_10')).toBe(false);
	});
});

describe('route setter badges', () => {
	it('awards setter milestones from route history hits', () => {
		const hits = [
			{
				date: '2019-01-01',
				routeName: 'A',
				href: null,
				detail: 'First route set · A'
			},
			{
				date: '2019-02-01',
				routeName: 'B',
				href: null,
				detail: 'x'
			},
			{
				date: '2019-03-01',
				routeName: 'C',
				href: null,
				detail: 'x'
			},
			{
				date: '2019-04-01',
				routeName: 'D',
				href: null,
				detail: 'x'
			},
			{
				date: '2019-05-01',
				routeName: 'E',
				href: null,
				detail: 'Route set #5 · E'
			}
		];
		const earned = buildBadges([], hits).earned;
		expect(earned.find((b) => b.id === 'first_setter')?.date).toBe('2019-01-01');
		expect(earned.find((b) => b.id === 'setter_5')?.date).toBe('2019-05-01');
		expect(earned.some((b) => b.id === 'setter_10')).toBe(false);
	});
});
