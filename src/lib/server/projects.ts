import { calendarDay } from '#lib/calendarDay';
import { asc, eq, sql } from 'drizzle-orm';
import { projectPublicBetaFromJson, type ProjectPublicBeta } from '#lib/routeBeta';
import { theCragBestLink, theCragRouteUrl } from '#lib/thecragUrls';
import { db, ensureSchema } from './db';
import { ascents, projects, routes } from './db/schema';
import { isLikelyIndoorRoute } from './venue';

export { isLikelyIndoorRoute };

function nowIso() {
	return new Date().toISOString();
}

export type ProjectClassification = 'open' | 'sent' | 'none';

/** Open projects need two days; completed projects also allow a same-day fight. */
export function classifyRouteProject(
	input: Pick<
		RouteAscentStats,
		'sendCount' | 'sessionCount' | 'sessionsThroughSend' | 'triesBeforeSend'
	>
): ProjectClassification {
	if (input.sendCount > 0) {
		return input.triesBeforeSend >= 1 &&
			(input.sessionsThroughSend >= 2 || input.triesBeforeSend >= 2)
			? 'sent'
			: 'none';
	}
	return input.sessionCount >= 2 ? 'open' : 'none';
}

function parseAscentDay(raw: string | null | undefined): number | null {
	if (!raw) return null;
	const s = String(raw).trim();
	if (!s) return null;
	const parsed = Date.parse(s.length <= 10 ? `${s.slice(0, 10)}T12:00:00Z` : s);
	return Number.isNaN(parsed) ? null : parsed;
}

/** Sent shelf window (~1 month). Keep DB row; drop from "recently sent" UI after. */
export function isRecentlySent(
	sentAt: string | null | undefined,
	now: Date = new Date(),
	windowDays = 31
): boolean {
	const parsed = parseAscentDay(sentAt);
	if (parsed == null) return false;
	const delta = now.getTime() - parsed;
	if (delta < 0) return false;
	return delta <= windowDays * 24 * 60 * 60 * 1000;
}

/** Drop open projects with no touch in this window (default 365 days). */
export const PROJECT_STALE_DAYS = 365;

export function isTouchedWithin(
	lastAttemptAt: string | null | undefined,
	now: Date = new Date(),
	windowDays = PROJECT_STALE_DAYS
): boolean {
	const parsed = parseAscentDay(lastAttemptAt);
	if (parsed == null) return false;
	const delta = now.getTime() - parsed;
	if (delta < 0) return true;
	return delta <= windowDays * 24 * 60 * 60 * 1000;
}

/** Tries from one non-send ascent row: prefer numberAttempts when > 0, else 1. */
export function triesFromAscent(
	numberAttempts: number | null | undefined,
	isSend: boolean
): number {
	if (isSend) return 0;
	const n = Number(numberAttempts);
	return Number.isFinite(n) && n > 0 ? n : 1;
}

export type RouteAscentStats = {
	nonSendCount: number;
	sendCount: number;
	tryCount: number;
	sessionCount: number;
	firstAttemptAt: string | null;
	lastAttemptAt: string | null;
	sentAt: string | null;
	hadAttemptsBeforeSend: boolean;
	sessionsThroughSend: number;
	triesBeforeSend: number;
};

export function summarizeRouteAscents(
	rows: Array<{
		ascentDate: string | null;
		isSend: boolean;
		isAttempt: boolean;
		numberAttempts: number | null;
	}>
): RouteAscentStats {
	let nonSendCount = 0;
	let sendCount = 0;
	let tryCount = 0;
	const dates = new Set<string>();
	let firstAttemptAt: string | null = null;
	let lastAttemptAt: string | null = null;
	let sentAt: string | null = null;

	for (const row of rows) {
		const date = calendarDay(row.ascentDate) ? row.ascentDate!.trim() : null;
		if (date) {
			dates.add(date.slice(0, 10));
			if (!firstAttemptAt || date < firstAttemptAt) firstAttemptAt = date;
			if (!lastAttemptAt || date > lastAttemptAt) lastAttemptAt = date;
		}

		if (row.isSend) {
			sendCount += 1;
			if (date && (!sentAt || date < sentAt)) sentAt = date;
		} else {
			nonSendCount += 1;
			tryCount += triesFromAscent(row.numberAttempts, false);
			// Hangdog / working flagged via isAttempt still count as non-sends above.
			void row.isAttempt;
		}
	}

	const sendDay = calendarDay(sentAt);
	const daysThroughSend = new Set<string>();
	let triesBeforeSend = 0;
	for (const row of rows) {
		const day = calendarDay(row.ascentDate);
		if (!day || !sendDay || day > sendDay) continue;
		if (!row.isSend) {
			daysThroughSend.add(day);
			triesBeforeSend += triesFromAscent(row.numberAttempts, false);
		}
	}
	if (sendDay) daysThroughSend.add(sendDay);
	// numberAttempts on the earliest send includes the successful try.
	const firstSend = rows.find(
		(row) => row.isSend && sentAt != null && row.ascentDate?.trim() === sentAt
	);
	const n = Number(firstSend?.numberAttempts);
	const sendTries = Number.isFinite(n) && n > 1 ? n - 1 : 0;
	// Separate rows may already describe those same tries; don't double-count them.
	triesBeforeSend = Math.max(triesBeforeSend, sendTries);
	const hadAttemptsBeforeSend = triesBeforeSend > 0;

	return {
		nonSendCount,
		sendCount,
		tryCount: Math.max(tryCount, triesBeforeSend),
		sessionCount: dates.size,
		firstAttemptAt,
		lastAttemptAt,
		sentAt,
		hadAttemptsBeforeSend,
		sessionsThroughSend: daysThroughSend.size,
		triesBeforeSend
	};
}

/**
 * Auto-detect projects from theCrag logbook (RoxClimbs-style).
 * Open projects require two calendar days. Same-day sends need two failed tries.
 * Open projects untouched for a year are dropped.
 */
export function refreshProjects(now: Date = new Date()) {
	ensureSchema();

	const ascentRows = db
		.select({
			routeId: ascents.routeId,
			ascentDate: ascents.ascentDate,
			isSend: ascents.isSend,
			isAttempt: ascents.isAttempt,
			numberAttempts: ascents.numberAttempts
		})
		.from(ascents)
		.all();

	const routeMeta = new Map(
		db
			.select({
				id: routes.id,
				gearStyle: routes.gearStyle,
				name: routes.name,
				cragName: routes.cragName,
				tagsJson: routes.tagsJson
			})
			.from(routes)
			.all()
			.map((r) => [r.id, r] as const)
	);

	const byRoute = new Map<number, typeof ascentRows>();
	for (const row of ascentRows) {
		const list = byRoute.get(row.routeId);
		if (list) list.push(row);
		else byRoute.set(row.routeId, [row]);
	}

	const updatedAt = nowIso();
	const keepIds = new Set<number>();

	for (const [routeId, rows] of byRoute) {
		const meta = routeMeta.get(routeId);
		if (
			meta &&
			isLikelyIndoorRoute({
				gearStyle: meta.gearStyle,
				name: meta.name,
				cragName: meta.cragName,
				tagsJson: meta.tagsJson
			})
		) {
			continue;
		}

		const stats = summarizeRouteAscents(rows);
		const status = classifyRouteProject(stats);
		if (status === 'none') continue;
		// Stale open projects (no touch in a year) fall off — not actively projecting.
		if (status === 'open' && !isTouchedWithin(stats.lastAttemptAt, now)) continue;

		keepIds.add(routeId);
		const existing = db.select().from(projects).where(eq(projects.routeId, routeId)).get();
		const values = {
			status,
			attemptCount: stats.tryCount,
			firstAttemptAt: stats.firstAttemptAt,
			lastAttemptAt: stats.lastAttemptAt,
			sentAt: stats.sentAt,
			updatedAt
		};

		if (existing) {
			db.update(projects).set(values).where(eq(projects.id, existing.id)).run();
		} else {
			db.insert(projects)
				.values({
					routeId,
					...values
				})
				.run();
		}
	}

	const existingProjects = db
		.select({ id: projects.id, routeId: projects.routeId })
		.from(projects)
		.all();
	for (const row of existingProjects) {
		if (!keepIds.has(row.routeId)) {
			db.delete(projects).where(eq(projects.id, row.id)).run();
		}
	}
}

export type ProjectListItem = {
	id: number;
	status: string;
	attemptCount: number;
	tryCount: number;
	sessionCount: number;
	firstAttemptAt: string | null;
	lastAttemptAt: string | null;
	sentAt: string | null;
	routeId: number;
	routeExternalId: string;
	routeName: string;
	gradeRaw: string | null;
	gradeBand: number | null;
	gradeScore: number | null;
	/** No grade on theCrag: likely a new route the climber bolted or is working. */
	ungraded: boolean;
	/** theCrag Project flag from route info import (#77). */
	isProject: boolean;
	stars: number | null;
	cragName: string | null;
	parentName: string | null;
	areaLabel: string;
	cragPath: string | null;
	cragUrl: string | null;
	gearStyle: string | null;
	url: string | null;
	ascentExternalId: string | null;
	ascentUrl: string | null;
	href: string | null;
	publicBeta: ProjectPublicBeta | null;
};

export function isTheCragProjectFlag(isProject: number | null | undefined): boolean {
	return isProject === 1;
}

/**
 * Provisional multi-grade spans (e.g. 21-23, V1-3) often mean the line is still being
 * dialled in — closer to a new/ungraded project than to a settled midpoint grade.
 * Adjacent half-grades (V1/2, V5/6) are normal published notation and are excluded.
 */
export function isProvisionalGradeRange(gradeRaw: string | null | undefined): boolean {
	const raw = (gradeRaw ?? '').trim().replace(/\s+/g, '');
	if (!raw) return false;
	const ewbank = raw.match(/^(\d{1,2})[-–](\d{1,2})$/);
	if (ewbank) return Math.abs(Number(ewbank[1]) - Number(ewbank[2])) > 1;
	const v = raw.match(/^V(\d+)[/\-–]V?(\d+)([+-])?$/i);
	if (v) return Math.abs(Number(v[1]) - Number(v[2])) > 1;
	return false;
}

/**
 * theCrag returns ungraded routes with no grade (and band 0) and has no separate project
 * flag. Some areas grade open projects literally "Project" / "Proj", so count those too.
 * Wide provisional ranges (21-23, V1-3) also count for the New route? badge (#236).
 */
export function isUngradedRoute(gradeScore: number | null, gradeRaw: string | null): boolean {
	const raw = (gradeRaw ?? '').trim();
	if (/^(open\s+)?proj(ect)?\.?$/i.test(raw)) return true;
	if (isProvisionalGradeRange(raw)) return true;
	return (gradeScore == null || !Number.isFinite(gradeScore)) && !raw;
}

function areaLabel(parentName: string | null, cragName: string | null): string {
	const parent = parentName?.trim();
	const crag = cragName?.trim();
	if (parent && crag && parent !== crag) return `${parent} · ${crag}`;
	return parent || crag || '';
}

export function listProjects(status?: 'open' | 'sent' | 'archived'): ProjectListItem[] {
	ensureSchema();
	/** Prefer a send ascent when present, else the most recent tick (open projects). */
	const preferredAscentExternalId = sql<string | null>`(
		SELECT a.external_id FROM ascents a
		WHERE a.route_id = ${routes.id}
		ORDER BY a.is_send DESC, a.ascent_date DESC
		LIMIT 1
	)`;
	const preferredAscentUrl = sql<string | null>`(
		SELECT a.ascent_url FROM ascents a
		WHERE a.route_id = ${routes.id}
		ORDER BY a.is_send DESC, a.ascent_date DESC
		LIMIT 1
	)`;
	const sessionCountSql = sql<number>`(
		SELECT count(DISTINCT substr(a.ascent_date, 1, 10)) FROM ascents a
		WHERE a.route_id = ${routes.id} AND a.ascent_date IS NOT NULL AND trim(a.ascent_date) != ''
	)`;

	const q = db
		.select({
			id: projects.id,
			status: projects.status,
			attemptCount: projects.attemptCount,
			firstAttemptAt: projects.firstAttemptAt,
			lastAttemptAt: projects.lastAttemptAt,
			sentAt: projects.sentAt,
			routeId: routes.id,
			routeExternalId: routes.externalId,
			routeName: routes.name,
			gradeRaw: routes.gradeRaw,
			gradeBand: routes.gradeBand,
			gradeScore: routes.gradeScore,
			isProject: routes.isProject,
			stars: routes.stars,
			cragName: routes.cragName,
			parentName: routes.parentName,
			cragPath: routes.cragPath,
			cragUrl: routes.cragUrl,
			gearStyle: routes.gearStyle,
			url: routes.url,
			betaJson: routes.betaJson,
			ascentExternalId: preferredAscentExternalId,
			ascentUrl: preferredAscentUrl,
			sessionCount: sessionCountSql
		})
		.from(projects)
		.innerJoin(routes, eq(projects.routeId, routes.id));

	const rows = status ? q.where(eq(projects.status, status)).all() : q.all();
	return rows.map((row) => ({
		...row,
		tryCount: row.attemptCount,
		sessionCount: Number(row.sessionCount) || 0,
		ungraded: isUngradedRoute(row.gradeScore, row.gradeRaw),
		isProject: isTheCragProjectFlag(row.isProject),
		areaLabel: areaLabel(row.parentName, row.cragName),
		href:
			row.ascentUrl ||
			theCragBestLink({
				ascentId: row.ascentExternalId,
				routeId: row.routeExternalId,
				ancestorStub: row.cragPath,
				fallbackUrl: row.url
			}),
		publicBeta: projectPublicBetaFromJson(
			row.betaJson,
			theCragRouteUrl(row.routeExternalId, row.cragPath)
		)
	}));
}

/**
 * Count of "working on" projects (same rule as listActiveProjects().workingOn) for the
 * sidebar badge. Reads one column instead of the full listProjects() join (#38).
 */
export function countActiveProjects(now: Date = new Date()): number {
	ensureSchema();
	const rows = db
		.select({ lastAttemptAt: projects.lastAttemptAt })
		.from(projects)
		.where(eq(projects.status, 'open'))
		.all();
	return countTouched(rows, now);
}

/** Pure helper (unit-tested): how many open rows were touched within the stale window. */
export function countTouched(
	rows: { lastAttemptAt: string | null }[],
	now: Date = new Date()
): number {
	return rows.filter((r) => isTouchedWithin(r.lastAttemptAt, now)).length;
}

/** Working-on (open, touched within a year) + recently-sent shelf (~31 days). */
export function listActiveProjects(now: Date = new Date()) {
	const all = listProjects();
	const workingOn = all
		.filter((p) => p.status === 'open' && isTouchedWithin(p.lastAttemptAt, now))
		.sort((a, b) => String(b.lastAttemptAt ?? '').localeCompare(String(a.lastAttemptAt ?? '')));
	const recentlySent = all
		.filter((p) => p.status === 'sent' && isRecentlySent(p.sentAt, now))
		.sort((a, b) => String(b.sentAt ?? '').localeCompare(String(a.sentAt ?? '')));
	return { workingOn, recentlySent };
}

type RankableProject = Pick<ProjectListItem, 'id' | 'sessionCount' | 'tryCount' | 'lastAttemptAt'>;

/** Rank open projects for the dashboard card (most sessions/tries, then recent). */
export function rankDashboardProjects<T extends RankableProject>(
	workingOn: T[],
	recentlySent: T[] = [],
	limit = 3
): T[] {
	const ranked = [...workingOn].sort((a, b) => {
		const bySessions = (b.sessionCount || 0) - (a.sessionCount || 0);
		if (bySessions !== 0) return bySessions;
		const byTries = (b.tryCount || 0) - (a.tryCount || 0);
		if (byTries !== 0) return byTries;
		return String(b.lastAttemptAt ?? '').localeCompare(String(a.lastAttemptAt ?? ''));
	});
	if (ranked.length >= limit) return ranked.slice(0, limit);
	const need = limit - ranked.length;
	const fill = recentlySent.filter((p) => !ranked.some((r) => r.id === p.id)).slice(0, need);
	return [...ranked, ...fill];
}

/**
 * Dashboard highlight: top open projects by sessions / tries logged,
 * then most recently touched. Falls back to recent sends if few open.
 */
export function listDashboardProjects(limit = 3, now: Date = new Date()): ProjectListItem[] {
	const { workingOn, recentlySent } = listActiveProjects(now);
	return rankDashboardProjects(workingOn, recentlySent, limit);
}

export function getProjectAttempts(routeId: number) {
	ensureSchema();
	return db
		.select()
		.from(ascents)
		.where(eq(ascents.routeId, routeId))
		.orderBy(asc(ascents.ascentDate))
		.all();
}
