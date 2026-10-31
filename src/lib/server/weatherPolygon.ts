/**
 * First outer-boundary coordinate from a small, explicitly typed GeoJSON area.
 * Uses a supplied coordinate, not a calculated centre. This is an approximate
 * weather location only, not a route position or a polygon topology validator.
 * Undocumented provider Fence fields and untyped nested arrays are unsupported.
 */
export function weatherPolygonPoint(raw: unknown): { lat: number; lon: number } | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const geometry = raw as Record<string, unknown>;
	const polygons =
		geometry.type === 'Polygon'
			? [geometry.coordinates]
			: geometry.type === 'MultiPolygon'
				? geometry.coordinates
				: null;
	if (!Array.isArray(polygons) || !polygons.length || polygons.length > 16) return null;
	let vertices = 0;
	let first: { lat: number; lon: number } | null = null;
	let minLon = Infinity,
		maxLon = -Infinity,
		minLat = Infinity,
		maxLat = -Infinity;
	for (const polygon of polygons) {
		if (!Array.isArray(polygon) || !polygon.length || polygon.length > 16) return null;
		for (const ring of polygon) {
			if (!Array.isArray(ring) || ring.length < 4 || (vertices += ring.length) > 256) return null;
			const distinct = new Set<string>();
			for (const p of ring) {
				if (
					!Array.isArray(p) ||
					p.length < 2 ||
					typeof p[0] !== 'number' ||
					typeof p[1] !== 'number' ||
					!Number.isFinite(p[0]) ||
					!Number.isFinite(p[1]) ||
					Math.abs(p[0]) > 180 ||
					Math.abs(p[1]) >= 85
				)
					return null;
				first ??= { lon: p[0], lat: p[1] };
				distinct.add(JSON.stringify([p[0], p[1]]));
				minLon = Math.min(minLon, p[0]);
				maxLon = Math.max(maxLon, p[0]);
				minLat = Math.min(minLat, p[1]);
				maxLat = Math.max(maxLat, p[1]);
			}
			const a = ring[0],
				b = ring[ring.length - 1];
			if (a[0] !== b[0] || a[1] !== b[1] || distinct.size < 3) return null;
		}
	}
	// Conservative bound without a longitude cosine correction; broad areas and
	// dateline crossings are excluded. No centre/centroid calculation is needed.
	if (Math.hypot(maxLon - minLon, maxLat - minLat) * 111.32 > 15) return null;
	return first;
}
