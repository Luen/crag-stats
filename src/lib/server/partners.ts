import { eq } from 'drizzle-orm';
import { isTickCountedInAnalytics, type TickTypeSettings } from '#lib/tickSettings';
import { getTickTypeSettings } from './appSettings';
import { buildPartnerLeaderboard } from './dashboardExtras';
import { db, ensureSchema } from './db';
import { ascents, routes } from './db/schema';

/** All climbing partners from the logbook, ranked by shared ascent count by default. */
export function listPartners(limit: number | null = null, tickSettings?: TickTypeSettings) {
	ensureSchema();
	const settings = tickSettings ?? getTickTypeSettings();
	const rows = db
		.select({
			ascentDate: ascents.ascentDate,
			tickType: ascents.tickType,
			partners: ascents.partners,
			cragName: routes.cragName,
			provider: routes.provider,
			areaExternalId: routes.areaExternalId
		})
		.from(ascents)
		.leftJoin(routes, eq(ascents.routeId, routes.id))
		.all()
		.filter((r) => isTickCountedInAnalytics(r.tickType, settings));
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
