import { describe, expect, it } from 'vitest';
import {
	defaultVenueForKind,
	gradeGoalReadiness,
	parseGoalGradeScore,
	progressPct
} from './goalsShared';
import { matchesVenueScope, normalizeVenueScope } from './venue';

describe('parseGoalGradeScore', () => {
	it('accepts numeric scores', () => {
		expect(parseGoalGradeScore('25')).toBe(25);
		expect(parseGoalGradeScore(22.5)).toBe(22.5);
	});

	it('parses display grades', () => {
		expect(parseGoalGradeScore('V5', true)).toBe(5);
		expect(parseGoalGradeScore('7a')).not.toBeNull();
	});
});

describe('progressPct', () => {
	it('clamps and scales for height/days goals', () => {
		expect(progressPct(0, 25)).toBe(0);
		expect(progressPct(12.5, 25)).toBe(50);
		expect(progressPct(30, 25)).toBe(100);
		expect(progressPct(10, 0)).toBe(0);
	});
});

describe('gradeGoalReadiness', () => {
	it('is 100% when best send meets the target', () => {
		const r = gradeGoalReadiness({
			target: 23,
			bestSend: 23,
			routesAtNMinus1: 0,
			routesAtNMinus2: 0
		});
		expect(r.pct).toBe(100);
		expect(r.label).toMatch(/Best send 23/);
		expect(r.label).toMatch(/done/i);
	});

	it('does not use linear best/target (22/23 ≠ ~96%)', () => {
		const r = gradeGoalReadiness({
			target: 23,
			bestSend: 22,
			routesAtNMinus1: 1,
			routesAtNMinus2: 0
		});
		expect(r.pct).toBeLessThan(80);
		expect(r.pct).toBeGreaterThanOrEqual(40);
		expect(r.pct).toBeLessThanOrEqual(70);
		expect(r.pct).not.toBe(progressPct(22, 23));
		expect(r.label).toContain('Best send 22');
		expect(r.label).toContain('1/2 at 22');
		expect(r.label).toContain('0/4 at 21');
		expect(r.horizon).toBe('short-term');
	});

	it('caps below 100% without a send at N even with a full soft pyramid', () => {
		const r = gradeGoalReadiness({
			target: 23,
			bestSend: 22,
			routesAtNMinus1: 2,
			routesAtNMinus2: 4
		});
		expect(r.pct).toBeGreaterThan(70);
		expect(r.pct).toBeLessThan(100);
		expect(r.label).toContain('2/2 at 22');
		expect(r.label).toContain('4/4 at 21');
	});

	it('keeps rising with attempts after the pyramid is full, faster for short-term', () => {
		const shortBase = gradeGoalReadiness({
			target: 23,
			bestSend: 22,
			routesAtNMinus1: 2,
			routesAtNMinus2: 4,
			attemptsNearTarget: 0
		});
		const short = gradeGoalReadiness({
			target: 23,
			bestSend: 22,
			routesAtNMinus1: 2,
			routesAtNMinus2: 4,
			attemptsNearTarget: 5
		});
		const shortMore = gradeGoalReadiness({
			target: 23,
			bestSend: 22,
			routesAtNMinus1: 2,
			routesAtNMinus2: 4,
			attemptsNearTarget: 6
		});
		expect(short.pct).toBeGreaterThan(shortBase.pct);
		expect(shortMore.pct).toBeGreaterThan(short.pct);
		expect(shortMore.pct).toBeLessThanOrEqual(90);
		expect(short.label).toContain('5 attempts on ≥22');

		const longBase = gradeGoalReadiness({
			target: 28,
			bestSend: 22,
			routesAtNMinus1: 2,
			routesAtNMinus2: 4,
			attemptsNearTarget: 0
		});
		const long = gradeGoalReadiness({
			target: 28,
			bestSend: 22,
			routesAtNMinus1: 2,
			routesAtNMinus2: 4,
			attemptsNearTarget: 5
		});
		expect(long.horizon).toBe('long-haul');
		expect(long.pct - longBase.pct).toBeLessThan(short.pct - shortBase.pct);
	});

	it('caps overfilled lower buckets', () => {
		const thin = gradeGoalReadiness({
			target: 25,
			bestSend: 23,
			routesAtNMinus1: 0,
			routesAtNMinus2: 20
		});
		const capped = gradeGoalReadiness({
			target: 25,
			bestSend: 23,
			routesAtNMinus1: 0,
			routesAtNMinus2: 4
		});
		expect(thin.pct).toBe(capped.pct);
		expect(thin.pct).toBeLessThan(50);
	});

	it('stays low with no supporting sends', () => {
		const r = gradeGoalReadiness({
			target: 23,
			bestSend: null,
			routesAtNMinus1: 0,
			routesAtNMinus2: 0
		});
		expect(r.pct).toBe(0);
		expect(r.label).toMatch(/No qualifying send yet/i);
		expect(r.horizon).toBe('long-haul');
	});

	it('hints medium / long-haul from the grade gap', () => {
		const medium = gradeGoalReadiness({
			target: 25,
			bestSend: 23,
			routesAtNMinus1: 1,
			routesAtNMinus2: 2
		});
		expect(medium.horizon).toBe('medium');
		expect(medium.label).toContain('Medium');

		const longHaul = gradeGoalReadiness({
			target: 28,
			bestSend: 22,
			routesAtNMinus1: 0,
			routesAtNMinus2: 1
		});
		expect(longHaul.horizon).toBe('long-haul');
		expect(longHaul.label).toContain('Long-haul');
	});
});

describe('venue scope', () => {
	it('defaults grade goals to outdoor', () => {
		expect(defaultVenueForKind('grade')).toBe('outdoor');
		expect(defaultVenueForKind('height_year')).toBe('any');
	});

	it('filters indoor vs outdoor', () => {
		expect(normalizeVenueScope('OUTDOOR')).toBe('outdoor');
		const gym = { cragName: 'Local Climbing Gym', name: 'Warmup' };
		const crag = { cragName: 'Arapiles', name: 'Kachoong' };
		expect(matchesVenueScope('outdoor', gym)).toBe(false);
		expect(matchesVenueScope('outdoor', crag)).toBe(true);
		expect(matchesVenueScope('indoor', gym)).toBe(true);
		expect(matchesVenueScope('any', gym)).toBe(true);
	});
});
