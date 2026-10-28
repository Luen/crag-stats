/**
 * Community ascent impact on routes the owner put up (FA/FFA marks and/or setter credits).
 * Uses cached `routes.ascent_count` from route-history import (#135).
 */
import { eq } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { firstAscents, routes } from './db/schema';
import { listOwnerSetRoutes } from './routeSetters';

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
	fromFa: boolean;
	fromSetter: boolean;
	sportOrBolted: boolean;
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

/** Aggregate non-owner community ticks on routes the owner FA'd and/or set. */
export function buildRouteDeveloperImpact(provider = PROVIDER): RouteDeveloperImpact {
	ensureSchema();
	const faIds = new Set(
		db
			.select({ routeExternalId: firstAscents.routeExternalId })
			.from(firstAscents)
			.where(eq(firstAscents.provider, provider))
			.all()
			.map((r) => r.routeExternalId)
	);
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
			ascentCountOwn: routes.ascentCountOwn
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
		out.push({
			routeExternalId: id,
			routeName: m?.name?.trim() || null,
			url: m?.url ?? null,
			gearStyle: m?.gearStyle ?? null,
			bolts: m?.bolts ?? null,
			ascentCount,
			ownAscents,
			othersAscents,
			fromFa: faIds.has(id),
			fromSetter: setterIds.has(id),
			sportOrBolted
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
