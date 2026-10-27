/**
 * Eddington-style numbers for climbing (cycling's E: the largest E such that you
 * have ridden ≥ E miles on ≥ E days). See docs/guide/eddington.md.
 *
 * - sends:    E days with ≥ E sends
 * - vertical: E days with ≥ 10·E metres climbed
 * - routeGrade / boulderGrade: grade h-index, E distinct routes sent at ≥ grade E
 *   (Ewbank for routes, V-scale for boulders)
 */
import type { EddingtonMetric, EddingtonStats } from '#lib/types/dashboard';

export const VERTICAL_UNIT_M = 10;

export type EddingtonRow = {
	day: string | null;
	routeId: number;
	isSend: boolean;
	heightM: number;
	/** Canonical score: Ewbank for routes, V-scale for boulders. */
	score: number | null;
	isBoulder: boolean;
};

/** Largest E with at least E values ≥ E·unit. */
export function eddingtonNumber(values: readonly number[], unit = 1): number {
	const sorted = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => b - a);
	let e = 0;
	while (e < sorted.length && sorted[e] >= (e + 1) * unit) e += 1;
	return e;
}

export function eddingtonMetric(values: readonly number[], unit = 1): EddingtonMetric {
	const value = eddingtonNumber(values, unit);
	const next = value + 1;
	const have = values.filter((v) => v >= next * unit).length;
	return { value, next, needed: Math.max(0, next - have) };
}

export function buildEddington(rows: readonly EddingtonRow[]): EddingtonStats {
	const days = new Map<string, { sends: number; metres: number }>();
	const bestRoute = new Map<number, { score: number; isBoulder: boolean }>();

	for (const r of rows) {
		if (r.day) {
			const d = days.get(r.day) ?? { sends: 0, metres: 0 };
			if (r.isSend) d.sends += 1;
			if (r.heightM > 0) d.metres += r.heightM;
			days.set(r.day, d);
		}
		// One entry per route: repeats of the same line don't pad the grade index.
		if (r.isSend && r.score != null && Number.isFinite(r.score)) {
			const prev = bestRoute.get(r.routeId);
			if (!prev || r.score > prev.score) {
				bestRoute.set(r.routeId, { score: r.score, isBoulder: r.isBoulder });
			}
		}
	}

	const routeScores: number[] = [];
	const boulderScores: number[] = [];
	for (const v of bestRoute.values()) (v.isBoulder ? boulderScores : routeScores).push(v.score);

	const dayList = [...days.values()];
	return {
		sends: eddingtonMetric(dayList.map((d) => d.sends)),
		vertical: eddingtonMetric(
			dayList.map((d) => d.metres),
			VERTICAL_UNIT_M
		),
		verticalUnitM: VERTICAL_UNIT_M,
		// V-scale ranges (V1/2) are stored as midpoints; floor so V5/6 counts as V5.
		routeGrade: eddingtonMetric(routeScores.map(Math.floor)),
		boulderGrade: eddingtonMetric(boulderScores.map(Math.floor)),
		activeDays: dayList.length
	};
}
