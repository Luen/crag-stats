/**
 * Grade bands aligned with theCrag's five difficulty bands.
 * Colours match https://www.thecrag.com/en/article/grades
 */
import { formatMessage } from '../i18n/format';
import type { SupportedLocale } from '../i18n/types';
import { ewbankToTheCragScore, vScaleToTheCragScore } from './thecragScale';

export type GradeBandId = 1 | 2 | 3 | 4 | 5;

export type GradeBand = {
	id: GradeBandId;
	name: 'Beginner' | 'Intermediate' | 'Experienced' | 'Expert' | 'Elite';
	/** CSS colour matching theCrag grade tables */
	color: string;
	/** Softer background tint for chips / bars */
	bg: string;
	/** Approximate Ewbanks inclusive range (sport/trad free climbing) */
	ewbankMin: number;
	ewbankMax: number;
};

export const GRADE_BANDS: readonly GradeBand[] = [
	{
		id: 1,
		name: 'Beginner',
		color: 'rgb(84, 180, 26)',
		bg: 'rgba(84, 180, 26, 0.18)',
		ewbankMin: 1,
		ewbankMax: 12
	},
	{
		id: 2,
		name: 'Intermediate',
		color: 'rgb(254, 225, 0)',
		bg: 'rgba(254, 225, 0, 0.28)',
		ewbankMin: 13,
		ewbankMax: 18
	},
	{
		id: 3,
		name: 'Experienced',
		color: 'rgb(229, 131, 41)',
		bg: 'rgba(229, 131, 41, 0.2)',
		ewbankMin: 19,
		ewbankMax: 24
	},
	{
		id: 4,
		name: 'Expert',
		color: 'rgb(201, 9, 9)',
		bg: 'rgba(201, 9, 9, 0.16)',
		ewbankMin: 25,
		ewbankMax: 32
	},
	{
		id: 5,
		name: 'Elite',
		color: 'rgb(178, 24, 130)',
		bg: 'rgba(178, 24, 130, 0.16)',
		ewbankMin: 33,
		ewbankMax: 39
	}
] as const;

export function bandById(id: number | null | undefined): GradeBand | null {
	if (!id || id < 1 || id > 5) return null;
	return GRADE_BANDS[id - 1] ?? null;
}

const BAND_KEYS: Record<GradeBandId, string> = {
	1: 'grades.bands.beginner',
	2: 'grades.bands.intermediate',
	3: 'grades.bands.experienced',
	4: 'grades.bands.expert',
	5: 'grades.bands.elite'
};

/**
 * Return localized name of the grade band (or canonical English when unset).
 * Grade numbers/letters themselves are never translated.
 */
export function getBandName(bandOrId: GradeBand | GradeBandId, locale?: SupportedLocale): string {
	const id = typeof bandOrId === 'number' ? bandOrId : bandOrId.id;
	const key = BAND_KEYS[id as GradeBandId];
	if (!key) return typeof bandOrId === 'object' ? bandOrId.name : `Band ${id}`;
	return formatMessage(locale ?? 'en', key);
}

/**
 * Band for a theCrag universal grade score: each band spans 100 points (Beginner 1–100,
 * Intermediate 101–200, … Elite 401+), so 200 is still Intermediate.
 */
export function bandFromTheCragScore(score: number | null | undefined): GradeBand | null {
	if (score == null || Number.isNaN(score)) return null;
	const id = Math.min(5, Math.max(1, Math.ceil(score / 100)));
	return GRADE_BANDS[id - 1];
}

/**
 * Map an Ewbank-equivalent route score to a theCrag-style band. Scores can sit between
 * whole Ewbank grades (French 6a ≈ 18.3, 7a+ ≈ 24.1), so the band comes from theCrag's
 * score, where 6a is still Intermediate and 7a+ still Experienced.
 */
export function bandFromEwbank(grade: number | null | undefined): GradeBand | null {
	if (grade == null || Number.isNaN(grade)) return null;
	return bandFromTheCragScore(ewbankToTheCragScore(grade));
}

/**
 * V-Scale → band (boulder table on theCrag grades page), through theCrag's score.
 * Beginner: VB± · Intermediate: V0± · Experienced: V1–V4 · Expert: V5–V10 · Elite: V11+.
 * In-between scores follow theCrag too: Font 5A is Experienced, 6B+ Experienced, 7C+ Expert.
 */
export function bandFromVScale(v: number | null | undefined): GradeBand | null {
	if (v == null || Number.isNaN(v)) return null;
	return bandFromTheCragScore(vScaleToTheCragScore(v));
}

/**
 * Pyramid bucket for boulder scores.
 * Keeps VB+ out of the V0 row (Math.round(-0.5) === 0), merges V0-/V0/V0+.
 */
export function boulderPyramidScoreKey(v: number): number {
	if (v <= -1.25) return -1.5;
	if (v <= -0.75) return -1;
	if (v <= -0.4) return -0.5;
	if (v < 0.65) return 0;
	return Math.round(v);
}

/**
 * Whether a route's canonical score is on the V-scale (boulder grades) rather than Ewbank.
 * The stored grade system decides: deep water solos and highballs are often V-graded
 * without being boulders (#72). Gear style is only the fallback when the system is unknown.
 */
export function usesVScale(
	gradeSystem: string | null | undefined,
	gearStyle: string | null | undefined
): boolean {
	const sys = (gradeSystem ?? '').trim().toLowerCase();
	if (sys === 'v_scale' || sys === 'font') return true;
	if (sys && sys !== 'unknown') return false;
	return (gearStyle ?? '').toLowerCase().includes('boulder');
}
