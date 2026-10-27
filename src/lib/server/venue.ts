/** Best-effort indoor/gym detection from route metadata (theCrag has no hard venue flag). */
export function isLikelyIndoorRoute(opts: {
	gearStyle?: string | null;
	name?: string | null;
	cragName?: string | null;
	tagsJson?: string | null;
}): boolean {
	const style = (opts.gearStyle ?? '').toLowerCase();
	if (/\b(gym|indoor)\b/.test(style)) return true;
	const blob = [opts.name, opts.cragName, opts.tagsJson]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();
	return /\b(climbing\s+gym|bouldering\s+gym|indoor\s+gym|\bgym\b|indoor)\b/.test(blob);
}

export type VenueScope = 'outdoor' | 'indoor' | 'any';

export function normalizeVenueScope(raw: string | null | undefined): VenueScope {
	const v = (raw || '').trim().toLowerCase();
	if (v === 'outdoor' || v === 'indoor' || v === 'any') return v;
	return 'any';
}

/** Whether an ascent/route counts toward a goal with the given venue scope. */
export function matchesVenueScope(
	scope: VenueScope,
	route: {
		gearStyle?: string | null;
		name?: string | null;
		cragName?: string | null;
		tagsJson?: string | null;
	}
): boolean {
	if (scope === 'any') return true;
	const indoor = isLikelyIndoorRoute(route);
	return scope === 'indoor' ? indoor : !indoor;
}
