/**
 * Partner leaderboard metrics for `/partners` (and the dashboard card).
 * Ascents = shared ticks; sessions = unique calendar days; areas = unique crags.
 */

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
};

/** Split partner strings; strip leading @ from handles. */
export function splitPartners(raw: string | null | undefined): string[] {
	if (!raw) return [];
	return raw
		.split(/[,;&/]+|\band\b/i)
		.map((p) => p.trim().replace(/^@+/, '').trim())
		.filter(Boolean);
}

function validDay(iso: string | null | undefined): string | null {
	const d = (iso ?? '').slice(0, 10);
	const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return null;
	const year = Number(m[1]);
	const month = Number(m[2]);
	const day = Number(m[3]);
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;
	const dt = new Date(`${d}T12:00:00Z`);
	if (Number.isNaN(dt.getTime())) return null;
	if (dt.getUTCFullYear() !== year || dt.getUTCMonth() + 1 !== month || dt.getUTCDate() !== day) {
		return null;
	}
	return d;
}

/** Crag grain for “areas” — skip blank / Unknown so they don’t dominate the ranking. */
export function partnerAreaKey(cragName: string | null | undefined): string | null {
	const n = (cragName ?? '').trim();
	if (!n) return null;
	if (n.toLowerCase() === 'unknown') return null;
	return n;
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

	for (const row of rows) {
		const names = splitPartners(row.partners);
		if (!names.length) continue;
		const day = validDay(row.ascentDate);
		const area = partnerAreaKey(row.cragName);

		for (const name of names) {
			const key = name.toLowerCase();
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
