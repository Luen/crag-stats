import { describe, expect, it } from 'vitest';
import { gradeSystemFitsStyle, resolveEffectiveGrade } from './effectiveGrade';

describe('gradeSystemFitsStyle', () => {
	it('rejects boulder CPR systems on trad/sport (Trad −1 / VB bug)', () => {
		expect(gradeSystemFitsStyle('BLDV', 'Trad')).toBe(false);
		expect(gradeSystemFitsStyle('V', 'Sport')).toBe(false);
		expect(gradeSystemFitsStyle('FONT', 'Trad')).toBe(false);
	});

	it('allows AU and BLDV on boulder', () => {
		expect(gradeSystemFitsStyle('AU', 'Boulder')).toBe(true);
		expect(gradeSystemFitsStyle('BLDV', 'Boulder')).toBe(true);
	});

	it('allows empty system anywhere', () => {
		expect(gradeSystemFitsStyle(null, 'Trad')).toBe(true);
		expect(gradeSystemFitsStyle('', 'Sport')).toBe(true);
	});
});

describe('resolveEffectiveGrade — Splinder / Alone (AU on V-route)', () => {
	it('Splinder: route V0 + ascent AU 12 → V0 (not V12)', () => {
		const g = resolveEffectiveGrade({
			routeGrade: 'V0',
			routeStyle: 'Boulder',
			ascentGrade: '12',
			ascentGradeSystem: 'AU',
			cprGrade: '12',
			cprBand: 1
		});
		expect(g.score).toBe(0);
		expect(g.raw).toBe('V0');
	});

	it('Alone: route VB+ + ascent AU 10 → VB+ (not V10)', () => {
		const g = resolveEffectiveGrade({
			routeGrade: 'VB+',
			routeStyle: 'Boulder',
			ascentGrade: '10',
			ascentGradeSystem: 'AU',
			cprGrade: '9',
			cprBand: 1
		});
		expect(g.score).toBe(-0.5);
		expect(g.raw).toBe('VB+');
	});
});

describe('resolveEffectiveGrade — Upendi bare AU boulder route', () => {
	it('bare route grade 5 on boulder → V5', () => {
		const g = resolveEffectiveGrade({
			routeGrade: '5',
			routeStyle: 'Boulder'
		});
		expect(g.score).toBe(5);
		expect(g.raw).toBe('V5');
	});

	it('ascent bare "5" (no AU system) on boulder → V5', () => {
		const g = resolveEffectiveGrade({
			routeGrade: '5',
			routeStyle: 'Boulder',
			ascentGrade: '5'
		});
		expect(g.score).toBe(5);
		expect(g.raw).toBe('V5');
	});
});

describe('resolveEffectiveGrade — Trad CPR VB must not win', () => {
	it('rejects CPR VB overlay on trad route grade 8', () => {
		const g = resolveEffectiveGrade({
			routeGrade: '8',
			routeStyle: 'Trad',
			cprGrade: 'VB',
			ascentGradeSystem: 'BLDV'
		});
		expect(g.score).toBe(8);
		expect(g.raw).not.toMatch(/VB/i);
		expect(g.raw).not.toBe('-1');
	});

	it('rejects ascent gradeSystem BLDV on sport', () => {
		const g = resolveEffectiveGrade({
			routeGrade: '22',
			routeStyle: 'Sport',
			ascentGrade: 'V3',
			ascentGradeSystem: 'BLDV'
		});
		expect(g.score).toBe(22);
	});
});

describe('resolveEffectiveGrade — multipitch hardest climbed pitch', () => {
	it('uses hardest climbed pitch, not full route grade', () => {
		const g = resolveEffectiveGrade({
			routeGrade: '25',
			routeStyle: 'Trad',
			routeHeightM: 120,
			pitches: [
				{ number: 1, grade: '18', tick: { name: 'Onsight' }, height: 40 },
				{ number: 2, grade: '22', tick: { name: 'Onsight' }, height: 45 },
				{ number: 3, grade: '25', tick: null, height: 35 }
			]
		});
		expect(g.score).toBe(22);
		expect(g.pitchLabel).toBe('P1–P2');
		expect(g.pitchesClimbed).toBe(2);
		expect(g.partialMultipitch).toBe(true);
		expect(g.heightM).toBe(85);
	});

	it('labels a single climbed pitch as P1', () => {
		const g = resolveEffectiveGrade({
			routeGrade: '24',
			routeStyle: 'Trad',
			pitches: [
				{ number: 1, grade: '19', tick: { label: 'tick' } },
				{ number: 2, grade: '24', tick: { name: '' } }
			]
		});
		expect(g.score).toBe(19);
		expect(g.pitchLabel).toBe('P1');
	});
});
