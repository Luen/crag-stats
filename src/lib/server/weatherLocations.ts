import { createHash } from 'node:crypto';
import { desc, eq, sql } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import {
	routes,
	ascents,
	weatherLocations,
	weatherPlaceOverrides,
	weatherPlaceSearches
} from './db/schema';
import { extractLatLon } from './providers/thecrag/api';
import { isLikelyIndoorRoute } from './venue';
import type { WeatherLocation } from '#lib/weatherKeys';

type Route = typeof routes.$inferSelect;
function object(raw: unknown): Record<string, unknown> | null {
	return raw != null && typeof raw === 'object' && !Array.isArray(raw)
		? (raw as Record<string, unknown>)
		: null;
}
function parse(raw: string | null): unknown {
	try {
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}
export function weatherAreaKey(
	route: Pick<Route, 'provider' | 'externalId' | 'areaExternalId' | 'parentExternalId'>
): string {
	return JSON.stringify([
		route.provider,
		route.areaExternalId || route.parentExternalId ? 'area' : 'route',
		route.areaExternalId || route.parentExternalId || route.externalId
	]);
}
/** Reject non-point and malformed geometry rather than coercing arrays to zero. */
function point(raw: unknown): { lat: number; lon: number } | null {
	const o = object(raw);
	if (!o) return null;
	const primitive = (v: unknown) =>
		typeof v === 'number' || (typeof v === 'string' && v.trim() !== '');
	const fields = [
		'lat',
		'latitude',
		'Lat',
		'Latitude',
		'lon',
		'long',
		'longitude',
		'Lng',
		'Lon',
		'Longitude'
	];
	const direct = extractLatLon(
		Object.fromEntries(fields.map((k) => [k, primitive(o[k]) ? o[k] : undefined]))
	);
	if (direct) return direct;
	const g = object(o.geometry);
	if (g && g.type != null && g.type !== 'Point') return null;
	const c = Array.isArray(o.geometry) ? o.geometry : g?.coordinates;
	if (!Array.isArray(c) || c.length < 2 || !primitive(c[0]) || !primitive(c[1])) return null;
	return extractLatLon({ geometry: [c[0], c[1]] });
}

/** Only explicit route / immediate parent / TLC points. Broad and arbitrary ancestors are excluded. */
export function resolveWeatherLocation(raw: unknown, at: string): WeatherLocation | null {
	const route = object(raw);
	if (!route) return null;
	const directPoint = point(route);
	if (directPoint)
		return {
			...directPoint,
			source: 'route',
			name: String(route.name ?? 'Route'),
			areaId: null,
			precision: 'route point',
			resolvedAt: at
		};
	const ancestors = object(route.ancestors);
	if (!ancestors) return null;
	const country = object(ancestors.country);
	for (const [key, source] of [
		['parent', 'sector'],
		['TLC', 'crag']
	] as const) {
		const node = object(ancestors[key]);
		if (!node) continue;
		if (country && node.id != null && String(node.id) === String(country.id)) continue;
		if (
			/^(country|continent|state|province|region)$/i.test(String(node.type ?? node.areaType ?? ''))
		)
			continue;
		const p = point(node);
		if (p)
			return {
				...p,
				source,
				name: String(node.name ?? (key === 'TLC' ? 'Crag' : 'Sector')),
				areaId: node.id == null ? null : String(node.id),
				precision: 'area point',
				resolvedAt: at
			};
	}
	return null;
}
/** Cached metadata only. Private raw ascent payloads never leave this server module. */
export function loadWeatherLocations(): Map<number, WeatherLocation | null> {
	ensureSchema();
	const list = db.select().from(routes).all();
	const result = new Map<number, WeatherLocation | null>();
	const raws = db
		.select({ routeId: ascents.routeId, raw: ascents.rawJson })
		.from(ascents)
		.orderBy(desc(ascents.id))
		.all();
	const rawByRoute = new Map<number, string>();
	for (const r of raws)
		if (r.raw && !rawByRoute.has(r.routeId) && object(parse(r.raw))?.route)
			rawByRoute.set(r.routeId, r.raw);
	const cached = new Map(
		db
			.select()
			.from(weatherLocations)
			.all()
			.map((r) => [r.routeId, r])
	);
	const overrides = new Map(
		db
			.select()
			.from(weatherPlaceOverrides)
			.all()
			.map((r) => [r.areaKey, r])
	);
	db.transaction(() => {
		for (const route of list) {
			const raw = rawByRoute.get(route.id) ?? null;
			const override = overrides.get(weatherAreaKey(route));
			const signature = createHash('sha256')
				.update(
					JSON.stringify([
						route.updatedAt,
						route.name,
						route.gearStyle,
						route.tagsJson,
						route.cragName,
						route.areaExternalId,
						route.parentExternalId,
						route.lat,
						route.lon,
						route.routeApiJson,
						raw,
						override?.updatedAt,
						override?.locationJson
					])
				)
				.digest('hex');
			const old = cached.get(route.id);
			if (old?.signature === signature) {
				result.set(route.id, parse(old.locationJson) as WeatherLocation | null);
				continue;
			}
			const at = new Date().toISOString();
			let location: WeatherLocation | null = null;
			if (
				!isLikelyIndoorRoute({
					name: route.name,
					gearStyle: route.gearStyle,
					cragName: route.cragName,
					tagsJson: route.tagsJson
				})
			) {
				const api = object(parse(route.routeApiJson));
				const ascentRoute = object(object(parse(raw))?.route);
				// Compare both caches before falling back: an enriched route point must beat
				// a logbook payload that only carries its crag/sector point.
				const priority = { route: 0, sector: 1, crag: 2, cached: 3, place: 4 };
				location =
					[resolveWeatherLocation(ascentRoute, at), resolveWeatherLocation(api, at)]
						.filter((p): p is WeatherLocation => p != null)
						.sort((a, b) => priority[a.source] - priority[b.source])[0] ?? null;
				// A known upstream payload with country-only geometry must not fall back to a flattened legacy country point.
				if (!location && !ascentRoute && !api) {
					const p = point(route);
					if (p)
						location = {
							...p,
							source: 'cached',
							name: route.cragName ?? route.name,
							areaId: route.areaExternalId,
							precision: 'legacy cached point',
							resolvedAt: at
						};
				}
				if (!location && override)
					location = { ...(parse(override.locationJson) as WeatherLocation), resolvedAt: at };
			}
			result.set(route.id, location);
			db.insert(weatherLocations)
				.values({
					routeId: route.id,
					signature,
					locationJson: location ? JSON.stringify(location) : null,
					resolvedAt: at
				})
				.onConflictDoUpdate({
					target: weatherLocations.routeId,
					set: {
						signature,
						locationJson: location ? JSON.stringify(location) : null,
						resolvedAt: at
					}
				})
				.run();
		}
	});
	return result;
}
export function attachWeatherLocation<T extends { routeId: number }>(
	row: T,
	locations: ReadonlyMap<number, WeatherLocation | null>
): T & { weatherLocation: WeatherLocation | null } {
	return { ...row, weatherLocation: locations.get(row.routeId) ?? null };
}
export function listWeatherLocationGroups() {
	const locations = loadWeatherLocations();
	const groups = new Map<
		string,
		{
			key: string;
			name: string;
			country: string | null;
			routes: number;
			unresolved: number;
			source: string;
			override: WeatherLocation | null;
		}
	>();
	const overrides = new Map(
		db
			.select()
			.from(weatherPlaceOverrides)
			.all()
			.map((r) => [r.areaKey, parse(r.locationJson) as WeatherLocation])
	);
	for (const r of db.select().from(routes).all()) {
		if (
			isLikelyIndoorRoute({
				name: r.name,
				gearStyle: r.gearStyle,
				cragName: r.cragName,
				tagsJson: r.tagsJson
			})
		)
			continue;
		const key = weatherAreaKey(r);
		const location = locations.get(r.id);
		const g = groups.get(key) ?? {
			key,
			name: r.cragName ?? r.parentName ?? r.name,
			country: r.country,
			routes: 0,
			unresolved: 0,
			source: location?.source ?? 'unresolved',
			override: overrides.get(key) ?? null
		};
		g.routes++;
		if (!location) g.unresolved++;
		else if (location.source !== g.source) g.source = 'mixed';
		groups.set(key, g);
	}
	return [...groups.values()].sort(
		(a, b) => b.unresolved - a.unresolved || a.name.localeCompare(b.name)
	);
}
export type PlaceCandidate = {
	id: number;
	name: string;
	countryCode: string;
	country: string;
	admin: string;
	lat: number;
	lon: number;
	elevation: number | null;
};
let searching = false;
let generation = 0;
export function invalidateWeatherLocations() {
	generation++;
	searching = false;
}
export async function searchWeatherPlaces(
	query: string,
	countryCode: string,
	fetcher: typeof fetch = fetch,
	now = Date.now()
): Promise<{ queryKey: string; candidates: PlaceCandidate[] }> {
	ensureSchema();
	query = query.trim();
	countryCode = countryCode.trim().toUpperCase();
	if (query.length < 3 || query.length > 100 || !/^[A-Z]{2}$/.test(countryCode))
		throw new Error('Enter a place name (3–100 characters) and a two-letter country code.');
	const queryKey = JSON.stringify([query.toLowerCase(), countryCode]);
	const old = db
		.select()
		.from(weatherPlaceSearches)
		.where(eq(weatherPlaceSearches.queryKey, queryKey))
		.get();
	if (old && old.expiresAt > now) {
		if (old.error) throw new Error(old.error);
		return { queryKey, candidates: JSON.parse(old.resultsJson) };
	}
	const retry =
		db
			.select({ next: sql<number>`max(${weatherPlaceSearches.nextAllowedAt})` })
			.from(weatherPlaceSearches)
			.get()?.next ?? 0;
	if (searching || now < retry)
		throw new Error('Place lookup is cooling down. Please try again later.');
	db.delete(weatherPlaceSearches)
		.where(sql`${weatherPlaceSearches.expiresAt}<${now}`)
		.run();
	const count =
		db
			.select({ n: sql<number>`count(*)` })
			.from(weatherPlaceSearches)
			.get()?.n ?? 0;
	if (count >= 500)
		throw new Error(
			'Place-search cache is full. Try a cached search or wait for older searches to expire.'
		);
	searching = true;
	const run = generation;
	let retryAt = now + 3600000;
	try {
		const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
		url.search = new URLSearchParams({
			name: query,
			countryCode,
			count: '10',
			language: 'en'
		}).toString();
		const response = await fetcher(url, { signal: AbortSignal.timeout(10000), redirect: 'error' });
		if (!response.ok) {
			const raw = response.headers.get('retry-after');
			if (raw) {
				const parsed = /^\d+$/.test(raw) ? now + Number(raw) * 1000 : Date.parse(raw);
				if (Number.isFinite(parsed))
					retryAt = Math.min(now + 7 * 86400000, Math.max(retryAt, parsed));
			}
			throw new Error('Place lookup failed. Please try again later.');
		}
		const payload = await response.json();
		if (!payload || payload.error || typeof payload !== 'object')
			throw new Error('Invalid place response');
		if (run !== generation) throw new Error('Place lookup canceled by data wipe.');
		const candidates: PlaceCandidate[] = [];
		for (const raw of Array.isArray(payload.results) ? payload.results.slice(0, 10) : []) {
			const p = point(raw);
			if (
				!p ||
				!Number.isSafeInteger(raw.id) ||
				typeof raw.name !== 'string' ||
				typeof raw.feature_code !== 'string' ||
				!/^PPL/.test(raw.feature_code) ||
				String(raw.country_code).toUpperCase() !== countryCode
			)
				continue;
			candidates.push({
				id: raw.id,
				name: raw.name.slice(0, 200),
				countryCode,
				country: String(raw.country ?? countryCode).slice(0, 100),
				admin: [raw.admin1, raw.admin2]
					.filter((v) => typeof v === 'string')
					.join(' / ')
					.slice(0, 300),
				...p,
				elevation:
					typeof raw.elevation === 'number' && Number.isFinite(raw.elevation) ? raw.elevation : null
			});
		}
		db.insert(weatherPlaceSearches)
			.values({
				queryKey,
				resultsJson: JSON.stringify(candidates),
				expiresAt: now + 30 * 86400000,
				nextAllowedAt: now + 1100,
				error: null
			})
			.onConflictDoUpdate({
				target: weatherPlaceSearches.queryKey,
				set: {
					resultsJson: JSON.stringify(candidates),
					expiresAt: now + 30 * 86400000,
					nextAllowedAt: now + 1100,
					error: null
				}
			})
			.run();
		return { queryKey, candidates };
	} catch {
		if (run !== generation) throw new Error('Place lookup canceled by data wipe.');
		const message = 'Place lookup failed. Try again after ' + new Date(retryAt).toISOString() + '.';
		db.insert(weatherPlaceSearches)
			.values({
				queryKey,
				resultsJson: '[]',
				expiresAt: retryAt,
				nextAllowedAt: retryAt,
				error: message
			})
			.onConflictDoUpdate({
				target: weatherPlaceSearches.queryKey,
				set: {
					resultsJson: '[]',
					expiresAt: retryAt,
					nextAllowedAt: retryAt,
					error: message
				}
			})
			.run();
		throw new Error(message);
	} finally {
		if (run === generation) searching = false;
	}
}
export function chooseWeatherPlace(areaKey: string, queryKey: string, id: number) {
	if (!listWeatherLocationGroups().some((g) => g.key === areaKey))
		throw new Error('Unknown climbing area.');
	const cached = db
		.select()
		.from(weatherPlaceSearches)
		.where(eq(weatherPlaceSearches.queryKey, queryKey))
		.get();
	if (!cached || cached.error || cached.expiresAt < Date.now())
		throw new Error('Search results have expired. Search again.');
	const place = (JSON.parse(cached.resultsJson) as PlaceCandidate[]).find((p) => p.id === id);
	if (!place) throw new Error('Unknown place.');
	const at = new Date().toISOString();
	const location: WeatherLocation = {
		lat: place.lat,
		lon: place.lon,
		name: `${place.name}, ${place.admin ? place.admin + ', ' : ''}${place.country}`,
		source: 'place',
		areaId: String(place.id),
		precision: 'owner-confirmed settlement',
		resolvedAt: at
	};
	db.insert(weatherPlaceOverrides)
		.values({ areaKey, locationJson: JSON.stringify(location), updatedAt: at })
		.onConflictDoUpdate({
			target: weatherPlaceOverrides.areaKey,
			set: { locationJson: JSON.stringify(location), updatedAt: at }
		})
		.run();
}
export function clearWeatherPlace(areaKey: string) {
	db.delete(weatherPlaceOverrides).where(eq(weatherPlaceOverrides.areaKey, areaKey)).run();
}
