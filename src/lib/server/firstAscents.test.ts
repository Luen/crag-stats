import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { getDashboardStats, listLogbook, wipeAllData } from './analytics';
import {
	buildFirstAscentStats,
	getFirstAscentMarks,
	parseFirstAscentKind,
	routeExists,
	setFirstAscent,
	type FirstAscentRow
} from './firstAscents';
import { upsertAscents } from './ingest';
import { parseTheCragCsv } from './providers/thecrag';

const row = (p: Partial<FirstAscentRow>): FirstAscentRow => ({
	routeId: 1,
	kind: 'FA',
	routeName: 'Route',
	style: 'Sport',
	isBoulder: false,
	score: 20,
	gradeLabel: '20',
	band: 3,
	cragName: 'Crag',
	url: null,
	date: '2024-01-01',
	...p
});

describe('buildFirstAscentStats', () => {
	it('is empty with no marks', () => {
		const s = buildFirstAscentStats([]);
		expect(s.total).toBe(0);
		expect(s.routeRange).toBeNull();
		expect(s.firstYear).toBeNull();
	});

	it('counts kinds, styles, years and keeps route and boulder ranges apart', () => {
		const s = buildFirstAscentStats([
			row({ routeId: 1, score: 18, gradeLabel: '18', date: '2019-05-01' }),
			row({ routeId: 2, score: 24, gradeLabel: '24', kind: 'FFA', style: 'Trad' }),
			row({ routeId: 3, score: null, gradeLabel: null, date: '2026-02-01' }),
			row({
				routeId: 4,
				style: 'Boulder',
				isBoulder: true,
				score: 4,
				gradeLabel: 'V4',
				date: '2022-03-01'
			})
		]);
		expect(s.total).toBe(4);
		expect(s.fa).toBe(3);
		expect(s.ffa).toBe(1);
		expect(s.byStyle.map((x) => [x.style, x.count])).toEqual([
			['Sport', 2],
			['Trad', 1],
			['Boulder', 1]
		]);
		// V4 must not become the "easiest route" under Ewbank 18.
		expect(s.routeRange).toMatchObject({ min: '18', max: '24', count: 2 });
		expect(s.boulderRange).toMatchObject({ min: 'V4', max: 'V4', count: 1 });
		expect([s.firstYear, s.latestYear]).toEqual([2019, 2026]);
		expect(s.recent[0].date).toBe('2026-02-01');
	});

	it('parses kinds strictly', () => {
		expect(parseFirstAscentKind('FA')).toBe('FA');
		expect(parseFirstAscentKind('FFA')).toBe('FFA');
		expect(parseFirstAscentKind('fa')).toBeNull();
		expect(parseFirstAscentKind('')).toBeNull();
	});
});

// In-memory DB (vitest.config.ts), seeded from the sample CSV.
describe('first ascent marks', () => {
	let route = '';
	beforeAll(() => {
		upsertAscents(parseTheCragCsv(readFileSync('samples/thecrag-logbook-sample.csv')));
		route = listLogbook({ q: 'Hard Project' }).rows[0].routeExternalId;
	});

	it('marks, flags logbook rows, feeds the dashboard and unmarks', () => {
		expect(routeExists('thecrag', route)).toBe(true);
		expect(routeExists('thecrag', 'nope')).toBe(false);

		setFirstAscent('thecrag', route, 'FA');
		setFirstAscent('thecrag', route, 'FFA'); // upsert, not a second row
		expect(getFirstAscentMarks().size).toBe(1);
		expect(listLogbook({ q: 'Hard Project' }).rows[0].firstAscent).toBe('FFA');

		const fa = getDashboardStats().firstAscents;
		expect(fa).toMatchObject({ total: 1, ffa: 1 });
		expect(fa.recent[0].routeName).toBe('Hard Project');

		setFirstAscent('thecrag', route, null);
		expect(getDashboardStats().firstAscents.total).toBe(0);
	});

	it('are removed by wipe', () => {
		setFirstAscent('thecrag', route, 'FA');
		wipeAllData();
		expect(getFirstAscentMarks().size).toBe(0);
	});
});
