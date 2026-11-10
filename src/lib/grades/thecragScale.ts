/**
 * theCrag's universal grade score (#445).
 *
 * theCrag scores every grade, in every system, on one difficulty scale: the `score` from
 * `POST /api/grade` and the `gradeScore` on each logbook API ascent. Each difficulty band
 * (Beginner … Elite) spans 100 points, shared evenly by that system's grades in the band.
 * The tables in `thecragGradeScores.ts` were captured from the API; conversions here
 * interpolate between them, so every grade sits strictly between its neighbours and
 * French, YDS and Font labels agree with theCrag's own conversions.
 */

import { THECRAG_GRADE_SCORES, type ScoredLadder } from './thecragGradeScores';

type Knot = readonly [score: number, value: number];

/** App V-score for a theCrag V grade label (VB± and V0± keep their existing nuance). */
function vScaleValue(label: string): number | null {
	const named: Record<string, number> = {
		'VB-': -1.5,
		VB: -1,
		'VB+': -0.5,
		'V0-': -0.3,
		V0: 0,
		'V0+': 0.3
	};
	if (label in named) return named[label];
	const m = label.match(/^V(\d+)$/);
	return m ? Number(m[1]) : null;
}

function knots(ladder: ScoredLadder, value: (label: string) => number | null): Knot[] {
	const out: Knot[] = [];
	for (const [label, score] of ladder) {
		const v = value(label);
		if (v != null) out.push([score, v]);
	}
	return out.sort((a, b) => a[0] - b[0]);
}

const AU_KNOTS = knots(THECRAG_GRADE_SCORES.AU, (g) => (/^\d+$/.test(g) ? Number(g) : null));
const V_KNOTS = knots(THECRAG_GRADE_SCORES.V, vScaleValue);

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Piecewise-linear map through sorted knots, extending the end segments. */
function interpolate(points: readonly Knot[], x: number): number {
	let i = 1;
	while (i < points.length - 1 && x > points[i][0]) i++;
	const [x0, y0] = points[i - 1];
	const [x1, y1] = points[i];
	return round2(y0 + ((x - x0) * (y1 - y0)) / (x1 - x0));
}

const invert = (points: readonly Knot[]): Knot[] => points.map(([a, b]) => [b, a] as Knot);
const AU_INVERSE = invert(AU_KNOTS);
const V_INVERSE = invert(V_KNOTS);

/** theCrag score → Ewbank-equivalent route score (exact at Ewbank grades). */
export function theCragScoreToEwbank(score: number): number {
	return interpolate(AU_KNOTS, score);
}

/** Ewbank-equivalent route score → theCrag score. */
export function ewbankToTheCragScore(ew: number): number {
	return interpolate(AU_INVERSE, ew);
}

/** theCrag score → app V-scale score (exact at V grades). */
export function theCragScoreToVScale(score: number): number {
	return interpolate(V_KNOTS, score);
}

/** App V-scale score → theCrag score. */
export function vScaleToTheCragScore(v: number): number {
	return interpolate(V_INVERSE, v);
}

export type ScoredSystem = 'FR' | 'YDS' | 'FB';

const normalise: Record<ScoredSystem, (s: string) => string> = {
	FR: (s) => s.toLowerCase(),
	YDS: (s) => s.toLowerCase(),
	FB: (s) => s.toUpperCase()
};

const LOOKUP: Record<ScoredSystem, Map<string, number>> = {
	FR: new Map(THECRAG_GRADE_SCORES.FR.map(([g, s]) => [normalise.FR(g), s])),
	YDS: new Map(THECRAG_GRADE_SCORES.YDS.map(([g, s]) => [normalise.YDS(g), s])),
	FB: new Map(THECRAG_GRADE_SCORES.FB.map(([g, s]) => [normalise.FB(g), s]))
};

/** theCrag score for a grade label in a scored system, or null when it isn't a grade there. */
export function theCragGradeScore(system: ScoredSystem, label: string): number | null {
	return LOOKUP[system].get(normalise[system](label.replace(/\s+/g, ''))) ?? null;
}

/**
 * Grade label in `system` whose theCrag score is nearest. Null when the score is beyond
 * the system's easiest or hardest grade by more than half a grade step.
 */
export function nearestTheCragGrade(system: ScoredSystem, score: number): string | null {
	const ladder = THECRAG_GRADE_SCORES[system];
	if (!ladder.length || !Number.isFinite(score)) return null;
	const first = ladder[0][1];
	const last = ladder[ladder.length - 1][1];
	const lowGap = ladder.length > 1 ? (ladder[1][1] - first) / 2 : 0;
	const highGap = ladder.length > 1 ? (last - ladder[ladder.length - 2][1]) / 2 : 0;
	if (score < first - lowGap || score > last + highGap) return null;
	let best = ladder[0];
	for (const entry of ladder) {
		if (Math.abs(entry[1] - score) < Math.abs(best[1] - score)) best = entry;
	}
	return best[0];
}
