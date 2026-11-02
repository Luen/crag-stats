/** Area lookups share the opted-in route import's session, budget, pacing and backoff. */
import { and, desc, eq, sql } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { ascents, routes, weatherAreaCache } from './db/schema';
import { areaId, routeAreas, record, climbingArea } from './providers/thecrag/areaAncestors';
import { resolveWeatherLocation } from './weatherLocations';
import { isLikelyIndoorRoute } from './venue';
import type { RouteWithHistory } from './providers/thecrag/routeHistoryApi';

export function pendingWeatherAreaIds(limit: number, refreshDays = 0, now = Date.now()): string[] {
	ensureSchema();
	const checked = new Map(
		db
			.select()
			.from(weatherAreaCache)
			.where(eq(weatherAreaCache.provider, 'thecrag'))
			.all()
			.map((r) => [r.areaExternalId, r.fetchedAt])
	);
	const ids = new Set<string>();
	const ascentRoutes = new Map<number, unknown>();
	for (const ascent of db
		.select({ routeId: ascents.routeId, rawJson: ascents.rawJson })
		.from(ascents)
		.orderBy(desc(ascents.id))
		.all()) {
		if (ascentRoutes.has(ascent.routeId)) continue;
		try {
			const route = record(JSON.parse(ascent.rawJson ?? 'null'))?.route;
			if (route) ascentRoutes.set(ascent.routeId, route);
		} catch {
			/* Malformed legacy cache does not establish a location. */
		}
	}
	const cutoff = new Date(now - refreshDays * 86400000).toISOString();
	for (const route of db
		.select()
		.from(routes)
		.where(
			and(
				eq(routes.provider, 'thecrag'),
				sql`EXISTS (SELECT 1 FROM ascents a WHERE a.route_id = ${routes.id})`
			)
		)
		.all()) {
		if (
			isLikelyIndoorRoute({
				name: route.name,
				gearStyle: route.gearStyle,
				cragName: route.cragName,
				tagsJson: route.tagsJson
			})
		)
			continue;
		let raw: unknown;
		try {
			raw = JSON.parse(route.routeApiJson ?? 'null');
		} catch {
			continue;
		}
		const sources = [raw, ascentRoutes.get(route.id)];
		if (sources.some((source) => resolveWeatherLocation(source, ''))) continue;
		for (const node of sources.flatMap((source) => Object.values(routeAreas(source)))) {
			const id = areaId(node?.id);
			// Real provider IDs are positive integers; never interpolate arbitrary cache data into a URL.
			if (!id || !/^[1-9]\d*$/.test(id)) continue;
			const at = checked.get(id);
			if (!at || (refreshDays > 0 && at <= cutoff)) ids.add(id);
		}
	}
	return [...ids].slice(0, limit);
}

export function storeWeatherAreas(
	requested: readonly string[],
	payload: readonly RouteWithHistory[],
	at: string
) {
	const answers = new Map(payload.map((r) => [r.id, r.rawJson ?? null]));
	db.transaction(() => {
		for (const id of requested) {
			const rawJson = answers.get(id) ?? null;
			// Cache only matching area objects. Missing/empty answers are recorded too.
			const raw = rawJson ? record(JSON.parse(rawJson)) : null;
			const values = {
				rawJson:
					raw && areaId(raw.id) === id && climbingArea(raw) && raw.type !== 'route'
						? rawJson
						: null,
				fetchedAt: at
			};
			db.insert(weatherAreaCache)
				.values({ provider: 'thecrag', areaExternalId: id, ...values })
				.onConflictDoUpdate({
					target: [weatherAreaCache.provider, weatherAreaCache.areaExternalId],
					set: values
				})
				.run();
		}
	});
}
