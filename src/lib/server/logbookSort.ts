import { tickKind, type TickKind } from '#lib/ticks';
import { displayStyle } from './dashboardExtras';

export const LOGBOOK_SORT_KEYS = [
	'date',
	'grade',
	'quality',
	'stars',
	'style',
	'tick',
	'ascents',
	'popularity'
] as const;

export type LogbookSortKey = (typeof LOGBOOK_SORT_KEYS)[number];

export function parseLogbookSortKey(v: string | undefined): LogbookSortKey {
	const k = (v || 'date').toLowerCase();
	return (LOGBOOK_SORT_KEYS as readonly string[]).includes(k) ? (k as LogbookSortKey) : 'date';
}

export type LogbookSortRow = {
	ascentDate: string | null;
	effectiveGradeScore: number | null;
	gradeScore: number | null;
	quality: string | null;
	stars: number | null;
	ascentGearStyle: string | null;
	gearStyle: string | null;
	tickType: string | null;
	routeProvider: string;
	routeExternalId: string;
	popularity: number | null;
	relativePopularity: number | null;
	/** Community ascent count from route-info cache */
	ascentCount: number | null;
};

export function routeKey(provider: string, externalId: string): string {
	return `${provider}:${externalId}`;
}

export function buildRouteAscentCounts(
	rows: Pick<LogbookSortRow, 'routeProvider' | 'routeExternalId'>[]
): Map<string, number> {
	const m = new Map<string, number>();
	for (const r of rows) {
		const key = routeKey(r.routeProvider, r.routeExternalId);
		m.set(key, (m.get(key) ?? 0) + 1);
	}
	return m;
}

/** Prefer popularity, then relativePopularity, then cached ascentCount. */
export function routePopularity(
	r: Pick<LogbookSortRow, 'popularity' | 'relativePopularity' | 'ascentCount'>
): number | null {
	if (r.popularity != null && Number.isFinite(r.popularity)) return r.popularity;
	if (r.relativePopularity != null && Number.isFinite(r.relativePopularity)) return r.relativePopularity;
	if (r.ascentCount != null && Number.isFinite(r.ascentCount)) return r.ascentCount;
	return null;
}

const TICK_KIND_ORDER: TickKind[] = [
	'onsight',
	'flash',
	'redpoint',
	'pinkpoint',
	'tick',
	'send',
	'clean',
	'toprope',
	'other'
];

function tickSortIndex(tick: string | null | undefined): number {
	const idx = TICK_KIND_ORDER.indexOf(tickKind(tick));
	return idx >= 0 ? idx : TICK_KIND_ORDER.length;
}

export function qualityRank(q: string | null): number {
	const s = (q || '').toLowerCase();
	if (s.includes('classic') || s.includes('*****') || s === '5') return 5;
	if (s.includes('****') || s === '4') return 4;
	if (s.includes('***') || s === '3') return 3;
	if (s.includes('**') || s === '2') return 2;
	if (s.includes('*') || s === '1') return 1;
	return 0;
}

export function compareLogbookRows(
	a: LogbookSortRow,
	b: LogbookSortRow,
	sortKey: LogbookSortKey,
	routeAscentCounts: Map<string, number>
): number {
	switch (sortKey) {
		case 'grade':
			return (
				(a.effectiveGradeScore ?? a.gradeScore ?? -1) - (b.effectiveGradeScore ?? b.gradeScore ?? -1)
			);
		case 'quality':
			return qualityRank(a.quality) - qualityRank(b.quality);
		case 'stars':
			return (a.stars ?? -1) - (b.stars ?? -1);
		case 'style':
			return displayStyle(a.ascentGearStyle || a.gearStyle).localeCompare(
				displayStyle(b.ascentGearStyle || b.gearStyle)
			);
		case 'tick': {
			const byKind = tickSortIndex(a.tickType) - tickSortIndex(b.tickType);
			return byKind !== 0 ? byKind : (a.tickType || '').localeCompare(b.tickType || '');
		}
		case 'ascents': {
			const ka = routeKey(a.routeProvider, a.routeExternalId);
			const kb = routeKey(b.routeProvider, b.routeExternalId);
			return (routeAscentCounts.get(ka) ?? 0) - (routeAscentCounts.get(kb) ?? 0);
		}
		case 'popularity': {
			const pa = routePopularity(a);
			const pb = routePopularity(b);
			if (pa == null && pb == null) return 0;
			if (pa == null) return 1;
			if (pb == null) return -1;
			return pa - pb;
		}
		case 'date':
		default:
			return (a.ascentDate || '').localeCompare(b.ascentDate || '');
	}
}

export function sortLogbookRows<T extends LogbookSortRow>(
	rows: T[],
	sortKey: LogbookSortKey,
	asc: boolean,
	routeAscentCounts?: Map<string, number>
): T[] {
	const counts = routeAscentCounts ?? buildRouteAscentCounts(rows);
	return [...rows].sort((a, b) => {
		if (sortKey === 'popularity') {
			const pa = routePopularity(a);
			const pb = routePopularity(b);
			if (pa == null && pb == null) return 0;
			if (pa == null) return 1;
			if (pb == null) return -1;
			const cmp = pa - pb;
			return asc ? cmp : -cmp;
		}
		const cmp = compareLogbookRows(a, b, sortKey, counts);
		return asc ? cmp : -cmp;
	});
}
