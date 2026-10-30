import { weatherAscentDay } from './weatherKeys';
/** Shared exact place identity and date/coordinate rules for the map and logbook. */
export type MapLocation = {
	routeProvider: string | null;
	areaExternalId?: string | null;
	routeExternalId?: string | null;
	cragName: string | null;
	country: string | null;
	lat: number | null;
	lon: number | null;
};
export function validMapCoords(
	lat: number | null | undefined,
	lon: number | null | undefined
): boolean {
	return (
		lat != null &&
		lon != null &&
		Number.isFinite(lat) &&
		Number.isFinite(lon) &&
		Math.abs(lat) <= 90 &&
		Math.abs(lon) <= 180
	);
}
export function mapPlaceKey(row: MapLocation): string {
	const provider = row.routeProvider ?? 'unknown';
	if (row.areaExternalId) return JSON.stringify([provider, 'area', row.areaExternalId]);
	const name = (row.cragName ?? '').trim().toLowerCase();
	if (name && name !== 'unknown' && validMapCoords(row.lat, row.lon))
		return JSON.stringify([
			provider,
			'name',
			row.country?.trim().toLowerCase() ?? '',
			name,
			Math.round(row.lat! * 10) / 10,
			Math.round(row.lon! * 10) / 10
		]);
	return JSON.stringify([provider, 'route', row.routeExternalId ?? 'unknown']);
}
export type ClimbingPlace = {
	key: string;
	name: string;
	country: string | null;
	lat: number;
	lon: number;
	count: number;
	routes: number;
	firstDay: string | null;
	lastDay: string | null;
	href: string;
};
export function mapDay(raw: string | null): string | null {
	const day = weatherAscentDay(raw);
	return day?.startsWith('0000-') ? null : day;
}
export function wrapLongitude(lon: number): number {
	return ((((lon + 180) % 360) + 360) % 360) - 180;
}
/** Centre of the shortest arc containing all places, including across the date line. */
export function longitudeCentre(points: { lon: number }[]): number {
	if (!points.length) return 0;
	const values = points.map((p) => (p.lon + 360) % 360).sort((a, b) => a - b);
	let gap = -1,
		start = values[0],
		end = values[0];
	for (let i = 0; i < values.length; i++) {
		const next = i + 1 < values.length ? values[i + 1] : values[0] + 360;
		if (next - values[i] > gap) {
			gap = next - values[i];
			start = next;
			end = values[i] + 360;
		}
	}
	return wrapLongitude((start + end) / 2);
}
export function projectMapPoint(
	lat: number,
	lon: number,
	centre: number
): { x: number; y: number } {
	return { x: 500 + (wrapLongitude(lon - centre) / 360) * 1000, y: ((90 - lat) / 180) * 500 };
}
export type MapView = { x: number; y: number; width: number; height: number };
export function fitMapPlaces(points: ClimbingPlace[], centre: number): MapView {
	if (!points.length) return { x: 0, y: 0, width: 1000, height: 500 };
	const coords = points.map((p) => projectMapPoint(p.lat, p.lon, centre));
	const minX = Math.min(...coords.map((p) => p.x)),
		maxX = Math.max(...coords.map((p) => p.x)),
		minY = Math.min(...coords.map((p) => p.y)),
		maxY = Math.max(...coords.map((p) => p.y));
	const width = Math.min(1000, Math.max(80, (maxX - minX) * 1.4, (maxY - minY) * 2.8));
	return {
		x: (minX + maxX - width) / 2,
		y: Math.max(0, Math.min(500 - width / 2, (minY + maxY - width / 2) / 2)),
		width,
		height: width / 2
	};
}
/** Bin by a fixed projected grid at the current zoom; each place belongs to one cluster. */
export function clusterMapPlaces(points: ClimbingPlace[], view: MapView, centre: number) {
	const cell = view.width / 12;
	const groups = new Map<
		string,
		{ x: number; y: number; count: number; places: ClimbingPlace[] }
	>();
	for (const place of points) {
		const p = projectMapPoint(place.lat, place.lon, centre);
		if (p.x < view.x || p.x > view.x + view.width || p.y < view.y || p.y > view.y + view.height)
			continue;
		const key = `${Math.floor(p.x / cell)}:${Math.floor(p.y / cell)}`;
		const group = groups.get(key) ?? { x: 0, y: 0, count: 0, places: [] };
		group.x += p.x * place.count;
		group.y += p.y * place.count;
		group.count += place.count;
		group.places.push(place);
		groups.set(key, group);
	}
	return [...groups].map(([key, g]) => ({
		key,
		x: g.x / g.count,
		y: g.y / g.count,
		count: g.count,
		places: g.places
	}));
}
