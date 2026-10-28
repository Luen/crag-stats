import { describe, expect, it } from 'vitest';
import {
	buildRouteAscentCounts,
	compareLogbookRows,
	parseLogbookSortKey,
	routePopularity,
	sortLogbookRows,
	type LogbookSortRow
} from './logbookSort';

const base = (p: Partial<LogbookSortRow>): LogbookSortRow => ({
	ascentDate: '2024-06-01',
	effectiveGradeScore: 20,
	gradeScore: 20,
	quality: 'Good',
	stars: 2,
	ascentGearStyle: null,
	gearStyle: 'sport',
	tickType: 'Red point',
	routeProvider: 'thecrag',
	routeExternalId: 'r1',
	popularity: null,
	relativePopularity: null,
	ascentCount: null,
	...p
});

describe('parseLogbookSortKey', () => {
	it('accepts known keys and falls back to date', () => {
		expect(parseLogbookSortKey('popularity')).toBe('popularity');
		expect(parseLogbookSortKey('ASCENTS')).toBe('ascents');
		expect(parseLogbookSortKey('nope')).toBe('date');
	});
});

describe('routePopularity', () => {
	it('prefers comparable relative/global scores and keeps count-only rows missing', () => {
		expect(routePopularity(base({ popularity: 10, relativePopularity: 5, ascentCount: 100 }))).toBe(
			5
		);
		expect(routePopularity(base({ relativePopularity: 5, ascentCount: 100 }))).toBe(5);
		expect(routePopularity(base({ ascentCount: 100 }))).toBeNull();
		expect(routePopularity(base({}))).toBeNull();
	});
});

describe('compareLogbookRows', () => {
	const counts = buildRouteAscentCounts([
		base({ routeExternalId: 'a' }),
		base({ routeExternalId: 'a' }),
		base({ routeExternalId: 'b' })
	]);

	it('sorts style via displayStyle labels', () => {
		const sport = base({ gearStyle: 'sport' });
		const trad = base({ gearStyle: 'trad' });
		expect(compareLogbookRows(sport, trad, 'style', counts)).toBeLessThan(0);
	});

	it('sorts tick by kind order then label', () => {
		const os = base({ tickType: 'Onsight' });
		const rp = base({ tickType: 'Red point' });
		expect(compareLogbookRows(os, rp, 'tick', counts)).toBeLessThan(0);
	});

	it('sorts ascents by per-route logbook count', () => {
		const repeat = base({ routeExternalId: 'a' });
		const once = base({ routeExternalId: 'b' });
		expect(compareLogbookRows(repeat, once, 'ascents', counts)).toBeGreaterThan(0);
	});

	it('keeps null popularity last regardless of pair order', () => {
		const withPop = base({ popularity: 50 });
		const none = base({});
		expect(compareLogbookRows(none, withPop, 'popularity', counts)).toBeGreaterThan(0);
		expect(compareLogbookRows(withPop, none, 'popularity', counts)).toBeLessThan(0);
	});
});

describe('sortLogbookRows', () => {
	it('applies asc/desc while keeping null popularity last when descending', () => {
		const rows = [
			base({ routeExternalId: 'x', popularity: 10 }),
			base({ routeExternalId: 'y', popularity: 30 }),
			base({ routeExternalId: 'z' })
		];
		const desc = sortLogbookRows(rows, 'popularity', false);
		expect(desc.map((r) => r.routeExternalId)).toEqual(['y', 'x', 'z']);
		const asc = sortLogbookRows(rows, 'popularity', true);
		expect(asc.map((r) => r.routeExternalId)).toEqual(['x', 'y', 'z']);
	});
});

it('count-only routes remain last beside real popularity scores (#132)', () => {
	const rows = [
		base({ routeExternalId: 'count', ascentCount: 5000 }),
		base({ routeExternalId: 'score', popularity: 90 })
	];
	for (const asc of [true, false])
		expect(sortLogbookRows(rows, 'popularity', asc).map((r) => r.routeExternalId)).toEqual([
			'score',
			'count'
		]);
});
