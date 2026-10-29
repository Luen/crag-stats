import { detectAndParseGrade } from '#lib/grades';
import type { VenueScope } from './venue';

export type GoalKind = 'grade' | 'height_year' | 'days_month' | 'custom';

/** Soft pyramid needs for one send at target N (coaching rule of thumb). */
export const GRADE_GOAL_N1_NEED = 2;
export const GRADE_GOAL_N2_NEED = 4;

/** Max readiness without a send at N (attempts overlay reserved for a follow-up). */
const GRADE_READY_CAP_WITHOUT_SEND = 90;
/** Base when best send is already at N−1 (lands mid-band with a single supporting route). */
const GRADE_READY_BASE_AT_N1 = 35;
/** Small base when best is only at N−2. */
const GRADE_READY_BASE_AT_N2 = 10;
/** Extra from filling the N−1 soft need (2 distinct routes). */
const GRADE_READY_N1_FILL = 20;
/** Extra from filling the N−2 soft need (4 distinct routes). */
const GRADE_READY_N2_FILL = 25;

export type GradeGoalHorizon = 'short-term' | 'medium' | 'long-haul';

export type GradeGoalReadinessInput = {
	target: number;
	bestSend: number | null;
	/** Distinct routes with a send in the N−1 score bucket. */
	routesAtNMinus1: number;
	/** Distinct routes with a send in the N−2 score bucket. */
	routesAtNMinus2: number;
};

export type GradeGoalReadiness = {
	pct: number;
	label: string;
	horizon: GradeGoalHorizon | null;
	n1Bucket: number;
	n2Bucket: number;
	n1Need: number;
	n2Need: number;
	n1Count: number;
	n2Count: number;
};

export function kindLabel(kind: string): string {
	switch (kind) {
		case 'height_year':
			return 'Height / year';
		case 'days_month':
			return 'Days this month';
		case 'grade':
			return 'Grade this year';
		default:
			return 'Custom';
	}
}

export function defaultVenueForKind(kind: GoalKind | string): VenueScope {
	return kind === 'grade' ? 'outdoor' : 'any';
}

/** Parse a grade field: numeric score or display grade (e.g. 25, 7a, V5). */
export function parseGoalGradeScore(
	raw: string | number | null | undefined,
	preferBoulder = false
): number | null {
	if (raw == null || raw === '') return null;
	if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
	const s = String(raw).trim();
	if (!s) return null;
	if (/^-?\d+(\.\d+)?$/.test(s)) {
		const n = Number(s);
		return Number.isFinite(n) ? n : null;
	}
	const parsed = detectAndParseGrade(s, preferBoulder ? { gearStyle: 'boulder' } : undefined);
	return parsed.score;
}

export function progressPct(current: number, target: number): number {
	if (!Number.isFinite(target) || target <= 0) return 0;
	if (!Number.isFinite(current) || current <= 0) return 0;
	return Math.min(100, Math.round((current / target) * 1000) / 10);
}

function formatGoalScore(score: number): string {
	return Number.isInteger(score) ? String(score) : String(Math.round(score * 10) / 10);
}

function horizonFromGap(target: number, bestSend: number | null): GradeGoalHorizon {
	if (bestSend == null || !Number.isFinite(bestSend)) return 'long-haul';
	const gap = target - bestSend;
	if (gap <= 1) return 'short-term';
	if (gap <= 2) return 'medium';
	return 'long-haul';
}

function horizonLabel(horizon: GradeGoalHorizon): string {
	switch (horizon) {
		case 'short-term':
			return 'Short-term';
		case 'medium':
			return 'Medium';
		case 'long-haul':
			return 'Long-haul';
	}
}

/**
 * Approximate grade-goal readiness from pyramid soft needs — not linear best/target.
 * Soft need: ~2 distinct-route sends at N−1 and ~4 at N−2. Buckets are capped so
 * mileage below the goal cannot reach 100% without a send at N.
 */
export function gradeGoalReadiness(input: GradeGoalReadinessInput): GradeGoalReadiness {
	const target = input.target;
	const n1Bucket = target - 1;
	const n2Bucket = target - 2;
	const n1Count = Math.max(0, Math.floor(input.routesAtNMinus1));
	const n2Count = Math.max(0, Math.floor(input.routesAtNMinus2));
	const best = input.bestSend != null && Number.isFinite(input.bestSend) ? input.bestSend : null;

	const empty = (
		pct: number,
		label: string,
		horizon: GradeGoalHorizon | null
	): GradeGoalReadiness => ({
		pct,
		label,
		horizon,
		n1Bucket,
		n2Bucket,
		n1Need: GRADE_GOAL_N1_NEED,
		n2Need: GRADE_GOAL_N2_NEED,
		n1Count,
		n2Count
	});

	if (!Number.isFinite(target) || target <= 0) {
		return empty(0, 'No grade target', null);
	}

	const horizon = horizonFromGap(target, best);
	const pyramidBits = [
		`${n1Count}/${GRADE_GOAL_N1_NEED} at ${n1Bucket}`,
		`${n2Count}/${GRADE_GOAL_N2_NEED} at ${n2Bucket}`,
		horizonLabel(horizon)
	];

	if (best != null && best >= target) {
		return empty(100, `Best send ${formatGoalScore(best)} · done`, 'short-term');
	}

	let pct = 0;
	if (best != null && best >= n1Bucket) {
		pct += GRADE_READY_BASE_AT_N1;
	} else if (best != null && best >= n2Bucket) {
		pct += GRADE_READY_BASE_AT_N2;
	}

	pct += GRADE_READY_N1_FILL * Math.min(n1Count / GRADE_GOAL_N1_NEED, 1);
	pct += GRADE_READY_N2_FILL * Math.min(n2Count / GRADE_GOAL_N2_NEED, 1);
	pct = Math.min(GRADE_READY_CAP_WITHOUT_SEND, Math.round(pct * 10) / 10);

	const bestBit = best != null ? `Best send ${formatGoalScore(best)}` : 'No qualifying send yet';
	return empty(pct, `${bestBit} · ${pyramidBits.join(' · ')}`, horizon);
}
