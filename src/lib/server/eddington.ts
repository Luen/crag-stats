/**
 * Eddington-style numbers for climbing (cycling's E: the largest E such that you
 * have ridden ≥ E miles on ≥ E days). See docs/guide/eddington.md.
 *
 * - sends:    E days with ≥ E sends
 * - vertical: E days with ≥ 10·E metres climbed
 * - routeGrade / boulderGrade: grade h-index, E distinct routes sent at ≥ grade E
 *   (Ewbank for routes, V-scale for boulders)
 */
import type {
	EddingtonMetric,
	EddingtonMilestoneRow,
	EddingtonMilestoneTable,
	EddingtonStats,
	EddingtonTimelinePoint
} from '#lib/types/dashboard';

export type {
	EddingtonMilestoneRow,
	EddingtonMilestoneTable,
	EddingtonTimelinePoint
} from '#lib/types/dashboard';

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

export type EddingtonValueSets = {
	daySends: number[];
	dayMetres: number[];
	routeScores: number[];
	boulderScores: number[];
	activeDays: number;
};

/** Aggregate row inputs used for Eddington metrics and milestone tables. */
export function collectEddingtonValues(rows: readonly EddingtonRow[]): EddingtonValueSets {
	const days = new Map<string, { sends: number; metres: number }>();
	const bestRoute = new Map<number, { score: number; isBoulder: boolean }>();

	for (const r of rows) {
		if (r.day) {
			const d = days.get(r.day) ?? { sends: 0, metres: 0 };
			if (r.isSend) d.sends += 1;
			if (r.heightM > 0) d.metres += r.heightM;
			days.set(r.day, d);
		}
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
		daySends: dayList.map((d) => d.sends),
		dayMetres: dayList.map((d) => d.metres),
		routeScores: routeScores.map(Math.floor),
		boulderScores: boulderScores.map(Math.floor),
		activeDays: dayList.length
	};
}

export function buildEddington(rows: readonly EddingtonRow[]): EddingtonStats {
	const v = collectEddingtonValues(rows);
	return {
		sends: eddingtonMetric(v.daySends),
		vertical: eddingtonMetric(v.dayMetres, VERTICAL_UNIT_M),
		verticalUnitM: VERTICAL_UNIT_M,
		routeGrade: eddingtonMetric(v.routeScores),
		boulderGrade: eddingtonMetric(v.boulderScores),
		activeDays: v.activeDays
	};
}

function rowsThroughYear(rows: readonly EddingtonRow[], year: number): EddingtonRow[] {
	const cutoff = `${year}-12-31`;
	return rows.filter((r) => r.day != null && r.day <= cutoff);
}

/** Year-end snapshot of each Eddington metric as the logbook grew. */
export function buildEddingtonTimeline(rows: readonly EddingtonRow[]): EddingtonTimelinePoint[] {
	const years = new Set<number>();
	for (const r of rows) {
		if (!r.day) continue;
		years.add(Number(r.day.slice(0, 4)));
	}
	if (years.size === 0) return [];
	return [...years]
		.sort((a, b) => a - b)
		.map((y) => {
			const e = buildEddington(rowsThroughYear(rows, y));
			return {
				period: String(y),
				sendsE: e.sends.value,
				verticalE: e.vertical.value,
				routeE: e.routeGrade.value,
				boulderE: e.boulderGrade.value
			};
		});
}

/** Progress toward Eddington numbers current+1 … current+count. */
export function buildEddingtonMilestones(
	values: readonly number[],
	unit: number,
	currentValue: number,
	count = 5
): EddingtonMilestoneRow[] {
	const out: EddingtonMilestoneRow[] = [];
	for (let i = 1; i <= count; i++) {
		const target = currentValue + i;
		const have = values.filter((v) => v >= target * unit).length;
		const needed = Math.max(0, target - have);
		const progress = target > 0 ? Math.min(1, have / target) : 0;
		out.push({ target, have, needed, progress });
	}
	return out;
}

export function buildEddingtonMilestoneTables(
	rows: readonly EddingtonRow[],
	count = 5
): EddingtonMilestoneTable[] {
	const v = collectEddingtonValues(rows);
	const stats = buildEddington(rows);
	return [
		{
			key: 'sends',
			label: 'Send days',
			unit: 1,
			qualifierLabel: 'days with sends',
			rows: buildEddingtonMilestones(v.daySends, 1, stats.sends.value, count)
		},
		{
			key: 'vertical',
			label: 'Vertical days',
			unit: VERTICAL_UNIT_M,
			qualifierLabel: 'days with vertical',
			rows: buildEddingtonMilestones(v.dayMetres, VERTICAL_UNIT_M, stats.vertical.value, count)
		},
		{
			key: 'routeGrade',
			label: 'Route grade index',
			unit: 1,
			qualifierLabel: 'routes sent',
			rows: buildEddingtonMilestones(v.routeScores, 1, stats.routeGrade.value, count)
		},
		{
			key: 'boulderGrade',
			label: 'Boulder grade index',
			unit: 1,
			qualifierLabel: 'problems sent',
			rows: buildEddingtonMilestones(v.boulderScores, 1, stats.boulderGrade.value, count)
		}
	];
}
