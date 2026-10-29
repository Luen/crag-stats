/**
 * Community ascent impact on routes the owner put up (FA/FFA marks and/or setter credits).
 * Uses cached `routes.ascent_count` from route-history import (#135).
 */
import { eq } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { firstAscents, routes } from './db/schema';
import { listOwnerSetRoutes } from './routeSetters';
import { parseFirstAscentKind } from './firstAscents';

const PROVIDER = 'thecrag';

export type DeveloperImpactRoute = {
	routeExternalId: string;
	routeName: string | null;
	url: string | null;
	gearStyle: string | null;
	bolts: number | null;
	/** Community ascent count from theCrag route info (includes the owner). */
	ascentCount: number | null;
	/** Owner's logged ticks when ascentCount was fetched; null for legacy caches. */
	ownAscents: number | null;
	/** max(0, ascentCount − ownAscents); null when either snapshot value is missing. */
	othersAscents: number | null;
	/** When ascentCount was written; not route_info_updated_at (#147). */
	ascentCountFetchedAt: string | null;
	fromFa: boolean;
	faKind: 'FA' | 'FFA' | null;
	fromSetter: boolean;
	sportOrBolted: boolean;
	styleLabel: string | null;
};

export type RouteDeveloperImpact = {
	/** Distinct currently cached routes credited as FA/FFA and/or setter. */
	routesPutUp: number;
	/** Subset with paired route/owner count snapshots. */
	routesWithCommunityData: number;
	/** Sum of othersAscents across routes with data. */
	communityAscents: number;
	/** Community ascents on Sport gear style or bolted routes. */
	sportOrBoltedAscents: number;
	routes: DeveloperImpactRoute[];
};

function isSportOrBolted(
	gearStyle: string | null | undefined,
	bolts: number | null | undefined
): boolean {
	const style = (gearStyle ?? '').toLowerCase();
	if (style.includes('sport')) return true;
	return bolts != null && Number.isFinite(bolts) && bolts > 0;
}

/** Short style label for community-by-route rows (StyleBadge); null when unknown. */
export function communityRouteStyleLabel(
	gearStyle: string | null | undefined,
	bolts: number | null | undefined
): string | null {
	const s = (gearStyle ?? '').trim();
	// Explicit gear style wins; bolts only classify routes whose style is unknown.
	if (!s) return bolts != null && Number.isFinite(bolts) && bolts > 0 ? 'Sport/bolted' : null;
	const lower = s.toLowerCase();
	if (lower.includes('sport')) return 'Sport/bolted';
	if (lower.includes('boulder')) return 'Boulder';
	if (lower.includes('trad')) return 'Trad';
	if (lower.includes('top')) return 'Top rope';
	if (lower.includes('alpine')) return 'Alpine';
	if (lower.includes('aid')) return 'Aid';
	if (lower.includes('dws')) return 'DWS';
	return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Aggregate non-owner community ticks on routes the owner FA'd and/or set. */
export function buildRouteDeveloperImpact(provider = PROVIDER): RouteDeveloperImpact {
	ensureSchema();
	const faKinds = new Map(
		db
			.select({ routeExternalId: firstAscents.routeExternalId, kind: firstAscents.kind })
			.from(firstAscents)
			.where(eq(firstAscents.provider, provider))
			.all()
			.map((r) => [r.routeExternalId, r.kind] as const)
	);
	const faIds = new Set(faKinds.keys());
	const setterIds = new Set(listOwnerSetRoutes(provider).map((r) => r.routeExternalId));
	const allIds = new Set([...faIds, ...setterIds]);
	if (!allIds.size) {
		return {
			routesPutUp: 0,
			routesWithCommunityData: 0,
			communityAscents: 0,
			sportOrBoltedAscents: 0,
			routes: []
		};
	}

	const meta = db
		.select({
			externalId: routes.externalId,
			name: routes.name,
			url: routes.url,
			gearStyle: routes.gearStyle,
			bolts: routes.bolts,
			ascentCount: routes.ascentCount,
			ascentCountOwn: routes.ascentCountOwn,
			ascentCountFetchedAt: routes.ascentCountFetchedAt
		})
		.from(routes)
		.where(eq(routes.provider, provider))
		.all();
	const byId = new Map(meta.map((r) => [r.externalId, r]));

	const out: DeveloperImpactRoute[] = [];
	for (const id of allIds) {
		const m = byId.get(id);
		// Manual marks survive pruning; only routes still in the logbook are fetchable.
		if (!m) continue;
		const ascentCount =
			m.ascentCount != null && Number.isFinite(m.ascentCount) && m.ascentCount >= 0
				? Number(m.ascentCount)
				: null;
		const ownAscents = m.ascentCountOwn;
		const othersAscents =
			ascentCount == null || ownAscents == null
				? null
				: Math.max(0, Math.floor(ascentCount) - ownAscents);
		const sportOrBolted = isSportOrBolted(m?.gearStyle, m?.bolts ?? null);
		const styleLabel = communityRouteStyleLabel(m?.gearStyle, m?.bolts ?? null);
		out.push({
			routeExternalId: id,
			routeName: m?.name?.trim() || null,
			url: m?.url ?? null,
			gearStyle: m?.gearStyle ?? null,
			bolts: m?.bolts ?? null,
			ascentCount,
			ownAscents,
			othersAscents,
			ascentCountFetchedAt: m.ascentCountFetchedAt ?? null,
			fromFa: faIds.has(id),
			faKind: parseFirstAscentKind(faKinds.get(id)),
			fromSetter: setterIds.has(id),
			sportOrBolted,
			styleLabel
		});
	}

	out.sort((a, b) => {
		const ao = a.othersAscents ?? -1;
		const bo = b.othersAscents ?? -1;
		if (bo !== ao) return bo - ao;
		return (a.routeName || a.routeExternalId).localeCompare(b.routeName || b.routeExternalId);
	});

	let communityAscents = 0;
	let sportOrBoltedAscents = 0;
	let routesWithCommunityData = 0;
	for (const r of out) {
		if (r.othersAscents == null) continue;
		routesWithCommunityData += 1;
		communityAscents += r.othersAscents;
		if (r.sportOrBolted) sportOrBoltedAscents += r.othersAscents;
	}

	return {
		routesPutUp: out.length,
		routesWithCommunityData,
		communityAscents,
		sportOrBoltedAscents,
		routes: out
	};
}
