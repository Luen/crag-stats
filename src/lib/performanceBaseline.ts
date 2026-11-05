import { calendarDay } from './calendarDay';
import { usesVScale } from './grades';
import { displayStyle } from './logbookStyle';

export const NEAR_LIMIT_WINDOW_DAYS = 365;
export const NEAR_LIMIT_STEP = { route: 2, boulder: 1 } as const;

export type PerformanceBaselineRow = {
	ascentDate: string | null;
	isSend?: boolean | null;
	gearStyle?: string | null;
	gradeSystem?: string | null;
	effectiveGradeScore?: number | null;
	gradeScore?: number | null;
};

export function performanceGradeKind(row: PerformanceBaselineRow): keyof typeof NEAR_LIMIT_STEP {
	return usesVScale(row.gradeSystem, row.gearStyle) ? 'boulder' : 'route';
}

export function performanceGradeScore(row: PerformanceBaselineRow): number | null {
	const score = row.effectiveGradeScore ?? row.gradeScore;
	return score != null && Number.isFinite(score) ? score : null;
}

function keyOf(row: PerformanceBaselineRow): string {
	return `${performanceGradeKind(row)}|${displayStyle(row.gearStyle)}`;
}

function dayOf(row: PerformanceBaselineRow): number | null {
	const day = calendarDay(row.ascentDate);
	return day ? Date.parse(`${day}T00:00:00Z`) / 86400000 : null;
}

type Point = { day: number; score: number };

function lowerBound(points: readonly Point[], day: number): number {
	let lo = 0;
	let hi = points.length;
	while (lo < hi) {
		const mid = (lo + hi) >>> 1;
		if (points[mid].day < day) lo = mid + 1;
		else hi = mid;
	}
	return lo;
}

/** Build once per view; sorted range-max trees answer arbitrary prior-day queries in O(log n). */
export function buildPerformanceBaseline<T extends PerformanceBaselineRow>(
	rows: readonly T[],
	eligible: (row: T) => boolean
): (row: PerformanceBaselineRow) => number | null {
	const groups = new Map<string, Point[]>();
	for (const row of rows) {
		if (!row.isSend || !eligible(row)) continue;
		const day = dayOf(row);
		const score = performanceGradeScore(row);
		if (day == null || score == null) continue;
		const key = keyOf(row);
		const points = groups.get(key) ?? [];
		points.push({ day, score });
		groups.set(key, points);
	}
	const indices = new Map<string, { points: Point[]; size: number; tree: number[] }>();
	for (const [key, points] of groups) {
		points.sort((a, b) => a.day - b.day);
		let size = 1;
		while (size < points.length) size *= 2;
		const tree = Array<number>(size * 2).fill(-Infinity);
		for (let i = 0; i < points.length; i++) tree[size + i] = points[i].score;
		for (let i = size - 1; i > 0; i--) tree[i] = Math.max(tree[i * 2], tree[i * 2 + 1]);
		indices.set(key, { points, size, tree });
	}
	return (row) => {
		const day = dayOf(row);
		const index = indices.get(keyOf(row));
		if (day == null || !index) return null;
		const { points, size, tree } = index;
		let start = lowerBound(points, day - NEAR_LIMIT_WINDOW_DAYS) + size;
		let end = lowerBound(points, day) + size;
		let max = -Infinity;
		while (start < end) {
			if (start % 2) max = Math.max(max, tree[start++]);
			if (end % 2) max = Math.max(max, tree[--end]);
			start = Math.floor(start / 2);
			end = Math.floor(end / 2);
		}
		return max === -Infinity ? null : max;
	};
}
