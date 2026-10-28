import { buildPartnerLeaderboard } from './dashboardExtras';
import { db, ensureSchema } from './db';
import { ascents } from './db/schema';

/** All climbing partners from the logbook, ranked by shared ascent count. */
export function listPartners(limit: number | null = null) {
	ensureSchema();
	const rows = db
		.select({ partners: ascents.partners })
		.from(ascents)
		.all()
		.map((r) => ({ ascentDate: null, partners: r.partners }));
	return buildPartnerLeaderboard(rows, limit).partners;
}
