import { describe, expect, it } from 'vitest';
import { BADGE_CATALOG, buildBadges, formatBadgeDate } from './badges';
import type { DashboardExtraRow } from './dashboardExtras';

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
			row({ ascentDate: '2020-01-01', tickType: 'Attempt', isSend: false, routeName: 'Warmup', ascentId: 1 }),
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
