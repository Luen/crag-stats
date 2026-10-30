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
	it('dates First Moves by import while other badges retain their climb dates', () => {
		const rows = [
			row({
				ascentDate: '2018-04-22',
				isSend: true,
				ascentUrl: 'https://www.thecrag.com/ascent/123',
				routeName: 'Synthetic climb'
			})
		];
		const context = {
			firstImport: { at: '2026-10-26T14:30:00.000Z', count: 902, legacy: false },
			dateDisplay: { locale: 'en-AU', timeZone: 'Australia/Brisbane' }
		};
		const { earned } = buildBadges(rows, [], [], context);
		const first = earned.find((b) => b.id === 'first_moves')!;
		expect(first.detail).toBe('Imported 902 climbs · 27 Oct 2026');
		expect(first.href).toBeNull();
		expect(first.routeName).toBeNull();
		expect(earned.find((b) => b.id === 'first_session')?.date).toBe('2018-04-22');
		expect(earned.find((b) => b.id === 'first_send')?.href).toBe(
			'https://www.thecrag.com/ascent/123'
		);
		const older = row({ ascentDate: '2000-01-01' });
		expect(
			buildBadges([...rows, older], [], [], context).earned.find((b) => b.id === 'first_moves')
		).toEqual(first);
	});

	it('does not award First Moves until a dated first import exists', () => {
		const rows = [
			row({ ascentDate: '2018-04-22' }),
			{ ...row({ ascentDate: '2018-04-23' }), ascentDate: null }
		];
		expect(buildBadges(rows).earned.some((b) => b.id === 'first_moves')).toBe(false);
		expect(
			buildBadges(rows, [], [], { firstImport: { at: null, count: 0, legacy: false } }).earned.some(
				(b) => b.id === 'first_moves'
			)
		).toBe(false);
	});

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
		const { earned } = buildBadges(rows, [], [], {
			firstImport: { at: '2020-01-01T00:00:00.000Z', count: 2, legacy: false }
		});
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

	it('earns Christmas Day from any logged ascent on 25 Dec', () => {
		const rows = [
			row({
				ascentDate: '2022-12-25',
				tickType: 'Attempt',
				isSend: false,
				routeName: 'Holiday Attempt',
				ascentId: 1
			})
		];
		const badge = buildBadges(rows).earned.find((b) => b.id === 'holiday_christmas');
		expect(badge?.date).toBe('2022-12-25');
		expect(badge?.detail).toMatch(/Christmas Day/);
		expect(buildBadges(rows).earned.some((b) => b.id === 'holiday_new_year')).toBe(false);
	});

	it('earns outdoor weather badges from cached Open-Meteo days', () => {
		const weatherByKey = new Map([
			['-33.9|151.2|2024-01-10', { tempMaxC: 36, tempMinC: 22, precipMm: 0, weatherCode: 0 }],
			['-33.9|151.2|2024-01-11', { tempMaxC: 4, tempMinC: -2, precipMm: 0, weatherCode: 0 }],
			['-33.9|151.2|2024-01-12', { tempMaxC: 12, tempMinC: 8, precipMm: 2.5, weatherCode: 61 }],
			['-33.9|151.2|2024-01-13', { tempMaxC: 0.5, tempMinC: -3, precipMm: 1.5, weatherCode: 73 }],
			[
				'-33.9|151.2|2024-01-14',
				{ tempMaxC: 16, tempMinC: 10, precipMm: 0, weatherCode: 0, windMaxKmh: 62 }
			]
		]);
		const rows = [
			row({
				ascentDate: '2024-01-10',
				lat: -33.87,
				lon: 151.21,
				routeName: 'Hot Route',
				ascentId: 1
			}),
			row({
				ascentDate: '2024-01-11',
				lat: -33.87,
				lon: 151.21,
				routeName: 'Cold Route',
				ascentId: 2
			}),
			row({
				ascentDate: '2024-01-12',
				lat: -33.87,
				lon: 151.21,
				routeName: 'Wet Route',
				ascentId: 3
			}),
			row({
				ascentDate: '2024-01-13',
				lat: -33.87,
				lon: 151.21,
				routeName: 'Snow Route',
				ascentId: 4
			}),
			row({
				ascentDate: '2024-01-14',
				lat: -33.87,
				lon: 151.21,
				routeName: 'Windy Route',
				ascentId: 5
			})
		];
		const earned = buildBadges(rows, [], [], { weatherByKey }).earned;
		expect(earned.find((b) => b.id === 'weather_heat')?.detail).toMatch(/36°C/);
		expect(earned.find((b) => b.id === 'weather_freeze')?.detail).toMatch(/-2°C/);
		expect(earned.find((b) => b.id === 'weather_rain')?.detail).toMatch(/2\.5 mm/);
		expect(earned.find((b) => b.id === 'weather_snow')?.detail).toMatch(/snow/i);
		expect(earned.find((b) => b.id === 'weather_wind')?.detail).toMatch(/62 km\/h/);
		// Without cache, weather badges stay locked.
		expect(buildBadges(rows).earned.some((b) => b.id.startsWith('weather_'))).toBe(false);
	});

	it('does not award weather badges for indoor routes that share a cached day', () => {
		const weatherByKey = new Map([
			['-33.9|151.2|2024-01-10', { tempMaxC: 36, tempMinC: 22, precipMm: 0, weatherCode: 0 }]
		]);
		const outdoor = row({
			ascentDate: '2024-01-10',
			lat: -33.87,
			lon: 151.21,
			routeName: 'Hot Route',
			cragName: 'Real Crag',
			gearStyle: 'Sport',
			ascentId: 1
		});
		const indoor = row({
			ascentDate: '2024-01-10',
			lat: -33.87,
			lon: 151.21,
			routeName: 'Campus Board',
			cragName: 'Local Climbing Gym',
			gearStyle: 'Boulder',
			ascentId: 2
		});
		expect(
			buildBadges([indoor], [], [], { weatherByKey }).earned.some((b) => b.id === 'weather_heat')
		).toBe(false);
		expect(
			buildBadges([outdoor], [], [], { weatherByKey }).earned.some((b) => b.id === 'weather_heat')
		).toBe(true);
	});

	it('earns New Year from Eve or Day, as one badge', () => {
		const eve = buildBadges([
			row({
				ascentDate: '2023-12-31',
				tickType: 'Attempt',
				isSend: false,
				routeName: 'Eve Attempt',
				ascentId: 1
			})
		]).earned.find((b) => b.id === 'holiday_new_year');
		expect(eve?.date).toBe('2023-12-31');
		expect(eve?.detail).toMatch(/New Year’s Eve/);

		const day = buildBadges([
			row({
				ascentDate: '2024-01-01',
				tickType: 'Tick',
				isSend: true,
				routeName: 'Day Send',
				ascentId: 2
			})
		]).earned.find((b) => b.id === 'holiday_new_year');
		expect(day?.date).toBe('2024-01-01');
		expect(day?.detail).toMatch(/New Year’s Day/);

		const both = buildBadges([
			row({
				ascentDate: '2023-12-31',
				tickType: 'Attempt',
				isSend: false,
				routeName: 'Eve',
				ascentId: 1
			}),
			row({
				ascentDate: '2024-01-01',
				tickType: 'Tick',
				isSend: true,
				routeName: 'Day',
				ascentId: 2
			})
		]).earned.filter((b) => b.id === 'holiday_new_year');
		expect(both).toHaveLength(1);
		expect(both[0]?.date).toBe('2023-12-31');
	});

	it('earns 250m Day from summed heights on one calendar day', () => {
		const rows = [
			row({
				ascentDate: '2021-07-04',
				tickType: 'Attempt',
				isSend: false,
				routeName: 'Pitch A',
				heightM: 120,
				ascentId: 1
			}),
			row({
				ascentDate: '2021-07-04',
				tickType: 'Tick',
				isSend: true,
				routeName: 'Pitch B',
				routeHeightM: 140,
				ascentId: 2
			}),
			row({
				ascentDate: '2021-07-05',
				tickType: 'Tick',
				isSend: true,
				routeName: 'Next Day',
				heightM: 200,
				ascentId: 3
			})
		];
		const badge = buildBadges(rows).earned.find((b) => b.id === 'day_height_250');
		expect(badge?.date).toBe('2021-07-04');
		expect(badge?.detail).toMatch(/250 m in one day/);
		expect(badge?.routeName).toBe('Pitch B');
	});

	it('keeps a single Ten K Vertical badge id (no duplicate 10 km)', () => {
		const tenK = BADGE_CATALOG.filter((b) => b.id === 'height_10km');
		expect(tenK).toHaveLength(1);
		expect(tenK[0]?.title).toBe('Ten K Vertical');
		expect(
			BADGE_CATALOG.some((b) => /10.?000|10km|ten.?k/i.test(b.id) && b.id !== 'height_10km')
		).toBe(false);
		expect(BADGE_CATALOG.filter((b) => b.id.startsWith('height_')).map((b) => b.id)).toEqual([
			'height_1km',
			'height_5km',
			'height_10km',
			'height_20km'
		]);
	});
});

describe('first ascent badges and milestones', () => {
	// Route 1: an attempt, then the first send (2021-03-05), then a repeat. Marked FA.
	const fa = (p: Partial<DashboardExtraRow> & { ascentDate: string }) =>
		row({ routeId: 1, routeName: 'New Line', firstAscent: 'FA', gearStyle: 'Sport', ...p });

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
			{
				id: 'fa:first',
				kind: 'fa',
				label: 'First ascent',
				date: '2021-03-05',
				detail: 'New Line'
			}
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
				gearStyle: 'Sport',
				isSend: true,
				tickType: 'Red point',
				firstAscent: i === 2 ? 'FFA' : 'FA'
			})
		);
		const earned = buildBadges(rows).earned;
		expect(earned.find((b) => b.id === 'first_ffa')?.date).toBe('2023-03-10');
		expect(earned.find((b) => b.id === 'fa_5')?.date).toBe('2023-05-10');
		expect(earned.some((b) => b.id === 'fa_10')).toBe(false);

		const faMilestones = buildMilestones(rows).items.filter((i) => i.kind === 'fa');
		expect(faMilestones.map((i) => i.id).sort()).toEqual(['fa:5', 'fa:first', 'ffa:first']);
		expect(faMilestones.find((i) => i.id === 'fa:5')).toMatchObject({
			date: '2023-05-10',
			detail: 'Line 4'
		});
	});

	it('adds FFA count and style FA threshold milestones and badges (#194)', () => {
		const rows = Array.from({ length: 10 }, (_, i) =>
			row({
				ascentDate: `2024-${String(i + 1).padStart(2, '0')}-15`,
				ascentId: i + 1,
				routeId: 100 + i,
				routeName: `Boulder FA ${i}`,
				gearStyle: 'Boulder',
				isSend: true,
				tickType: 'Send',
				firstAscent: i < 5 ? 'FFA' : 'FA'
			})
		);
		const earned = buildBadges(rows).earned;
		expect(earned.find((b) => b.id === 'ffa_5')?.date).toBe('2024-05-15');
		expect(earned.find((b) => b.id === 'fa_10')?.date).toBe('2024-10-15');
		expect(earned.find((b) => b.id === 'fa_boulder_10')?.date).toBe('2024-10-15');
		expect(earned.some((b) => b.id === 'ffa_10')).toBe(false);

		const faMilestones = buildMilestones(rows).items.filter((i) => i.kind === 'fa');
		expect(faMilestones.map((i) => i.id).sort()).toEqual([
			'fa:10',
			'fa:5',
			'fa:boulder:10',
			'fa:first',
			'ffa:5',
			'ffa:first'
		]);
		expect(faMilestones.find((i) => i.id === 'ffa:5')).toMatchObject({
			label: '5 first free ascents',
			date: '2024-05-15',
			detail: 'Boulder FA 4'
		});
		expect(faMilestones.find((i) => i.id === 'fa:boulder:10')).toMatchObject({
			label: '10 boulder first ascents',
			date: '2024-10-15',
			detail: 'Boulder FA 9'
		});
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
