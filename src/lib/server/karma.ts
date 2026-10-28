/**
 * Approximate theCrag karma from the local cache (#136).
 *
 * theCrag awards **1** karma once per node for "Log Ascent" (see their Karma article).
 * Guide edits use other one-per-node scores, but personal edit totals are not in the
 * supporter logbook account object, so we cannot reconstruct them honestly here.
 */
import { count, eq } from 'drizzle-orm';
import type { KarmaStats } from '#lib/types/karma';
import { db, ensureSchema } from './db';
import { profiles, routes } from './db/schema';

const PROVIDER = 'thecrag';

/** Distinct routes present in the local logbook cache. */
export function countLocalRoutesLogged(provider = PROVIDER): number {
	ensureSchema();
	const row = db.select({ n: count() }).from(routes).where(eq(routes.provider, provider)).get();
	return Number(row?.n ?? 0);
}

export function buildKarmaStats(provider = PROVIDER): KarmaStats {
	ensureSchema();
	const localRoutes = countLocalRoutesLogged(provider);
	const account = db
		.select({ routesTicked: profiles.routesTicked })
		.from(profiles)
		.where(eq(profiles.provider, provider))
		.get();
	const accountRoutes =
		account?.routesTicked != null && Number.isFinite(account.routesTicked)
			? Math.max(0, Math.floor(Number(account.routesTicked)))
			: null;

	// Prefer the account counter when it is at least as complete as the local cache
	// (CSV-only installs have no account field; API sync usually does).
	const useAccount = accountRoutes != null && accountRoutes >= localRoutes;
	const ascentPoints = useAccount ? accountRoutes! : localRoutes;

	return {
		ascentPoints,
		editPoints: null,
		totalPoints: ascentPoints,
		ascentSource: useAccount ? 'account' : 'local',
		routesLogged: localRoutes
	};
}
