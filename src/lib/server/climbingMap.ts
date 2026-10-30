import { eq } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { ascents, routes } from './db/schema';
import { isLikelyIndoorRoute } from './venue';
import { matchesClimbStyle } from '#lib/climbStyle';
import { mapDay, mapPlaceKey, validMapCoords, type ClimbingPlace } from '#lib/climbingMap';
export type MapFilters = {
	from: string;
	to: string;
	style: string;
	venue: 'all' | 'outdoor' | 'indoor';
};
export function readMapFilters(params: URLSearchParams): MapFilters {
	const venue = params.get('venue');
	return {
		from: mapDay(params.get('from')) ?? '',
		to: mapDay(params.get('to')) ?? '',
		style: (params.get('style') ?? '').slice(0, 100),
		venue: venue === 'outdoor' || venue === 'indoor' ? venue : 'all'
	};
}
export function listClimbingMap(filters: MapFilters) {
	ensureSchema();
	const rows = db
		.select({
			id: ascents.id,
			date: ascents.ascentDate,
			ascentGearStyle: ascents.ascentGearStyle,
			routeProvider: routes.provider,
			routeExternalId: routes.externalId,
			areaExternalId: routes.areaExternalId,
			name: routes.name,
			cragName: routes.cragName,
			country: routes.country,
			gearStyle: routes.gearStyle,
			tagsJson: routes.tagsJson,
			lat: routes.lat,
			lon: routes.lon
		})
		.from(ascents)
		.leftJoin(routes, eq(ascents.routeId, routes.id))
		.all();
	let total = 0,
		missing = 0;
	const groups = new Map<
		string,
		{ place: ClimbingPlace; routes: Set<string>; latSum: number; sin: number; cos: number }
	>();
	const query = new URLSearchParams();
	if (filters.from) query.set('from', filters.from);
	if (filters.to) query.set('to', filters.to);
	if (filters.style) query.set('style', filters.style);
	query.set('mapVenue', filters.venue);
	for (const row of rows) {
		const day = mapDay(row.date);
		if (
			(filters.from && (!day || day < filters.from)) ||
			(filters.to && (!day || day > filters.to))
		)
			continue;
		if (
			filters.style &&
			!matchesClimbStyle(row.ascentGearStyle, filters.style) &&
			!matchesClimbStyle(row.gearStyle, filters.style)
		)
			continue;
		const indoor = isLikelyIndoorRoute({
			name: row.name,
			gearStyle: row.gearStyle,
			cragName: row.cragName,
			tagsJson: row.tagsJson
		});
		if ((filters.venue === 'outdoor' && indoor) || (filters.venue === 'indoor' && !indoor))
			continue;
		total++;
		if (!validMapCoords(row.lat, row.lon)) {
			missing++;
			continue;
		}
		const key = mapPlaceKey(row);
		query.set('place', key);
		const g = groups.get(key) ?? {
			place: {
				key,
				name: row.cragName?.trim() || row.name || 'Unknown place',
				country: row.country,
				lat: 0,
				lon: 0,
				count: 0,
				routes: 0,
				firstDay: null,
				lastDay: null,
				href: `/logbook?${query}`
			},
			routes: new Set<string>(),
			latSum: 0,
			sin: 0,
			cos: 0
		};
		g.place.count++;
		g.routes.add(`${row.routeProvider}:${row.routeExternalId}`);
		g.latSum += row.lat!;
		g.sin += Math.sin((row.lon! * Math.PI) / 180);
		g.cos += Math.cos((row.lon! * Math.PI) / 180);
		if (day) {
			if (!g.place.firstDay || day < g.place.firstDay) g.place.firstDay = day;
			if (!g.place.lastDay || day > g.place.lastDay) g.place.lastDay = day;
		}
		groups.set(key, g);
	}
	const places = [...groups.values()]
		.map((g) => ({
			...g.place,
			lat: g.latSum / g.place.count,
			lon: (Math.atan2(g.sin, g.cos) * 180) / Math.PI,
			routes: g.routes.size
		}))
		.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
	return { places, total, missing, mapped: total - missing };
}
