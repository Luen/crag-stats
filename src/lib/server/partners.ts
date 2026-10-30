import { eq } from 'drizzle-orm';
import { buildPartnerLeaderboard } from './dashboardExtras';
import { db, ensureSchema } from './db';
import { ascents, routes } from './db/schema';

/** All climbing partners from the logbook, ranked by shared ascent count by default. */
export function listPartners(limit: number | null = null) {
	ensureSchema();
	const rows = db
		.select({
			ascentDate: ascents.ascentDate,
			partners: ascents.partners,
			cragName: routes.cragName,
			provider: routes.provider,
			areaExternalId: routes.areaExternalId
		})
		.from(ascents)
		.leftJoin(routes, eq(ascents.routeId, routes.id))
		.all();
	return buildPartnerLeaderboard(
		rows.map((r) => ({
			...r,
			areaKey:
				r.provider && r.areaExternalId?.trim()
					? `${r.provider}:area:${r.areaExternalId.trim()}`
					: null
		})),
		limit
	).partners;
}
