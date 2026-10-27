/**
 * Intensity-weighted training load (see docs/guide/training-load.md).
 *
 * Each ascent scores `10 × intensity × style factor`, where intensity compares the grade with
 * your hardest send of the trailing year (same discipline): an ascent at your max is 1.0, and
 * every 2 Ewbank grades (1 V-grade for boulders) below it halves the value. Daily loads feed
 * 7-day (acute) and 28-day (chronic) exponentially weighted averages; their ratio (ACWR)
 * flags ramps that tend to precede finger and shoulder injuries.
 */
import type { LoadStatus, TrainingLoadView } from '#lib/types/trainingLoad';
import { buildTrainingLoad, type DashboardExtraRow } from './dashboardExtras';

const DAY_MS = 86_400_000;
const WARMUP_DAYS = 120;

/** Grade steps per halving of intensity. */
const STEP = { route: 2, boulder: 1 } as const;

type Kind = keyof typeof STEP;

function kindOf(row: DashboardExtraRow): Kind {
	return /boulder/i.test(row.gearStyle ?? '') ? 'boulder' : 'route';
}

function scoreOf(row: DashboardExtraRow): number | null {
	const s = row.effectiveGradeScore ?? row.gradeScore;
	return s != null && Number.isFinite(s) ? s : null;
}

/**
 * Working an ungraded route (no route grade, no grade of your own on the tick) usually
 * means a new line or project at your limit, so it loads like an ascent at your max.
 */
export function isUngradedWork(row: DashboardExtraRow): boolean {
	return !row.isSend && scoreOf(row) == null;
}

function dayOf(iso: string | null | undefined): string | null {
	const d = (iso ?? '').slice(0, 10);
	return /^\d{4}-\d{2}-\d{2}$/.test(d) && !d.includes('-00') ? d : null;
}

function addDays(day: string, n: number): string {
	return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

/** Intensity of one ascent relative to the reference max (1.0 = at your max). */
export function ascentIntensity(score: number | null, ref: number | null, kind: Kind): number {
	if (score == null || ref == null) return 0.3; // ungraded / no baseline: light, not zero
	const v = 2 ** ((score - ref) / STEP[kind]);
	return Math.min(1.5, Math.max(0.05, v));
}

/** Attempts and top-roping still load you, a bit less than a lead send. */
export function styleFactor(row: DashboardExtraRow): number {
	let f = row.isSend ? 1 : 0.8;
	if (/top/i.test(row.gearStyle ?? '') || /second|top/i.test(row.tickType ?? '')) f *= 0.8;
	return f;
}

export function loadStatus(ratio: number | null, acute: number): LoadStatus {
	if (ratio == null) return acute > 0 ? 'building' : 'idle';
	if (acute < 0.05) return 'idle';
	if (ratio < 0.8) return 'detraining';
	if (ratio <= 1.3) return 'optimal';
	if (ratio <= 1.5) return 'building';
	return 'spike';
}

export function buildTrainingLoadView(
	rows: DashboardExtraRow[],
	todayIso?: string
): TrainingLoadView {
	const today = (todayIso || new Date().toISOString()).slice(0, 10);
	const windows = buildTrainingLoad(rows, today);
	const yearAgo = addDays(today, -365);
	const start28 = addDays(today, -27);

	// Reference: hardest send per discipline in the trailing 365 days.
	const ref: Record<Kind, number | null> = { route: null, boulder: null };
	for (const row of rows) {
		const day = dayOf(row.ascentDate);
		const score = scoreOf(row);
		if (!day || day > today || day < yearAgo || !row.isSend || score == null) continue;
		const k = kindOf(row);
		if (ref[k] == null || score > ref[k]!) ref[k] = score;
	}

	// Daily load over the warm-up window, plus near-limit counts for the last 28 days.
	const daily = new Map<string, number>();
	const start = addDays(today, -WARMUP_DAYS);
	let graded28 = 0;
	let limit28 = 0;
	let limitSends28 = 0;
	for (const row of rows) {
		const day = dayOf(row.ascentDate);
		if (!day || day > today || day < start) continue;
		const k = kindOf(row);
		// Ungraded attempts count as at your max (isUngradedWork); ungraded sends stay light.
		const score = scoreOf(row) ?? (isUngradedWork(row) ? ref[k] : null);
		const load = 10 * ascentIntensity(score, ref[k], k) * styleFactor(row);
		daily.set(day, (daily.get(day) ?? 0) + load);
		if (day >= start28 && score != null && ref[k] != null) {
			graded28 += 1;
			const near = score >= ref[k]! - STEP[k];
			if (near) limit28 += 1;
			if (near && row.isSend) limitSends28 += 1;
		}
	}

	// Exponentially weighted averages (span 7 / 28 days).
	const aA = 2 / (7 + 1);
	const aC = 2 / (28 + 1);
	let acute = 0;
	let chronic = 0;
	const weekly: { end: string; load: number }[] = [];
	let week = 0;
	for (let i = WARMUP_DAYS; i >= 0; i--) {
		const day = addDays(today, -i);
		const l = daily.get(day) ?? 0;
		acute = aA * l + (1 - aA) * acute;
		chronic = aC * l + (1 - aC) * chronic;
		week += l;
		// Close a week every 7 days counting back from today.
		if (i % 7 === 0) {
			if (i < 84) weekly.push({ end: day, load: Math.round(week) });
			week = 0;
		}
	}

	const ratio = chronic >= 0.25 ? Math.round((acute / chronic) * 100) / 100 : null;
	return {
		...windows,
		acute: Math.round(acute * 10) / 10,
		chronic: Math.round(chronic * 10) / 10,
		ratio,
		status: loadStatus(ratio, acute),
		refRoute: ref.route,
		refBoulder: ref.boulder,
		limitSends28,
		limitShare28: graded28 ? Math.round((limit28 / graded28) * 100) : 0,
		weekly
	};
}
