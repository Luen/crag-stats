/**
 * Grade bands aligned with theCrag's five difficulty bands.
 * Colours match https://www.thecrag.com/en/article/grades
 */
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

/** Map an Ewbanks (AU) grade number to a theCrag-style band. */
export function bandFromEwbank(grade: number | null | undefined): GradeBand | null {
	if (grade == null || Number.isNaN(grade)) return null;
	for (const band of GRADE_BANDS) {
		if (grade >= band.ewbankMin && grade <= band.ewbankMax) return band;
	}
	if (grade < GRADE_BANDS[0].ewbankMin) return GRADE_BANDS[0];
	return GRADE_BANDS[GRADE_BANDS.length - 1];
}

/**
 * V-Scale → band (boulder table on theCrag grades page).
 * Beginner: VB± · Intermediate: V0± · Experienced: V1–V4 · Expert: V5–V10 · Elite: V11+.
 */
export function bandFromVScale(v: number | null | undefined): GradeBand | null {
	if (v == null || Number.isNaN(v)) return null;
	// VB+ is ~-0.5; V0- is ~-0.3 — do not treat all negatives as Beginner.
	if (v <= -0.4) return GRADE_BANDS[0];
	if (v < 1) return GRADE_BANDS[1];
	if (v <= 4) return GRADE_BANDS[2];
	if (v <= 10) return GRADE_BANDS[3];
	return GRADE_BANDS[4];
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
