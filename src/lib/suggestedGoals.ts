/**
 * Soft coaching suggestions: next outdoor grade from the hardest send in the
 * last two years (#252). Pure helpers — no DB.
 */
import {
	convertFromEwbank,
	convertFromVScale,
	formatVScaleLabel,
	usesVScale,
	type GradeSystem
} from '#lib/grades';

/** Same indoor heuristics as `#lib/server/venue` (kept local so this module stays non-server). */
function isOutdoorRow(row: {
	gearStyle: string | null;
	routeName: string | null;
	cragName: string | null;
	tagsJson: string | null;
}): boolean {
	const style = (row.gearStyle ?? '').toLowerCase();
	if (/\b(gym|indoor)\b/.test(style)) return false;
	const blob = [row.routeName, row.cragName, row.tagsJson].filter(Boolean).join(' ').toLowerCase();
	return !/\b(climbing\s+gym|bouldering\s+gym|indoor\s+gym|\bgym\b|indoor)\b/.test(blob);
}

export type SuggestedGradeFamily = 'route' | 'boulder';

export type SuggestedGradeGoal = {
	family: SuggestedGradeFamily;
	maxScore: number;
	maxLabel: string;
	targetScore: number;
	targetLabel: string;
	year: number;
	venueScope: 'outdoor';
	title: string;
	blurb: string;
	alreadyTracking: boolean;
};

export type SuggestedGoalActive = {
	kind: string;
	completed: boolean;
	targetGradeScore: number | null;
	year: number | null;
	venueScope: string | null;
	title?: string | null;
	targetValue?: string | null;
};

export type SuggestedGoalAscent = {
	ascentDate: string | null;
	isSend: boolean;
	effectiveGradeScore: number | null;
	gradeSystem: string | null;
	gearStyle: string | null;
	routeName: string | null;
	cragName: string | null;
	tagsJson: string | null;
};

function validDay(iso: string | null | undefined): string | null {
	const d = (iso || '').slice(0, 10);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
	const dt = new Date(`${d}T12:00:00`);
	if (Number.isNaN(dt.getTime())) return null;
	return d;
}

function formatScore(score: number, boulder: boolean, system: GradeSystem): string {
	if (boulder) {
		if (system === 'font') return convertFromVScale(score, 'font');
		return formatVScaleLabel(score);
	}
	const routeSystem: GradeSystem = system === 'v_scale' || system === 'font' ? 'ewbank' : system;
	return convertFromEwbank(score, routeSystem);
}

function windowStartIso(now: Date): string {
	const start = new Date(now);
	start.setFullYear(start.getFullYear() - 2);
	return start.toISOString().slice(0, 10);
}

/** Next integer grade step above a personal max (V5 → V6, 25 → 26). */
export function nextGradeStep(maxScore: number): number {
	return Math.floor(maxScore) + 1;
}

function trackingSame(
	active: SuggestedGoalActive[],
	targetScore: number,
	year: number,
	boulder: boolean
): boolean {
	return active.some((g) => {
		if (g.completed || g.kind !== 'grade') return false;
		if (g.year != null && g.year !== year) return false;
		if ((g.venueScope || 'outdoor') !== 'outdoor') return false;
		if (g.targetGradeScore == null) return false;
		if (Math.abs(g.targetGradeScore - targetScore) > 0.01) return false;
		const blob = `${g.title ?? ''} ${g.targetValue ?? ''}`.toLowerCase();
		const looksBoulder = /\bv\d|font|boulder/.test(blob);
		if (boulder) return looksBoulder || !/\b(sport|trad|route)\b/.test(blob);
		return !looksBoulder;
	});
}

/**
 * Pure: build up to one route and one boulder outdoor suggestion from ascent rows.
 */
export function buildSuggestedOutdoorGradeGoals(
	rows: SuggestedGoalAscent[],
	opts: {
		now?: Date;
		preferredSystem: GradeSystem;
		activeGoals?: SuggestedGoalActive[];
	}
): SuggestedGradeGoal[] {
	const now = opts.now ?? new Date();
	const year = now.getFullYear();
	const from = windowStartIso(now);
	const active = (opts.activeGoals ?? []).filter((g) => !g.completed);

	let maxRoute: number | null = null;
	let maxBoulder: number | null = null;

	for (const row of rows) {
		if (!row.isSend) continue;
		const day = validDay(row.ascentDate);
		if (!day || day < from) continue;
		if (!isOutdoorRow(row)) continue;
		const score = row.effectiveGradeScore;
		if (score == null || !Number.isFinite(score)) continue;
		const boulder = usesVScale(row.gradeSystem, row.gearStyle);
		if (boulder) {
			if (maxBoulder == null || score > maxBoulder) maxBoulder = score;
		} else if (maxRoute == null || score > maxRoute) {
			maxRoute = score;
		}
	}

	const out: SuggestedGradeGoal[] = [];
	const push = (family: SuggestedGradeFamily, maxScore: number) => {
		const boulder = family === 'boulder';
		const targetScore = nextGradeStep(maxScore);
		const maxLabel = formatScore(maxScore, boulder, opts.preferredSystem);
		const targetLabel = formatScore(targetScore, boulder, opts.preferredSystem);
		const alreadyTracking = trackingSame(active, targetScore, year, boulder);
		out.push({
			family,
			maxScore,
			maxLabel,
			targetScore,
			targetLabel,
			year,
			venueScope: 'outdoor',
			title: `Send outdoor ${targetLabel} in ${year}`,
			blurb: `Based on your hardest outdoor ${boulder ? 'boulder' : 'route'} send in the last two years (${maxLabel}) — aim for ${targetLabel} this year.`,
			alreadyTracking
		});
	};

	if (maxRoute != null) push('route', maxRoute);
	if (maxBoulder != null) push('boulder', maxBoulder);
	return out;
}
