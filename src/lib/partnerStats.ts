/**
 * Partner leaderboard metrics for `/partners` (and the dashboard card).
 * Ascents = shared ticks; sessions = unique calendar days; areas = unique crags.
 */

import { calendarDay as validDay } from '#lib/calendarDay';

export type PartnerMetric = 'ascents' | 'sessions' | 'areas';

export const PARTNER_METRICS: readonly PartnerMetric[] = ['ascents', 'sessions', 'areas'] as const;

export type PartnerStat = {
	name: string;
	ascents: number;
	sessions: number;
	areas: number;
};

export type PartnerAscentInput = {
	ascentDate?: string | null;
	partners?: string | null;
	cragName?: string | null;
	/** Cached provider-scoped area identity, separate from its display name. */
	areaKey?: string | null;
};

/** Split partner strings; strip leading @ from handles. */
export function splitPartners(raw: string | null | undefined): string[] {
	if (!raw) return [];
	return raw
		.split(/[,;&/]+|\band\b/i)
		.map((p) => p.trim().replace(/^@+/, '').trim())
		.filter(Boolean);
}

/** Crag grain for “areas” — skip blank / Unknown so they don’t dominate the ranking. */
export function partnerAreaKey(cragName: string | null | undefined): string | null {
	const n = (cragName ?? '').trim();
	if (!n) return null;
	const key = n.toLowerCase();
	if (key === 'unknown') return null;
	// Lowercase so provider casing noise doesn’t inflate distinct-area counts.
	return key;
}

export function partnerMetricValue(p: PartnerStat, metric: PartnerMetric): number {
	if (metric === 'sessions') return p.sessions;
	if (metric === 'areas') return p.areas;
	return p.ascents;
}

export function sortPartners(partners: PartnerStat[], metric: PartnerMetric): PartnerStat[] {
	return [...partners].sort(
		(a, b) =>
			partnerMetricValue(b, metric) - partnerMetricValue(a, metric) || a.name.localeCompare(b.name)
	);
}

export function partnerMetricLabel(metric: PartnerMetric, count: number): string {
	if (metric === 'sessions') return count === 1 ? 'session' : 'sessions';
	if (metric === 'areas') return count === 1 ? 'area' : 'areas';
	return count === 1 ? 'ascent' : 'ascents';
}

export function buildPartnerStats(rows: PartnerAscentInput[]): PartnerStat[] {
	type Acc = {
		name: string;
		ascents: number;
		days: Set<string>;
		areas: Set<string>;
	};
	const map = new Map<string, Acc>();
	// Resolve name-only rows to a known id only when that name is unambiguous.
	const identitiesByName = new Map<string, Set<string>>();
	for (const row of rows) {
		const name = partnerAreaKey(row.cragName);
		const id = row.areaKey?.trim();
		if (name && id) {
			const ids = identitiesByName.get(name) ?? new Set<string>();
			ids.add(id);
			identitiesByName.set(name, ids);
		}
	}

	for (const row of rows) {
		const names = splitPartners(row.partners);
		if (!names.length) continue;
		const day = validDay(row.ascentDate);
		const nameKey = partnerAreaKey(row.cragName);
		const known = nameKey ? identitiesByName.get(nameKey) : null;
		const area =
			row.areaKey?.trim() ||
			(known?.size === 1 ? [...known][0]! : nameKey ? `name:${nameKey}` : null);

		const seenNames = new Set<string>();
		for (const name of names) {
			const key = name.toLowerCase();
			if (seenNames.has(key)) continue;
			seenNames.add(key);
			let acc = map.get(key);
			if (!acc) {
				acc = { name, ascents: 0, days: new Set(), areas: new Set() };
				map.set(key, acc);
			}
			acc.ascents += 1;
			if (day) acc.days.add(day);
			if (area) acc.areas.add(area);
		}
	}

	return [...map.values()].map((acc) => ({
		name: acc.name,
		ascents: acc.ascents,
		sessions: acc.days.size,
		areas: acc.areas.size
	}));
}
