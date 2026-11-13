import { eq, sql } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { ascents, routes } from './db/schema';
import { parseSeasonalityJson, weightedSeasonality } from './bestMonths';
import { seasonalityAtMonth, type SeasonalityFilters } from '#lib/seasonality';
import { theCragRouteUrl } from '#lib/thecragUrls';
import { formatClimbGrade } from '#lib/grades';
import { isTickCountedInAnalytics, type TickTypeSettings } from '#lib/tickSettings';
import { getDisplayGradeSystems, getTickTypeSettings } from './appSettings';

export type SeasonalityRoute = {
	id: number;
	provider: string;
	externalId: string;
	name: string;
	cragName: string | null;
	cragUrl: string | null;
	areaExternalId: string | null;
	cragPath: string | null;
	parentName: string | null;
	country: string | null;
	gradeRaw: string | null;
	url: string | null;
	seasonalityJson: string | null;
	ascentCount: number;
};

export function seasonalityCragKey(row: SeasonalityRoute): string {
	return JSON.stringify([
		row.provider,
		row.areaExternalId
			? ['id', row.areaExternalId]
			: row.cragUrl
				? ['url', row.cragUrl]
				: row.cragName
					? ['name', row.country, row.cragPath, row.cragName]
					: ['route', row.id]
	]);
}

export type SeasonalityResult = {
	key: string;
	name: string;
	context: string;
	curve: number[];
	value: number;
	relative: number | null;
	covered: number;
	total: number;
	logbookHref: string | null;
	guidebookHref: string | null;
	crag: string;
};

export const SEASONALITY_PAGE_SIZE = 24;

/** Pure search over public route metadata; no private ascent fields. */
export function buildSeasonalitySearch(rows: SeasonalityRoute[], filters: SeasonalityFilters) {
	const groups = new Map<string, SeasonalityRoute[]>();
	for (const row of rows) {
		const key = seasonalityCragKey(row);
		const list = groups.get(key);
		if (list) list.push(row);
		else groups.set(key, [row]);
	}
	const needle = filters.q.toLowerCase();
	const matches = (row: SeasonalityRoute) =>
		[row.name, row.cragName, row.parentName, row.cragPath, row.country].some((v) =>
			v?.toLowerCase().includes(needle)
		);
	const scoped = rows.filter(
		(r) => (!filters.crag || seasonalityCragKey(r) === filters.crag) && matches(r)
	);
	const covered = scoped.filter((r) => parseSeasonalityJson(r.seasonalityJson) != null).length;
	const results: SeasonalityResult[] = [];
	if (filters.view === 'routes') {
		for (const row of scoped) {
			const curve = parseSeasonalityJson(row.seasonalityJson);
			if (!curve) continue;
			results.push({
				key: String(row.id),
				name: row.name,
				context: [row.cragName, row.parentName, row.country, row.gradeRaw]
					.filter(Boolean)
					.join(' · '),
				curve,
				...seasonalityAtMonth(curve, filters.month),
				covered: 1,
				total: 1,
				logbookHref: `/logbook?route=${row.id}`,
				guidebookHref:
					row.url ||
					(row.provider === 'thecrag' ? theCragRouteUrl(row.externalId, row.cragPath) : null),
				crag: seasonalityCragKey(row)
			});
		}
	} else {
		for (const [key, list] of groups) {
			if ((filters.crag && filters.crag !== key) || !list.some(matches)) continue;
			// Keep the full crag aggregation when a query matches only one of its routes.
			const valid = list.flatMap((r) => {
				const seasonality = parseSeasonalityJson(r.seasonalityJson);
				return seasonality ? [{ weight: r.ascentCount, seasonality }] : [];
			});
			const curve = weightedSeasonality(valid);
			if (!curve) continue;
			const first = list[0];
			results.push({
				key,
				name: first.cragName?.trim() || 'Unknown crag',
				context: [first.country, first.cragPath].filter(Boolean).join(' · '),
				curve,
				...seasonalityAtMonth(curve, filters.month),
				covered: valid.length,
				total: list.length,
				logbookHref: null,
				guidebookHref: list.find((r) => r.cragUrl)?.cragUrl ?? null,
				crag: key
			});
		}
	}
	results.sort(
		(a, b) =>
			(filters.sort === 'season' ? (b.relative ?? -1) - (a.relative ?? -1) : 0) ||
			a.name.localeCompare(b.name, 'en') ||
			a.key.localeCompare(b.key, 'en')
	);
	const total = results.length;
	const pages = Math.max(1, Math.ceil(total / SEASONALITY_PAGE_SIZE));
	const page = Math.min(filters.page, pages);
	return {
		results: results.slice((page - 1) * SEASONALITY_PAGE_SIZE, page * SEASONALITY_PAGE_SIZE),
		total,
		page,
		pages,
		coverage: { total: scoped.length, covered },
		cragName: filters.crag ? (groups.get(filters.crag)?.[0]?.cragName ?? 'Selected crag') : ''
	};
}

export function searchSeasonality(filters: SeasonalityFilters, tickSettings?: TickTypeSettings) {
	ensureSchema();
	const settings = tickSettings ?? getTickTypeSettings();
	const grouped = db
		.select({
			id: routes.id,
			provider: routes.provider,
			externalId: routes.externalId,
			name: routes.name,
			cragName: routes.cragName,
			cragUrl: routes.cragUrl,
			areaExternalId: routes.areaExternalId,
			cragPath: routes.cragPath,
			parentName: routes.parentName,
			country: routes.country,
			gradeRaw: routes.gradeRaw,
			gradeScore: routes.gradeScore,
			gradeSystem: routes.gradeSystem,
			gearStyle: routes.gearStyle,
			url: routes.url,
			seasonalityJson: routes.seasonalityJson,
			tickType: ascents.tickType,
			ascentCount: sql<number>`count(*)`
		})
		.from(routes)
		.innerJoin(ascents, eq(ascents.routeId, routes.id))
		.groupBy(routes.id, ascents.tickType)
		.all();
	// Weights follow the same counted tick types as the dashboard.
	const rows = new Map<number, { row: (typeof grouped)[number]; count: number }>();
	for (const r of grouped) {
		if (!isTickCountedInAnalytics(r.tickType, settings)) continue;
		const n = Number(r.ascentCount) || 0;
		const existing = rows.get(r.id);
		if (existing) existing.count += n;
		else rows.set(r.id, { row: r, count: n });
	}
	const systems = getDisplayGradeSystems();
	return buildSeasonalitySearch(
		[...rows.values()].map(({ row, count }) => ({
			...row,
			gradeRaw: formatClimbGrade(row, systems),
			ascentCount: count
		})),
		filters
	);
}
