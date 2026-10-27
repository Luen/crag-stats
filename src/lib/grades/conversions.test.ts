import { describe, expect, it } from 'vitest';
import {
	convertFromVScale,
	detectAndParseGrade,
	ewbankToVScale,
	formatVScaleLabel
} from './conversions';

describe('detectAndParseGrade — V-scale ranges', () => {
	it('parses V1/2 as midpoint 1.5 (not fake V21)', () => {
		const p = detectAndParseGrade('V1/2', { gearStyle: 'Boulder' });
		expect(p.score).toBe(1.5);
		expect(p.label).toMatch(/^V1\/2$/i);
		expect(p.isBoulder).toBe(true);
	});

	it('parses V5/6 as midpoint 5.5', () => {
		const p = detectAndParseGrade('V5/6', { gearStyle: 'Boulder' });
		expect(p.score).toBe(5.5);
	});

	it('does not treat gradeBand midpoints as V-scores when unparseable', () => {
		const p = detectAndParseGrade('???', {
			gearStyle: 'Boulder',
			gradeBand: 4 // would be Ewbank 28 if misused
		});
		expect(p.score).toBeNull();
		expect(p.label).not.toMatch(/V2[18]/);
	});
});

describe('detectAndParseGrade — VB± labels', () => {
	it('parses VB / VB+ / VB-', () => {
		expect(detectAndParseGrade('VB', { gearStyle: 'Boulder' }).score).toBe(-1);
		expect(detectAndParseGrade('VB+', { gearStyle: 'Boulder' }).score).toBe(-0.5);
		expect(detectAndParseGrade('VB-', { gearStyle: 'Boulder' }).score).toBe(-1.5);
	});

	it('formatVScaleLabel keeps VB+ (does not round -0.5 → V0)', () => {
		expect(formatVScaleLabel(-0.5, 'VB+')).toBe('VB+');
		expect(convertFromVScale(-0.5, 'v_scale')).toBe('VB+');
		expect(convertFromVScale(-1, 'v_scale')).toBe('VB');
		expect(convertFromVScale(-1.5, 'v_scale')).toBe('VB-');
	});
});

describe('detectAndParseGrade — Upendi-style bare boulder numbers', () => {
	it('maps bare "5" on boulder (no AU system) to V5', () => {
		const p = detectAndParseGrade('5', { gearStyle: 'Boulder' });
		expect(p.score).toBe(5);
		expect(p.label).toBe('V5');
		expect(p.system).toBe('v_scale');
	});

	it('maps bare "9" on boulder to V9', () => {
		const p = detectAndParseGrade('9', { gearStyle: 'Boulder' });
		expect(p.score).toBe(9);
		expect(p.label).toBe('V9');
	});
});

describe('detectAndParseGrade — AU on boulder is not V12', () => {
	it('converts AU "12" via ewbank→V (near V0), not V12', () => {
		const p = detectAndParseGrade('12', {
			gearStyle: 'Boulder',
			gradeSystem: 'AU'
		});
		expect(p.score).toBe(ewbankToVScale(12));
		expect(p.score).toBe(0);
		expect(p.label).not.toBe('V12');
		expect(p.label).toBe('V0');
	});

	it('converts AU "10" near VB+, not V10', () => {
		const p = detectAndParseGrade('10', {
			gearStyle: 'Boulder',
			gradeSystem: 'AU'
		});
		expect(p.score).toBe(ewbankToVScale(10));
		expect(p.score).toBeLessThan(0);
		expect(p.label).not.toBe('V10');
	});
});

describe('detectAndParseGrade — French vs Font clash', () => {
	it('parses "5a" on sport as French, not Font 5A / boulder', () => {
		const p = detectAndParseGrade('5a', { gearStyle: 'Sport' });
		expect(p.isBoulder).toBe(false);
		expect(p.system).toBe('french');
		expect(p.score).not.toBeNull();
		// Must not collapse to a tiny V/Font score that became Sport grade 1
		expect(p.score!).toBeGreaterThan(10);
	});

	it('still allows Font when boulder context', () => {
		const p = detectAndParseGrade('6C', {
			gearStyle: 'Boulder',
			gradeSystem: 'FONT'
		});
		expect(p.isBoulder).toBe(true);
		expect(p.score).toBe(5);
	});
});

describe('detectAndParseGrade — route Ewbank', () => {
	it('parses plain Ewbank numbers on sport/trad', () => {
		expect(detectAndParseGrade('25', { gearStyle: 'Sport' }).score).toBe(25);
		expect(detectAndParseGrade('22', { gearStyle: 'Trad' }).score).toBe(22);
		expect(detectAndParseGrade('1', { gearStyle: 'Trad' }).score).toBe(1);
	});
});
