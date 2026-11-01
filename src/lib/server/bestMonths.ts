/** Crag seasonality from theCrag, weighted by your ascents (#78). */

import type { BestMonthsCrag, BestMonthsView } from '#lib/types/dashboard';

export type BestMonthsAscentRow = {
	cragName: string | null;
	cragUrl: string | null;
	ascentDate: string | null;
	routeId: number;
	seasonalityJson: string | null;
};

export function parseSeasonalityJson(raw: string | null | undefined): number[] | null {
	if (!raw) return null;
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed) || parsed.length !== 12) return null;
		const nums: number[] = [];
		for (const item of parsed) {
			if (typeof item !== 'number' || !Number.isFinite(item)) return null;
			nums.push(item);
		}
		return nums;
	} catch {
		return null;
	}
}

/** Shared ascent-weighted mean; missing curves do not enter the denominator. */
export function weightedSeasonality(
	rows: Iterable<{ weight: number; seasonality: number[] }>
): number[] | null {
	const weighted = Array.from({ length: 12 }, () => 0);
	let total = 0;
	for (const { weight, seasonality } of rows) {
		total += weight;
		for (let i = 0; i < 12; i++) weighted[i] += seasonality[i] * weight;
	}
	return total > 0 ? weighted.map((v) => v / total) : null;
}

function emptyMonths(): number[] {
	return Array.from({ length: 12 }, () => 0);
}

function cragKey(name: string | null | undefined): string | null {
	const t = (name || '').trim();
	return t || null;
}

function monthIndexFromDate(iso: string | null | undefined): number | null {
	if (!iso || iso.length < 7) return null;
	const month = Number(iso.slice(5, 7));
	if (!Number.isFinite(month) || month < 1 || month > 12) return null;
	return month - 1;
}

function peakMonthIndex(values: number[]): number {
	let peak = 0;
	for (let i = 1; i < 12; i++) {
		if (values[i] > values[peak]) peak = i;
	}
	return peak;
}

export function buildBestMonthsView(rows: BestMonthsAscentRow[], topN = 6): BestMonthsView {
	type CragAcc = {
		crag: string;
		url: string | null;
		ascentCount: number;
		yourMonths: number[];
		routes: Map<number, { weight: number; seasonality: number[] }>;
	};

	const crags = new Map<string, CragAcc>();

	for (const row of rows) {
		const key = cragKey(row.cragName);
		if (!key) continue;

		let acc = crags.get(key);
		if (!acc) {
			acc = {
				crag: key,
				url: row.cragUrl,
				ascentCount: 0,
				yourMonths: emptyMonths(),
				routes: new Map()
			};
			crags.set(key, acc);
		}
		if (!acc.url && row.cragUrl) acc.url = row.cragUrl;

		acc.ascentCount++;
		const mi = monthIndexFromDate(row.ascentDate);
		if (mi != null) acc.yourMonths[mi]++;

		const season = parseSeasonalityJson(row.seasonalityJson);
		if (!season) continue;

		let route = acc.routes.get(row.routeId);
		if (!route) {
			route = { weight: 0, seasonality: season };
			acc.routes.set(row.routeId, route);
		}
		route.weight++;
	}

	const ranked: BestMonthsCrag[] = [];

	for (const acc of crags.values()) {
		const weighted = weightedSeasonality(acc.routes.values());
		if (!weighted) continue;

		ranked.push({
			crag: acc.crag,
			url: acc.url,
			ascentCount: acc.ascentCount,
			seasonality: weighted,
			yourMonths: acc.yourMonths,
			peakMonth: peakMonthIndex(weighted)
		});
	}

	ranked.sort((a, b) => b.ascentCount - a.ascentCount);
	const top = ranked.slice(0, topN);

	return {
		cragCount: top.length,
		crags: top
	};
}
