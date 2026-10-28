import { routePopularityScore } from '#lib/routePopularity';
import { ascentQualityScore } from '#lib/qualityScore';
import type { HiddenGemItem, RoutePopularityStats } from '#lib/types/routePopularity';

export type { HiddenGemItem, RoutePopularityStats } from '#lib/types/routePopularity';

export const POPULARITY_BUSY_THRESHOLD = 50;
export const HIDDEN_GEM_MAX_ASCENT_COUNT = 100;
export const HIDDEN_GEM_MIN_QUALITY_SCORE = 70;

export type RoutePopularityRow = {
	routeId: number;
	routeName: string;
	isSend?: boolean | null;
	url?: string | null;
	cragName?: string | null;
	stars?: number | null;
	quality?: string | null;
	qualityScore?: number | null;
	ascentCount?: number | null;
	popularity?: number | null;
	relativePopularity?: number | null;
	gradeLabel?: string | null;
};

export function routePopScore(row: {
	popularity?: number | null;
	relativePopularity?: number | null;
}): number | null {
	return routePopularityScore(row);
}

export function gemQualityScore(row: RoutePopularityRow): number {
	if (row.qualityScore != null && Number.isFinite(row.qualityScore)) return row.qualityScore;
	if (row.stars != null && row.stars >= 1) return row.stars * 25;
	return ascentQualityScore(row.quality) ?? 0;
}

export function isHiddenGemRoute(row: RoutePopularityRow): boolean {
	const ac = row.ascentCount;
	if (ac == null || !Number.isFinite(ac) || ac > HIDDEN_GEM_MAX_ASCENT_COUNT) return false;
	const pop = routePopScore(row);
	if (pop != null && pop >= POPULARITY_BUSY_THRESHOLD) return false;
	if (gemQualityScore(row) >= HIDDEN_GEM_MIN_QUALITY_SCORE) return true;
	return row.stars != null && row.stars >= 3;
}

function formatPopLabel(row: RoutePopularityRow): string | null {
	const score = routePopScore(row);
	if (score != null) return `${Math.round(score)}% popular`;
	if (row.ascentCount != null) return `${row.ascentCount} ascents`;
	return null;
}

const MAX_GEMS = 8;

export function buildRoutePopularityStats(
	rows: RoutePopularityRow[],
	opts?: { sendsOnly?: boolean }
): RoutePopularityStats | null {
	const sendsOnly = opts?.sendsOnly ?? true;
	let busy = 0;
	let quiet = 0;
	let withData = 0;

	for (const row of rows) {
		const score = routePopScore(row);
		if (score == null) continue;
		withData += 1;
		if (score >= POPULARITY_BUSY_THRESHOLD) busy += 1;
		else quiet += 1;
	}
	if (withData === 0) return null;

	const denom = busy + quiet;
	const byRoute = new Map<number, RoutePopularityRow>();
	for (const row of rows.filter((r) => (!sendsOnly || r.isSend) && isHiddenGemRoute(r))) {
		const prev = byRoute.get(row.routeId);
		if (!prev || gemQualityScore(row) > gemQualityScore(prev)) byRoute.set(row.routeId, row);
	}

	return {
		withData,
		totalAscents: rows.length,
		busy: { count: busy, pct: denom ? Math.round((busy / denom) * 1000) / 10 : 0 },
		quiet: { count: quiet, pct: denom ? Math.round((quiet / denom) * 1000) / 10 : 0 },
		hiddenGems: [...byRoute.values()]
			.sort(
				(a, b) =>
					gemQualityScore(b) - gemQualityScore(a) ||
					(a.ascentCount ?? 999999) - (b.ascentCount ?? 999999)
			)
			.slice(0, MAX_GEMS)
			.map((r): HiddenGemItem => ({
				routeId: r.routeId,
				routeName: r.routeName,
				gradeLabel: r.gradeLabel ?? null,
				cragName: r.cragName ?? null,
				url: r.url ?? null,
				stars: r.stars ?? null,
				qualityScore: r.qualityScore ?? null,
				ascentCount: r.ascentCount ?? null,
				popularityLabel: formatPopLabel(r)
			}))
	};
}
