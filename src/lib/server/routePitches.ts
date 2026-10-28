export type RoutePitchClass = 'unchecked' | 'null' | 'empty' | 'known';

/** Whether route info has been fetched at least once (`routes.route_info_updated_at`). */
export function hasRouteInfoFetched(routeInfoUpdatedAt: string | null | undefined): boolean {
	return routeInfoUpdatedAt != null && routeInfoUpdatedAt !== '';
}

/**
 * Classifies cached pitch lists from route-history import (#82).
 * Unchecked routes are excluded from `missing=pitch` (use `history=pending` for those).
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
		if (!Array.isArray(v)) return 'empty';
		return v.length === 0 ? 'empty' : 'known';
	} catch {
		return 'empty';
	}
}

export function isMissingPitchData(classification: RoutePitchClass): boolean {
	return classification === 'null' || classification === 'empty';
}
