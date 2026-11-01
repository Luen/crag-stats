/**
 * Solo climbing, from theCrag tick types and the ascent's climbed gear style
 * (https://www.thecrag.com/en/article/ticktypes). See docs/guide/solo.md.
 *
 * - Top-rope solo: tick "Roped Solo" (self-belay on a rope set up from above)
 * - Lead solo:     tick "Lead solo" (lead-solo device, rope anchored at the bottom)
 * - Aid solo:      tick "Aid solo"
 * - Free solo:     climbed gear style "solo" / "Free solo" (any tick)
 * - Deep water solo: climbed gear style "dws"
 */

import { SOLO_KINDS, soloKind } from '#lib/soloKind';
export { SOLO_KINDS, soloKind } from '#lib/soloKind';
import type { SoloKind, SoloStats } from '#lib/types/dashboard';

export type SoloRow = {
	tickType: string | null;
	/** Climbed gear style on the ascent (theCrag `climbedGearStyle`), e.g. solo, dws, top-rope */
	ascentGearStyle: string | null;
	isSend: boolean;
	partners: string | null;
	date: string | null;
	routeName: string;
	/** Canonical score: Ewbank for routes, V-scale for boulders */
	score: number | null;
	isBoulder: boolean;
	gradeLabel: string | null;
	band: number | null;
	url: string | null;
};

function hasPartner(partners: string | null): boolean {
	return Boolean((partners ?? '').trim());
}

export function buildSoloStats(rows: readonly SoloRow[]): SoloStats {
	const byKind = new Map<SoloKind, SoloRow[]>();
	let unpartnered = 0;
	let unpartneredSends = 0;
	for (const r of rows) {
		const kind = soloKind(r);
		if (kind) byKind.set(kind, [...(byKind.get(kind) ?? []), r]);
		if (!hasPartner(r.partners)) {
			unpartnered += 1;
			if (r.isSend) unpartneredSends += 1;
		}
	}

	const kinds = SOLO_KINDS.filter((k) => byKind.has(k.kind)).map(({ kind, label }) => {
		const list = byKind.get(kind)!;
		const sends = list.filter((r) => r.isSend);
		// Hardest send; routes and boulders aren't comparable, so prefer routes when both exist.
		const graded = sends.filter((r) => r.score != null && Number.isFinite(r.score));
		const pool = graded.some((r) => !r.isBoulder) ? graded.filter((r) => !r.isBoulder) : graded;
		const hardest = pool.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0] ?? null;
		const dates = list
			.map((r) => r.date)
			.filter((d): d is string => Boolean(d))
			.sort();
		return {
			kind,
			label,
			count: list.length,
			sends: sends.length,
			hardest: hardest
				? {
						routeName: hardest.routeName,
						gradeLabel: hardest.gradeLabel,
						band: hardest.band,
						url: hardest.url
					}
				: null,
			first: dates[0] ?? null,
			latest: dates[dates.length - 1] ?? null
		};
	});

	return {
		total: kinds.reduce((s, k) => s + k.count, 0),
		kinds,
		unpartnered,
		unpartneredSends,
		totalAscents: rows.length
	};
}
