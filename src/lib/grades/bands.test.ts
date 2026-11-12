import { describe, expect, it } from 'vitest';
import {
	bandFromEwbank,
	bandFromTheCragScore,
	bandFromVScale,
	boulderPyramidScoreKey,
	getBandName,
	GRADE_BANDS
} from './bands';
import { detectAndParseGrade } from './conversions';

describe('bandFromVScale', () => {
	it('matches theCrag boulder bands (V0 is Intermediate / yellow)', () => {
		expect(bandFromVScale(-1.5)?.name).toBe('Beginner'); // VB-
		expect(bandFromVScale(-1)?.name).toBe('Beginner'); // VB
		expect(bandFromVScale(-0.5)?.name).toBe('Beginner'); // VB+
		expect(bandFromVScale(-0.3)?.name).toBe('Intermediate'); // V0-
		expect(bandFromVScale(0)?.name).toBe('Intermediate'); // V0
		expect(bandFromVScale(0.3)?.name).toBe('Intermediate'); // V0+
		expect(bandFromVScale(1)?.name).toBe('Experienced');
		expect(bandFromVScale(4)?.name).toBe('Experienced');
		expect(bandFromVScale(5)?.name).toBe('Expert');
		expect(bandFromVScale(11)?.name).toBe('Elite');
	});

	it('keeps in-between Font grades in theCrag bands', () => {
		const band = (g: string) => detectAndParseGrade(g, { gearStyle: 'Boulder' }).band?.name;
		expect(band('3C+')).toBe('Beginner');
		expect(band('4A')).toBe('Intermediate');
		expect(band('4C+')).toBe('Intermediate');
		expect(band('5A')).toBe('Experienced');
		expect(band('6B+')).toBe('Experienced');
		expect(band('6C')).toBe('Expert');
		expect(band('7C+')).toBe('Expert');
		expect(band('8A')).toBe('Elite');
	});
});

describe('bandFromEwbank', () => {
	it('keeps whole Ewbank grades in their bands', () => {
		const names = (grades: number[]) => grades.map((g) => bandFromEwbank(g)?.name);
		expect(names([1, 12])).toEqual(['Beginner', 'Beginner']);
		expect(names([13, 18])).toEqual(['Intermediate', 'Intermediate']);
		expect(names([19, 24])).toEqual(['Experienced', 'Experienced']);
		expect(names([25, 32])).toEqual(['Expert', 'Expert']);
		expect(names([33, 39, 45])).toEqual(['Elite', 'Elite', 'Elite']);
		expect(bandFromEwbank(0)?.name).toBe('Beginner');
		expect(bandFromEwbank(null)).toBeNull();
	});

	it('bands scores between whole grades by theCrag score, never Elite by default', () => {
		const band = (g: string) => detectAndParseGrade(g, { gearStyle: 'Sport' }).band?.name;
		// theCrag's table: 3c+ ends Beginner, 6a ends Intermediate, 7a+ ends Experienced.
		expect(band('3c+')).toBe('Beginner');
		expect(band('4a')).toBe('Intermediate');
		expect(band('6a')).toBe('Intermediate');
		expect(band('6a+')).toBe('Experienced');
		expect(band('7a+')).toBe('Experienced');
		expect(band('7b')).toBe('Expert');
		expect(band('8b+')).toBe('Expert');
		expect(band('8c')).toBe('Elite');
		expect(band('5.10a')).toBe('Intermediate');
		expect(band('5.10b')).toBe('Experienced');
		expect(band('5.12a')).toBe('Experienced');
		expect(band('5.12b')).toBe('Expert');
		expect(band('5.14b')).toBe('Elite');
	});
});

describe('bandFromTheCragScore', () => {
	it('gives each band 100 points', () => {
		expect(
			[1, 100, 101, 200, 201, 300, 301, 400, 401, 509].map((s) => bandFromTheCragScore(s)?.id)
		).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
	});
});

describe('boulderPyramidScoreKey', () => {
	it('keeps VB+ out of the V0 bucket', () => {
		expect(boulderPyramidScoreKey(-0.5)).toBe(-0.5);
		expect(boulderPyramidScoreKey(-0.3)).toBe(0);
		expect(boulderPyramidScoreKey(0)).toBe(0);
		expect(boulderPyramidScoreKey(0.3)).toBe(0);
		expect(boulderPyramidScoreKey(1)).toBe(1);
	});
});

describe('getBandName', () => {
	it('returns localized band names for all supported locales', () => {
		const b1 = GRADE_BANDS[0];
		expect(getBandName(b1, 'en')).toBe('Beginner');
		expect(getBandName(b1, 'de')).toBe('Anfänger');
		expect(getBandName(b1, 'fr')).toBe('Débutant');
		expect(getBandName(b1, 'es')).toBe('Principiante');
		expect(getBandName(b1, 'it')).toBe('Principiante');

		const b5 = GRADE_BANDS[4];
		expect(getBandName(b5, 'en')).toBe('Elite');
		expect(getBandName(b5, 'de')).toBe('Elite');
		expect(getBandName(b5, 'fr')).toBe('Élite');
		expect(getBandName(b5, 'es')).toBe('Élite');
		expect(getBandName(b5, 'it')).toBe('Élite');
	});

	it('accepts band id numbers', () => {
		expect(getBandName(1, 'de')).toBe('Anfänger');
		expect(getBandName(2, 'fr')).toBe('Intermédiaire');
		expect(getBandName(3, 'es')).toBe('Experimentado');
		expect(getBandName(4, 'it')).toBe('Avanzato');
	});
});
