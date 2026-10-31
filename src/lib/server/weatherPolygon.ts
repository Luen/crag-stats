type Position = [number, number];
type Ring = Position[];
type Polygon = Ring[];
const EPSILON = 1e-12;

function cross(a: Position, b: Position, c: Position): number {
	return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
function intersects(a: Position, b: Position, c: Position, d: Position): boolean {
	if (
		Math.max(a[0], b[0]) < Math.min(c[0], d[0]) ||
		Math.max(c[0], d[0]) < Math.min(a[0], b[0]) ||
		Math.max(a[1], b[1]) < Math.min(c[1], d[1]) ||
		Math.max(c[1], d[1]) < Math.min(a[1], b[1])
	)
		return false;
	const sign = (n: number) => (Math.abs(n) <= EPSILON ? 0 : Math.sign(n));
	return (
		sign(cross(a, b, c)) * sign(cross(a, b, d)) <= 0 &&
		sign(cross(c, d, a)) * sign(cross(c, d, b)) <= 0
	);
}
function inside(p: Position, ring: Ring): boolean {
	let result = false;
	for (let i = 0; i < ring.length - 1; i++) {
		const a = ring[i],
			b = ring[i + 1];
		if (
			a[1] > p[1] !== b[1] > p[1] &&
			p[0] < a[0] + ((p[1] - a[1]) * (b[0] - a[0])) / (b[1] - a[1])
		)
			result = !result;
	}
	return result;
}

/**
 * Interior point for small, simple GeoJSON polygons (longitude, latitude).
 * Deliberately NOT wired to provider parsing: #309 requires a real sanitized
 * provider polygon fixture before any payload-to-GeoJSON adapter is enabled.
 * Reject uncertain topology/extent instead of substituting a bounding-box centre.
 */
export function weatherPolygonPoint(raw: unknown): { lat: number; lon: number } | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const geometry = raw as Record<string, unknown>;
	const input =
		geometry.type === 'Polygon'
			? [geometry.coordinates]
			: geometry.type === 'MultiPolygon'
				? geometry.coordinates
				: null;
	if (!Array.isArray(input) || input.length === 0 || input.length > 16) return null;
	const polygons: Polygon[] = [];
	let vertices = 0;
	for (const value of input) {
		if (!Array.isArray(value) || value.length === 0 || value.length > 16) return null;
		const polygon: Polygon = [];
		for (const coords of value) {
			if (!Array.isArray(coords) || coords.length < 4 || (vertices += coords.length) > 256)
				return null;
			const ring: Ring = [];
			for (const p of coords) {
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
				ring.push([p[0], p[1]]);
			}
			const last = ring.length - 1;
			if (ring[0][0] !== ring[last][0] || ring[0][1] !== ring[last][1]) return null;
			if (new Set(ring.slice(0, -1).map((p) => JSON.stringify(p))).size !== last) return null;
			for (let i = 0; i < last; i++) {
				// Also reject collinear/backtracking adjacent edges.
				if (Math.abs(cross(ring[i], ring[(i + 1) % last], ring[(i + 2) % last])) <= EPSILON)
					return null;
				for (let j = i + 2; j < last; j++) {
					if (i === 0 && j === last - 1) continue;
					if (intersects(ring[i], ring[i + 1], ring[j], ring[j + 1])) return null;
				}
			}
			polygon.push(ring);
		}
		for (let i = 1; i < polygon.length; i++) {
			if (!inside(polygon[i][0], polygon[0])) return null;
			for (let j = 0; j < i; j++) {
				if (j > 0 && (inside(polygon[i][0], polygon[j]) || inside(polygon[j][0], polygon[i])))
					return null;
				for (let a = 0; a < polygon[i].length - 1; a++)
					for (let b = 0; b < polygon[j].length - 1; b++)
						if (intersects(polygon[i][a], polygon[i][a + 1], polygon[j][b], polygon[j][b + 1]))
							return null;
			}
		}
		polygons.push(polygon);
	}
	const points = polygons.flat(2);
	const xs = points.map((p) => p[0]),
		ys = points.map((p) => p[1]);
	// Conservative upper bound without longitude cosine correction. This also
	// rejects antimeridian-spanning and broad regional/country geometry.
	if (
		Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 111.32 >
		15
	)
		return null;
	// Components may be disjoint or nested in another component's hole, but
	// overlapping/touching component boundaries are uncertain and rejected.
	for (let i = 0; i < polygons.length; i++)
		for (let j = 0; j < i; j++) {
			for (const a of polygons[i])
				for (const b of polygons[j])
					for (let u = 0; u < a.length - 1; u++)
						for (let v = 0; v < b.length - 1; v++)
							if (intersects(a[u], a[u + 1], b[v], b[v + 1])) return null;
			const contains = (p: Position, polygon: Polygon) =>
				inside(p, polygon[0]) && !polygon.slice(1).some((r) => inside(p, r));
			if (contains(polygons[i][0][0], polygons[j]) || contains(polygons[j][0][0], polygons[i]))
				return null;
		}
	let best: { lat: number; lon: number } | null = null;
	let width = 0;
	for (const polygon of polygons) {
		// A midpoint between vertex heights never hits a vertex/horizontal edge.
		const levels = [...new Set(polygon.flat().map((p) => p[1]))].sort((a, b) => a - b);
		for (let k = 1; k < levels.length; k++) {
			const y = (levels[k - 1] + levels[k]) / 2;
			const hits: number[] = [];
			for (const ring of polygon)
				for (let i = 0; i < ring.length - 1; i++) {
					const a = ring[i],
						b = ring[i + 1];
					if (a[1] > y !== b[1] > y) hits.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
				}
			hits.sort((a, b) => a - b);
			for (let i = 0; i + 1 < hits.length; i += 2)
				if (hits[i + 1] - hits[i] > width) {
					width = hits[i + 1] - hits[i];
					best = { lat: y, lon: (hits[i] + hits[i + 1]) / 2 };
				}
		}
	}
	return best;
}
