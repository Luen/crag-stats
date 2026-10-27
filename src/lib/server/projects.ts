import { asc, eq, sql } from 'drizzle-orm';
import { theCragBestLink } from '#lib/thecragUrls';
import { db, ensureSchema } from './db';
import { ascents, projects, routes } from './db/schema';
import { isLikelyIndoorRoute } from './venue';

export { isLikelyIndoorRoute };

function nowIso() {
	return new Date().toISOString();
}

export type ProjectClassification = 'open' | 'sent' | 'none';

/**
 * RoxClimbs-style: a project is a route you tried and did not send at least once
 * before it went. First-try onsights/flashes are never projects.
 */
export function classifyRouteProject(input: {
	nonSendCount: number;
	sendCount: number;
	hadAttemptsBeforeSend: boolean;
}): ProjectClassification {
	const nonSends = Math.max(0, Number(input.nonSendCount) || 0);
	const sends = Math.max(0, Number(input.sendCount) || 0);

	if (sends > 0) {
		// First-go onsight/flash: never a project. Fought-then-sent needs prior non-sends.
		return input.hadAttemptsBeforeSend && nonSends >= 1 ? 'sent' : 'none';
	}
	if (nonSends >= 1) return 'open';
	return 'none';
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
		const date = row.ascentDate?.trim() || null;
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

	const hadAttemptsBeforeSend =
		sendCount > 0 &&
		nonSendCount > 0 &&
		rows.some((row) => {
			if (row.isSend) return false;
			if (!sentAt) return true;
			const d = row.ascentDate?.trim();
			if (!d) return true;
			return d.slice(0, 10) <= sentAt.slice(0, 10);
		});

	return {
		nonSendCount,
		sendCount,
		tryCount,
		sessionCount: dates.size,
		firstAttemptAt,
		lastAttemptAt,
		sentAt,
		hadAttemptsBeforeSend
	};
}

/**
 * Auto-detect projects from theCrag logbook (RoxClimbs-style).
 * Log attempts → route becomes a project. First-go sends are never projects.
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
		const status = classifyRouteProject({
			nonSendCount: stats.nonSendCount,
			sendCount: stats.sendCount,
			hadAttemptsBeforeSend: stats.hadAttemptsBeforeSend
		});
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

	const existingProjects = db.select({ id: projects.id, routeId: projects.routeId }).from(projects).all();
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
};

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
			stars: routes.stars,
			cragName: routes.cragName,
			parentName: routes.parentName,
			cragPath: routes.cragPath,
			cragUrl: routes.cragUrl,
			gearStyle: routes.gearStyle,
			url: routes.url,
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
		areaLabel: areaLabel(row.parentName, row.cragName),
		href:
			row.ascentUrl ||
			theCragBestLink({
				ascentId: row.ascentExternalId,
				routeId: row.routeExternalId,
				ancestorStub: row.cragPath,
				fallbackUrl: row.url
			})
	}));
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

type RankableProject = Pick<
	ProjectListItem,
	'id' | 'sessionCount' | 'tryCount' | 'lastAttemptAt'
>;

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
