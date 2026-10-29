import { desc, eq } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { ascents, goals, routes, type Goal } from './db/schema';
import {
	defaultVenueForKind,
	gradeGoalReadiness,
	kindLabel,
	parseGoalGradeScore,
	progressPct,
	type GoalKind
} from './goalsShared';
import { matchesVenueScope, normalizeVenueScope, type VenueScope } from './venue';

export type { GoalKind } from './goalsShared';
export {
	defaultVenueForKind,
	gradeGoalReadiness,
	kindLabel,
	parseGoalGradeScore,
	progressPct
} from './goalsShared';

export type GoalView = Goal & {
	venueScope: VenueScope;
	progressPct: number;
	progressLabel: string;
	targetLabel: string;
	kindLabel: string;
};

function nowIso() {
	return new Date().toISOString();
}

function validDay(iso: string | null | undefined): string | null {
	const d = (iso || '').slice(0, 10);
	const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return null;
	const year = Number(m[1]);
	const month = Number(m[2]);
	const day = Number(m[3]);
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;
	const dt = new Date(`${d}T12:00:00`);
	if (Number.isNaN(dt.getTime())) return null;
	if (dt.getFullYear() !== year || dt.getMonth() + 1 !== month || dt.getDate() !== day) return null;
	return d;
}

function asVenue(g: Goal): VenueScope {
	return normalizeVenueScope(g.venueScope);
}

type AscentRouteRow = {
	routeId: number | null;
	ascentDate: string | null;
	heightM: number | null;
	isSend: boolean;
	effectiveGradeScore: number | null;
	gearStyle: string | null;
	routeName: string | null;
	cragName: string | null;
	tagsJson: string | null;
};

function loadAscentRouteRows(): AscentRouteRow[] {
	return db
		.select({
			routeId: ascents.routeId,
			ascentDate: ascents.ascentDate,
			heightM: ascents.heightM,
			isSend: ascents.isSend,
			effectiveGradeScore: ascents.effectiveGradeScore,
			gearStyle: routes.gearStyle,
			routeName: routes.name,
			cragName: routes.cragName,
			tagsJson: routes.tagsJson
		})
		.from(ascents)
		.innerJoin(routes, eq(ascents.routeId, routes.id))
		.all();
}

/** Qualifying year+venue evidence for a grade goal: sends for pyramid, non-sends near N. */
function gradeGoalSendEvidence(
	g: Goal,
	ascentRows: AscentRouteRow[],
	currentYear: number
): {
	best: number | null;
	routesAtNMinus1: number;
	routesAtNMinus2: number;
	attemptsNearTarget: number;
} {
	const y = g.year ?? currentYear;
	const venue = asVenue(g);
	const target = g.targetGradeScore ?? Number(g.targetValue);
	const n1Bucket = target - 1;
	const n2Bucket = target - 2;
	const n1Routes = new Set<number>();
	const n2Routes = new Set<number>();
	let best: number | null = null;
	let attemptsNearTarget = 0;

	for (const a of ascentRows) {
		if (
			!matchesVenueScope(venue, {
				gearStyle: a.gearStyle,
				name: a.routeName,
				cragName: a.cragName,
				tagsJson: a.tagsJson
			})
		) {
			continue;
		}
		const day = validDay(a.ascentDate);
		if (!day || Number(day.slice(0, 4)) !== y) continue;
		const score = a.effectiveGradeScore;
		if (score == null || !Number.isFinite(score)) continue;

		if (!a.isSend) {
			// Working / attempt ticks at or above N−1 (projecting the goal band).
			if (score >= n1Bucket) attemptsNearTarget += 1;
			continue;
		}

		best = best == null ? score : Math.max(best, score);
		if (a.routeId == null) continue;
		if (score >= n1Bucket && score < target) n1Routes.add(a.routeId);
		else if (score >= n2Bucket && score < n1Bucket) n2Routes.add(a.routeId);
	}

	return {
		best,
		routesAtNMinus1: n1Routes.size,
		routesAtNMinus2: n2Routes.size,
		attemptsNearTarget
	};
}

function enrichGoal(g: Goal, ascentRows: AscentRouteRow[] = []): GoalView {
	const venue = asVenue(g);
	const targetNum = Number(g.targetValue);
	const currentNum = Number(g.progressValue);
	let pct: number;
	let progressLabel: string;
	let targetLabel: string;

	if (g.kind === 'grade') {
		const target = g.targetGradeScore ?? targetNum;
		const evidence = gradeGoalSendEvidence(g, ascentRows, new Date().getFullYear());
		const readiness = gradeGoalReadiness({
			target,
			bestSend: evidence.best,
			routesAtNMinus1: evidence.routesAtNMinus1,
			routesAtNMinus2: evidence.routesAtNMinus2,
			attemptsNearTarget: evidence.attemptsNearTarget
		});
		pct = g.completed ? 100 : readiness.pct;
		progressLabel = g.completed
			? evidence.best != null
				? `Best send ${evidence.best} · done`
				: 'Done'
			: readiness.label;
		targetLabel = Number.isFinite(target) ? `Send ≥ ${target}` : 'Grade goal';
		if (g.year) targetLabel += ` · ${g.year}`;
	} else if (g.kind === 'height_year') {
		const metres = Number.isFinite(currentNum) ? currentNum : 0;
		const target = Number.isFinite(targetNum) ? targetNum : 0;
		pct = g.completed ? 100 : progressPct(metres, target);
		progressLabel = `${Math.round(metres)} m`;
		targetLabel = `${Math.round(target)} m${g.year ? ` · ${g.year}` : ''}`;
	} else if (g.kind === 'days_month') {
		const days = Number.isFinite(currentNum) ? currentNum : 0;
		const target = Number.isFinite(targetNum) ? targetNum : 0;
		pct = g.completed ? 100 : progressPct(days, target);
		progressLabel = `${days} day${days === 1 ? '' : 's'}`;
		targetLabel = `${target} days this month`;
	} else {
		pct = g.completed ? 100 : 0;
		progressLabel = g.completed ? 'Done' : g.progressValue || 'Manual';
		targetLabel = g.targetValue || 'Custom';
	}

	if (venue !== 'any') {
		targetLabel += venue === 'outdoor' ? ' · outdoor' : ' · indoor';
	}

	return {
		...g,
		venueScope: venue,
		progressPct: pct,
		progressLabel,
		targetLabel,
		kindLabel: kindLabel(g.kind)
	};
}

export function listGoals(): GoalView[] {
	ensureSchema();
	updateGoalProgress();
	const ascentRows = loadAscentRouteRows();
	return db
		.select()
		.from(goals)
		.orderBy(desc(goals.createdAt))
		.all()
		.map((g) => enrichGoal(g, ascentRows));
}

export function listActiveGoals(limit = 3): GoalView[] {
	return listGoals()
		.filter((g) => !g.completed)
		.slice(0, limit);
}

export function createGoal(input: {
	kind: GoalKind | string;
	title: string;
	targetValue?: string | null;
	targetGradeScore?: number | null;
	year?: number | null;
	venueScope?: string | null;
}): GoalView {
	ensureSchema();
	const updatedAt = nowIso();
	const kind = String(input.kind || 'custom').trim() || 'custom';
	const title = String(input.title || '').trim() || 'Untitled goal';
	const year =
		input.year != null && Number.isFinite(input.year)
			? Math.trunc(input.year)
			: kind === 'height_year' || kind === 'grade'
				? new Date().getFullYear()
				: null;

	let venueScope = normalizeVenueScope(input.venueScope);
	if (!input.venueScope) venueScope = defaultVenueForKind(kind);

	let targetGradeScore =
		input.targetGradeScore != null && Number.isFinite(input.targetGradeScore)
			? input.targetGradeScore
			: null;
	if (kind === 'grade' && targetGradeScore == null && input.targetValue) {
		targetGradeScore = parseGoalGradeScore(input.targetValue);
	}

	const inserted = db
		.insert(goals)
		.values({
			kind,
			title,
			targetValue: input.targetValue?.trim() || null,
			targetGradeScore,
			year,
			venueScope,
			progressValue: null,
			completed: false,
			achievedAt: null,
			createdAt: updatedAt,
			updatedAt
		})
		.returning()
		.get();

	updateGoalProgress();
	const ascentRows = loadAscentRouteRows();
	return enrichGoal(db.select().from(goals).where(eq(goals.id, inserted.id)).get()!, ascentRows);
}

export function deleteGoal(id: number) {
	ensureSchema();
	db.delete(goals).where(eq(goals.id, id)).run();
}

export function setGoalCompleted(id: number, completed: boolean) {
	ensureSchema();
	db.update(goals)
		.set({
			completed,
			achievedAt: completed ? nowIso() : null,
			updatedAt: nowIso()
		})
		.where(eq(goals.id, id))
		.run();
}

/**
 * Recompute auto progress for height_year / days_month / grade from ascents.
 * Grade = send ≥ target score within goal year + venue scope (default outdoor).
 * Custom goals keep manual completed flag.
 */
export function updateGoalProgress(): void {
	ensureSchema();
	const rows = db.select().from(goals).all();
	if (rows.length === 0) return;

	const ascentRows = loadAscentRouteRows();

	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	const updatedAt = nowIso();

	for (const g of rows) {
		if (g.kind === 'custom') continue;

		const venue = asVenue(g);
		const qualifying = ascentRows.filter((a) =>
			matchesVenueScope(venue, {
				gearStyle: a.gearStyle,
				name: a.routeName,
				cragName: a.cragName,
				tagsJson: a.tagsJson
			})
		);

		let progressValue: string | null = g.progressValue;
		let completed = g.completed;
		let achievedAt = g.achievedAt;

		if (g.kind === 'height_year') {
			const y = g.year ?? currentYear;
			let metres = 0;
			for (const a of qualifying) {
				const day = validDay(a.ascentDate);
				if (!day || Number(day.slice(0, 4)) !== y) continue;
				if (a.heightM != null && Number.isFinite(a.heightM)) metres += a.heightM;
			}
			metres = Math.round(metres);
			progressValue = String(metres);
			const target = Number(g.targetValue);
			completed = Number.isFinite(target) && target > 0 && metres >= target;
		} else if (g.kind === 'days_month') {
			const days = new Set<string>();
			for (const a of qualifying) {
				const day = validDay(a.ascentDate);
				if (!day || !day.startsWith(currentMonth)) continue;
				days.add(day);
			}
			progressValue = String(days.size);
			const target = Number(g.targetValue);
			completed = Number.isFinite(target) && target > 0 && days.size >= target;
		} else if (g.kind === 'grade') {
			const y = g.year ?? currentYear;
			const target = g.targetGradeScore;
			let best: number | null = null;
			for (const a of qualifying) {
				if (!a.isSend) continue;
				const day = validDay(a.ascentDate);
				if (!day || Number(day.slice(0, 4)) !== y) continue;
				const score = a.effectiveGradeScore;
				if (score == null || !Number.isFinite(score)) continue;
				best = best == null ? score : Math.max(best, score);
			}
			progressValue = best != null ? String(Math.round(best * 10) / 10) : '0';
			completed = target != null && Number.isFinite(target) && best != null && best >= target;
		}

		if (completed && !g.completed) {
			achievedAt = updatedAt;
		} else if (!completed && g.completed && g.kind !== 'custom') {
			// Auto goals can reopen (e.g. new month) — clear shelf stamp.
			achievedAt = null;
		}

		if (
			progressValue === g.progressValue &&
			completed === g.completed &&
			achievedAt === g.achievedAt
		) {
			continue;
		}

		db.update(goals)
			.set({ progressValue, completed, achievedAt, updatedAt })
			.where(eq(goals.id, g.id))
			.run();
	}
}
