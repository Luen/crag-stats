import { describe, expect, it } from 'vitest';
import { defaultVenueForKind, parseGoalGradeScore, progressPct } from './goalsShared';
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
	it('clamps and scales', () => {
		expect(progressPct(0, 25)).toBe(0);
		expect(progressPct(12.5, 25)).toBe(50);
		expect(progressPct(30, 25)).toBe(100);
		expect(progressPct(10, 0)).toBe(0);
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
