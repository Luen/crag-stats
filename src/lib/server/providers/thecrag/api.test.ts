import { describe, expect, it } from 'vitest';
import { flattenRouteTags, mapAscent } from './api';

describe('flattenRouteTags', () => {
	it('flattens nested theCrag tag maps into chips', () => {
		const tags = flattenRouteTags({
			'Rock type': { Granite: { id: 1, name: 'Granite' } },
			Steepness: { Vertical: { id: 2, name: 'Vertical' } },
			Aspect: { NE: { id: 3, name: 'NE' } }
		});
		expect(tags).toEqual(
			expect.arrayContaining([
				{ category: 'Rock type', name: 'Granite' },
				{ category: 'Steepness', name: 'Vertical' },
				{ category: 'Aspect', name: 'NE' }
			])
		);
	});
});

describe('mapAscent — grade regressions', () => {
	it('Splinder: AU ascent 12 on V0 boulder stays V0', () => {
		const mapped = mapAscent({
			id: 2575638429,
			grade: '12',
			gradeSystem: 'AU',
			climbedGearStyle: 'boulder',
			tick: { name: 'Tick' },
			cpr: { base: { grade: '12', band: 1, rating: 968 } },
			route: {
				id: 1,
				name: 'Splinder',
				grade: 'V0',
				style: 'Boulder',
				urlAncestorStub: 'australia/x'
			}
		});
		expect(mapped).not.toBeNull();
		expect(mapped!.effectiveGradeScore).toBe(0);
		expect(mapped!.effectiveGradeRaw).toBe('V0');
		expect(mapped!.ascentUrl).toContain('/ascent/2575638429');
	});

	it('Alone: AU ascent 10 on VB+ stays VB+', () => {
		const mapped = mapAscent({
			id: 2579872269,
			grade: '10',
			gradeSystem: 'AU',
			tick: { name: 'Flash' },
			cpr: { base: { grade: '9', band: 1 } },
			route: {
				id: 2,
				name: 'Alone',
				grade: 'VB+',
				style: 'Boulder',
				urlAncestorStub: 'australia/x'
			}
		});
		expect(mapped!.effectiveGradeScore).toBe(-0.5);
		expect(mapped!.effectiveGradeRaw).toBe('VB+');
	});

	it('Upendi: bare boulder grade 5 → V5', () => {
		const mapped = mapAscent({
			id: 2039606838,
			with: '@jodierummer',
			quality: 'Average',
			label: 'Upendi',
			tick: { name: 'Onsight' },
			route: {
				id: 3,
				name: 'Upendi',
				grade: '5',
				style: 'Boulder',
				urlAncestorStub: 'australia/castle-hill',
				tags: {
					'Rock type': { Granite: { name: 'Granite' } }
				},
				ancestors: {
					TLC: { id: 11818021, name: 'Castle Hill', urlAncestorStub: 'australia/townsville' }
				}
			}
		});
		expect(mapped!.effectiveGradeRaw).toBe('V5');
		expect(mapped!.effectiveGradeScore).toBe(5);
		expect(mapped!.partners).toBe('@jodierummer');
		expect(mapped!.quality).toBe('Average');
		expect(mapped!.ascentLabel).toBe('Upendi');
		expect(mapped!.route.tags).toEqual([{ category: 'Rock type', name: 'Granite' }]);
		expect(mapped!.route.cragName).toBe('Castle Hill');
		expect(mapped!.route.cragUrl).toContain('/area/11818021');
	});

	it('Trad route ignores boulder CPR VB (no −1)', () => {
		const mapped = mapAscent({
			id: 99,
			grade: 'VB',
			gradeSystem: 'BLDV',
			tick: { name: 'Onsight' },
			cpr: { base: { grade: 'VB', band: 1 } },
			route: {
				id: 9,
				name: 'Gropefest',
				grade: '8',
				style: 'Trad',
				urlAncestorStub: 'australia/x'
			}
		});
		expect(mapped!.effectiveGradeScore).toBe(8);
		expect(mapped!.effectiveGradeRaw).not.toMatch(/VB|-1/i);
	});

	it('Sport French 5a is not Font / grade 1', () => {
		const mapped = mapAscent({
			id: 55,
			tick: { name: 'Onsight' },
			route: {
				id: 55,
				name: 'Ay Candemor',
				grade: '5a',
				style: 'Sport',
				urlAncestorStub: 'spain/x'
			}
		});
		expect(mapped!.effectiveGradeScore).not.toBe(1);
		expect(mapped!.effectiveGradeScore).toBeGreaterThan(10);
		expect(mapped!.route.gradeScore).toBeGreaterThan(10);
	});
});

describe('mapAscent — multipitch', () => {
	it('effective grade is hardest climbed pitch with P label', () => {
		const mapped = mapAscent({
			id: 77,
			tick: { name: 'Tick' },
			pitch: [
				{ number: 1, grade: '18', tick: { name: 'Onsight' }, height: [30, 'm'] },
				{ number: 2, grade: '21', tick: { name: 'Red point' }, height: [25, 'm'] },
				{ number: 3, grade: '24', tick: null }
			],
			route: {
				id: 77,
				name: 'Neon God',
				grade: '24',
				style: 'Trad',
				urlAncestorStub: 'australia/x'
			}
		});
		expect(mapped!.effectiveGradeScore).toBe(21);
		expect(mapped!.pitchLabel).toBe('P1–P2');
		expect(mapped!.heightM).toBe(55);
	});
});
