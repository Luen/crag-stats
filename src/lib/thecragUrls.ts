/**
 * Build public theCrag page URLs.
 * Route pages: /en/climbing/{area-path}/route/{id}
 * Area/crag pages: /en/climbing/{area-path}/area/{id}
 * Ascent (logbook entry) pages: /ascent/{id}
 */

const ORIGIN = 'https://www.thecrag.com';

/** Normalise urlAncestorStub from the API (often missing a leading slash). */
export function joinAncestorStub(stub: string | null | undefined): string {
	return String(stub || '')
		.trim()
		.replace(/^\/+/, '')
		.replace(/\/+$/, '');
}

export function theCragRouteUrl(
	routeId: string | number | null | undefined,
	ancestorStub?: string | null
): string | null {
	if (routeId == null || routeId === '') return null;
	const stub = joinAncestorStub(ancestorStub);
	if (stub) return `${ORIGIN}/en/climbing/${stub}/route/${routeId}`;
	return `${ORIGIN}/en/route/${routeId}`;
}

/** Top-level crag / area page (e.g. Castle Hill → …/area/11818021). */
export function theCragAreaUrl(
	areaId: string | number | null | undefined,
	ancestorStub?: string | null
): string | null {
	if (areaId == null || areaId === '') return null;
	const stub = joinAncestorStub(ancestorStub);
	if (stub) return `${ORIGIN}/en/climbing/${stub}/area/${areaId}`;
	return `${ORIGIN}/area/${areaId}`;
}

export function theCragAscentUrl(ascentId: string | number | null | undefined): string | null {
	if (ascentId == null || ascentId === '') return null;
	return `${ORIGIN}/ascent/${ascentId}`;
}

/** Prefer the climber's logbook ascent page; fall back to the route page. */
export function theCragBestLink(opts: {
	ascentId?: string | number | null;
	routeId?: string | number | null;
	ancestorStub?: string | null;
	fallbackUrl?: string | null;
}): string | null {
	return (
		theCragAscentUrl(opts.ascentId) ??
		theCragRouteUrl(opts.routeId, opts.ancestorStub) ??
		opts.fallbackUrl ??
		null
	);
}
