/** Approximate theCrag karma from the local logbook (#136). */
export type KarmaStats = {
	/** Distinct routes logged locally (or account routesTicked when denser). */
	ascentPoints: number;
	/**
	 * Guide-edit karma. Null until theCrag exposes a personal total via an API we can sync —
	 * area `/karma` leaderboards are not a substitute.
	 */
	editPoints: number | null;
	/** Ascent portion only while edits are unavailable. */
	totalPoints: number;
	/** Prefer account `routesTicked` when it covers at least as many routes as the local cache. */
	ascentSource: 'account' | 'local';
	routesLogged: number;
};
