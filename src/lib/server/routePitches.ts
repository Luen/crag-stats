/**
 * - `unchecked`: route info never fetched (`routes.route_info_updated_at` is null).
 * - `null` / `empty`: fetched, but no pitch list was cached. This includes single-pitch and boulder
 *   routes whenever the API omits `pitches`; it does NOT mean the route is multipitch-unknown.
 * - `invalid`: a value is stored but is not a JSON array (unparseable or wrong shape).
 * - `known`: a non-empty pitch array.
 */
export type RoutePitchClass = 'unchecked' | 'null' | 'empty' | 'invalid' | 'known';

/** Whether route info has been fetched at least once (`routes.route_info_updated_at`). */
export function hasRouteInfoFetched(routeInfoUpdatedAt: string | null | undefined): boolean {
	return routeInfoUpdatedAt != null && routeInfoUpdatedAt !== '';
}

/**
 * Classifies cached pitch lists from route-history import (#82).
 * Unchecked routes (route info never fetched) are excluded from `missing=pitch`. That is a
 * separate condition from `history=pending`, which tracks the route-history fetch ledger.
 */
export function classifyRoutePitches(
	pitchesJson: string | null | undefined,
	hasRouteInfo: boolean
): RoutePitchClass {
	if (!hasRouteInfo) return 'unchecked';
	if (pitchesJson == null) return 'null';
	const trimmed = pitchesJson.trim();
	if (!trimmed) return 'empty';
	try {
		const v = JSON.parse(trimmed);
		if (!Array.isArray(v)) return 'invalid';
		return v.length === 0 ? 'empty' : 'known';
	} catch {
		return 'invalid';
	}
}

/** True when route info was fetched but no usable pitch list is cached. */
export function isMissingPitchData(classification: RoutePitchClass): boolean {
	return classification === 'null' || classification === 'empty' || classification === 'invalid';
}
