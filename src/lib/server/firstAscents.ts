/**
 * First ascents (FA) and first free ascents (FFA) the owner marked in the logbook.
 * theCrag records these in route history, which the logbook API doesn't return, so the
 * marks are local (table first_ascents, keyed by provider route id). See docs/guide/first-ascents.md.
 */
import { and, eq } from 'drizzle-orm';
import { STYLE_COLORS } from '#lib/ticks';
import type { FirstAscentStats } from '#lib/types/dashboard';
import { db, ensureSchema } from './db';
import { firstAscentImportSkips, firstAscents, routes } from './db/schema';

export type FirstAscentKind = 'FA' | 'FFA';
export type FirstAscentSource = 'manual' | 'import';

export function parseFirstAscentKind(v: unknown): FirstAscentKind | null {
	return v === 'FA' || v === 'FFA' ? v : null;
}

const markKey = (provider: string, routeExternalId: string) => `${provider}:${routeExternalId}`;

/** provider:routeExternalId → kind */
export function getFirstAscentMarks(): Map<string, FirstAscentKind> {
	ensureSchema();
	const out = new Map<string, FirstAscentKind>();
	for (const r of db.select().from(firstAscents).all()) {
		const kind = parseFirstAscentKind(r.kind);
		if (kind) out.set(markKey(r.provider, r.routeExternalId), kind);
	}
	return out;
}

export function firstAscentKindFor(
	marks: Map<string, FirstAscentKind>,
	provider: string,
	routeExternalId: string
): FirstAscentKind | null {
	return marks.get(markKey(provider, routeExternalId)) ?? null;
}

export function routeExists(provider: string, routeExternalId: string): boolean {
	if (!provider || !routeExternalId) return false;
	ensureSchema();
	return Boolean(
		db
			.select({ id: routes.id })
			.from(routes)
			.where(and(eq(routes.provider, provider), eq(routes.externalId, routeExternalId)))
			.get()
	);
}

function addImportSkip(provider: string, routeExternalId: string) {
	const createdAt = new Date().toISOString();
	db.insert(firstAscentImportSkips)
		.values({ provider, routeExternalId, createdAt })
		.onConflictDoNothing()
		.run();
}

function clearImportSkip(provider: string, routeExternalId: string) {
	db.delete(firstAscentImportSkips)
		.where(
			and(
				eq(firstAscentImportSkips.provider, provider),
				eq(firstAscentImportSkips.routeExternalId, routeExternalId)
			)
		)
		.run();
}

export function isFirstAscentImportSkipped(provider: string, routeExternalId: string): boolean {
	ensureSchema();
	return Boolean(
		db
			.select({ provider: firstAscentImportSkips.provider })
			.from(firstAscentImportSkips)
			.where(
				and(
					eq(firstAscentImportSkips.provider, provider),
					eq(firstAscentImportSkips.routeExternalId, routeExternalId)
				)
			)
			.get()
	);
}

/**
 * Mark (kind) or unmark (null) a route as the owner's first ascent.
 * Unmark records an import skip by default so Settings → Import route history won't re-add it
 * unless the owner ticks "re-apply previously unmarked". Pass `recordSkip: false` when clearing
 * an imported mark because upstream history no longer credits the owner (not a manual unmark).
 */
export function setFirstAscent(
	provider: string,
	routeExternalId: string,
	kind: FirstAscentKind | null,
	opts?: { source?: FirstAscentSource; recordSkip?: boolean }
) {
	ensureSchema();
	const where = and(
		eq(firstAscents.provider, provider),
		eq(firstAscents.routeExternalId, routeExternalId)
	);
	if (!kind) {
		db.delete(firstAscents).where(where).run();
		if (opts?.recordSkip !== false) addImportSkip(provider, routeExternalId);
		return;
	}
	const source = opts?.source ?? 'manual';
	const createdAt = new Date().toISOString();
	clearImportSkip(provider, routeExternalId);
	db.insert(firstAscents)
		.values({ provider, routeExternalId, kind, createdAt, source })
		.onConflictDoUpdate({
			target: [firstAscents.provider, firstAscents.routeExternalId],
			set: { kind, source }
		})
		.run();
}

export type FirstAscentRow = {
	routeId: number;
	kind: FirstAscentKind;
	routeName: string;
	/** Display style (Sport, Trad, Boulder, …) */
	style: string;
	isBoulder: boolean;
	/** Route grade: Ewbank score for routes, V-scale for boulders */
	score: number | null;
	gradeLabel: string | null;
	band: number | null;
	cragName: string | null;
	url: string | null;
	/** Earliest logged ascent of the route (YYYY-MM-DD) */
	date: string | null;
};

type Range = FirstAscentStats['routeRange'];

function range(rows: FirstAscentRow[]): Range {
	const graded = rows.filter((r) => r.score != null && Number.isFinite(r.score));
	if (!graded.length) return null;
	const sorted = [...graded].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
	const lo = sorted[0];
	const hi = sorted[sorted.length - 1];
	return {
		min: lo.gradeLabel ?? '?',
		minBand: lo.band,
		max: hi.gradeLabel ?? '?',
		maxBand: hi.band,
		count: graded.length
	};
}

/** One row per marked route (dedupe before calling). */
export function buildFirstAscentStats(rows: readonly FirstAscentRow[]): FirstAscentStats {
	const byStyle = new Map<string, number>();
	for (const r of rows) byStyle.set(r.style, (byStyle.get(r.style) ?? 0) + 1);

	const years = rows
		.map((r) => Number((r.date || '').slice(0, 4)))
		.filter((y) => Number.isFinite(y) && y > 1900);

	return {
		total: rows.length,
		fa: rows.filter((r) => r.kind === 'FA').length,
		ffa: rows.filter((r) => r.kind === 'FFA').length,
		routesSet: 0,
		routesPutUp: 0,
		communityAscents: 0,
		sportOrBoltedCommunityAscents: 0,
		routesWithCommunityData: 0,
		communityRoutes: [],
		byStyle: [...byStyle.entries()]
			.map(([style, count]) => ({
				style,
				count,
				color: STYLE_COLORS[style] ?? STYLE_COLORS.Unknown
			}))
			.sort((a, b) => b.count - a.count),
		// Never mix Ewbank and V-scale in one range.
		routeRange: range(rows.filter((r) => !r.isBoulder)),
		boulderRange: range(rows.filter((r) => r.isBoulder)),
		firstYear: years.length ? Math.min(...years) : null,
		latestYear: years.length ? Math.max(...years) : null,
		recent: [...rows]
			.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
			.slice(0, 5)
			.map((r) => ({
				routeId: r.routeId,
				routeName: r.routeName,
				kind: r.kind,
				style: r.style,
				gradeLabel: r.gradeLabel,
				band: r.band,
				cragName: r.cragName,
				url: r.url,
				date: r.date
			}))
	};
}
