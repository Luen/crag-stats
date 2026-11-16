import { calendarDay as validDay } from '#lib/calendarDay';
import { formatGradeLabel, usesVScale } from '#lib/grades';
import { parseGoalGradeScale, parseScaledGoalGrade, type GoalGradeScale } from '#lib/goalGrades';
import { DEFAULT_LOCALE, formatMessage, type SupportedLocale } from '#lib/i18n';
import { isTickCountedInProjectsAndGoals } from '#lib/tickSettings';
import { getDisplayGradeSystems, getDisplayUnits, getTickTypeSettings } from './appSettings';
import { desc, eq } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { ascents, goals, routes, type Goal } from './db/schema';
import {
	defaultVenueForKind,
	gradeGoalReadiness,
	kindLabel,
	progressPct,
	type GoalKind
} from './goalsShared';
import { matchesVenueScope, normalizeVenueScope, type VenueScope } from './venue';
import { DEFAULT_DISPLAY_UNITS, formatHeight, type DisplayUnits } from '#lib/units';

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

function asVenue(g: Goal): VenueScope {
	return normalizeVenueScope(g.venueScope);
}

type AscentRouteRow = {
	routeId: number | null;
	ascentDate: string | null;
	tickType: string | null;
	heightM: number | null;
	isSend: boolean;
	isAttempt: boolean;
	effectiveGradeScore: number | null;
	gradeSystem: string | null;
	gearStyle: string | null;
	routeName: string | null;
	cragName: string | null;
	tagsJson: string | null;
};

function loadAscentRouteRows(): AscentRouteRow[] {
	const tickSettings = getTickTypeSettings();
	return db
		.select({
			routeId: ascents.routeId,
			ascentDate: ascents.ascentDate,
			tickType: ascents.tickType,
			heightM: ascents.heightM,
			isSend: ascents.isSend,
			isAttempt: ascents.isAttempt,
			effectiveGradeScore: ascents.effectiveGradeScore,
			gradeSystem: routes.gradeSystem,
			gearStyle: routes.gearStyle,
			routeName: routes.name,
			cragName: routes.cragName,
			tagsJson: routes.tagsJson
		})
		.from(ascents)
		.innerJoin(routes, eq(ascents.routeId, routes.id))
		.all()
		.filter((r) => isTickCountedInProjectsAndGoals(r.tickType, tickSettings));
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
	qualifyingSessions: number;
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
	const qualifyingDays = new Set<string>();
	const today = new Date().toISOString().slice(0, 10);

	for (const a of ascentRows) {
		const scale = parseGoalGradeScale(g.gradeScale);
		if (!scale || usesVScale(a.gradeSystem, a.gearStyle) !== (scale === 'boulder')) continue;
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
		if (!day || day > today || Number(day.slice(0, 4)) !== y) continue;
		const score = a.effectiveGradeScore;
		if (score == null || !Number.isFinite(score)) continue;

		if (!a.isSend) {
			// Working / attempt ticks at or above N−1 (projecting the goal band).
			if (a.isAttempt && score >= n1Bucket) {
				attemptsNearTarget += 1;
				qualifyingDays.add(day);
			}
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
		attemptsNearTarget,
		qualifyingSessions: qualifyingDays.size
	};
}

function enrichGoal(
	g: Goal,
	ascentRows: AscentRouteRow[] = [],
	units: DisplayUnits = DEFAULT_DISPLAY_UNITS,
	locale: SupportedLocale = DEFAULT_LOCALE
): GoalView {
	const venue = asVenue(g);
	const targetNum = Number(g.targetValue);
	const currentNum = Number(g.progressValue);
	let pct: number;
	let progressLabel: string;
	let targetLabel: string;
	let title = g.title;

	if (g.kind === 'grade') {
		const scale = parseGoalGradeScale(g.gradeScale);
		const systems = getDisplayGradeSystems();
		const formatScore = (score: number) => formatGradeLabel(score, scale === 'boulder', systems);
		const target = g.targetGradeScore ?? targetNum;
		const evidence = gradeGoalSendEvidence(g, ascentRows, new Date().getFullYear());
		const readiness = gradeGoalReadiness({
			formatScore,
			locale,
			target,
			bestSend: evidence.best,
			routesAtNMinus1: evidence.routesAtNMinus1,
			routesAtNMinus2: evidence.routesAtNMinus2,
			attemptsNearTarget: evidence.attemptsNearTarget,
			qualifyingSessions: evidence.qualifyingSessions
		});
		pct = g.completed ? 100 : readiness.pct;
		progressLabel = g.completed
			? evidence.best != null
				? formatMessage(locale, 'pages.goals.readinessBestSendDone', {
						grade: formatScore(evidence.best)
					})
				: formatMessage(locale, 'pages.goals.statusDone')
			: readiness.label;
		targetLabel = Number.isFinite(target)
			? formatMessage(locale, 'pages.goals.targetSendAtLeast', {
					grade: formatScore(target)
				})
			: formatMessage(locale, 'pages.goals.targetGradeGoal');
		if (g.year) targetLabel += ` · ${g.year}`;
		if (!scale) {
			pct = 0;
			targetLabel =
				formatMessage(locale, 'pages.goals.targetGradeScaleNeeded', { target }) +
				(g.year ? ` · ${g.year}` : '');
			progressLabel = formatMessage(locale, 'pages.goals.progressChooseScale');
		} else if (g.suggested) {
			const grade = formatScore(target);
			if (venue === 'outdoor') {
				title = g.year
					? formatMessage(locale, 'pages.goals.titleSendOutdoorYear', {
							grade,
							year: g.year
						})
					: formatMessage(locale, 'pages.goals.titleSendOutdoor', { grade });
			} else if (venue === 'indoor') {
				title = g.year
					? formatMessage(locale, 'pages.goals.titleSendIndoorYear', {
							grade,
							year: g.year
						})
					: formatMessage(locale, 'pages.goals.titleSendIndoor', { grade });
			} else {
				title = g.year
					? formatMessage(locale, 'pages.goals.titleSendAnyYear', {
							grade,
							year: g.year
						})
					: formatMessage(locale, 'pages.goals.titleSendAny', { grade });
			}
		}
	} else if (g.kind === 'height_year') {
		const metres = Number.isFinite(currentNum) ? currentNum : 0;
		const target = Number.isFinite(targetNum) ? targetNum : 0;
		pct = g.completed ? 100 : progressPct(metres, target);
		// Stored metres stay canonical; only the label follows the display unit (#483).
		progressLabel = formatHeight(metres, units.height);
		targetLabel = `${formatHeight(target, units.height)}${g.year ? ` · ${g.year}` : ''}`;
	} else if (g.kind === 'days_month') {
		const days = Number.isFinite(currentNum) ? currentNum : 0;
		const target = Number.isFinite(targetNum) ? targetNum : 0;
		pct = g.completed ? 100 : progressPct(days, target);
		progressLabel = formatMessage(locale, 'common.days', { count: days });
		targetLabel = formatMessage(locale, 'pages.goals.targetDaysThisMonth', { target });
	} else {
		pct = g.completed ? 100 : 0;
		progressLabel = g.completed
			? formatMessage(locale, 'pages.goals.statusDone')
			: g.progressValue || formatMessage(locale, 'pages.goals.statusManual');
		targetLabel = g.targetValue || formatMessage(locale, 'pages.goals.optionCustom');
	}

	if (venue !== 'any') {
		targetLabel +=
			venue === 'outdoor'
				? ` · ${formatMessage(locale, 'pages.goals.venueOutdoor')}`
				: ` · ${formatMessage(locale, 'pages.goals.venueIndoor')}`;
	}

	return {
		...g,
		title,
		completed: g.kind === 'grade' && !parseGoalGradeScale(g.gradeScale) ? false : g.completed,
		venueScope: venue,
		progressPct: pct,
		progressLabel,
		targetLabel,
		kindLabel: kindLabel(g.kind, locale)
	};
}

export function listGoals(locale: SupportedLocale = DEFAULT_LOCALE): GoalView[] {
	ensureSchema();
	updateGoalProgress();
	const ascentRows = loadAscentRouteRows();
	const units = getDisplayUnits();
	return db
		.select()
		.from(goals)
		.orderBy(desc(goals.createdAt))
		.all()
		.map((g) => enrichGoal(g, ascentRows, units, locale));
}

export function listActiveGoals(limit = 3, locale: SupportedLocale = DEFAULT_LOCALE): GoalView[] {
	return listGoals(locale)
		.filter((g) => !g.completed)
		.slice(0, limit);
}

export function createGoal(input: {
	kind: GoalKind | string;
	title: string;
	targetValue?: string | null;
	targetGradeScore?: number | null;
	gradeScale?: GoalGradeScale;
	suggested?: boolean;
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
		targetGradeScore = parseScaledGoalGrade(input.targetValue, input.gradeScale ?? 'route');
	}

	const inserted = db
		.insert(goals)
		.values({
			kind,
			title,
			targetValue: input.targetValue?.trim() || null,
			targetGradeScore,
			gradeScale: kind === 'grade' ? (input.gradeScale ?? 'route') : null,
			suggested: kind === 'grade' && input.suggested === true,
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
	return enrichGoal(
		db.select().from(goals).where(eq(goals.id, inserted.id)).get()!,
		ascentRows,
		getDisplayUnits()
	);
}

export function deleteGoal(id: number) {
	ensureSchema();
	db.delete(goals).where(eq(goals.id, id)).run();
}

/** Owner-selected identity for legacy goals; never infer a scale from free-text titles. */
export function setGoalGradeScale(id: number, scale: GoalGradeScale, suggested: boolean): boolean {
	ensureSchema();
	const goal = db.select().from(goals).where(eq(goals.id, id)).get();
	if (!goal || goal.kind !== 'grade') return false;
	db.update(goals)
		.set({ gradeScale: scale, suggested, updatedAt: nowIso() })
		.where(eq(goals.id, id))
		.run();
	updateGoalProgress();
	return true;
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
			// Preserve legacy local data until the owner supplies the missing scale.
			if (!parseGoalGradeScale(g.gradeScale)) continue;
			const target = g.targetGradeScore;
			const { best } = gradeGoalSendEvidence(g, ascentRows, currentYear);
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
