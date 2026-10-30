import { loadWeatherLocations, attachWeatherLocation } from './weatherLocations';
import { ascentWeatherKey } from '#lib/weatherKeys';
import { eq, sql } from 'drizzle-orm';
import type { CragSectorGroup } from '#lib/types/sectors';
import { db, ensureSchema } from './db';
import { ascents, routes } from './db/schema';
import { buildVisitClimate, type VisitClimate } from '#lib/visitClimate';
import { weatherAscentDay, type WeatherSnapshot } from '#lib/weatherKeys';
import { logbookRowWeather } from './logbookWeather';
import { loadWeatherSnapshotMap } from './weatherEngine';
import {
	ancestorAreaNames,
	gearStyleMismatch,
	insertSectorPath,
	parseAncestorsJson,
	pitchCountFromJson,
	sectorPathUnderCrag,
	sectorTreeHasDepth,
	treeNodeToSectorNode,
	type SectorTreeNode
} from './sectorsTree';

export type { CragSectorGroup, SectorNode } from '#lib/types/sectors';

export type CragMapPoint = {
	crag: string;
	lat: number;
	lon: number;
	count: number;
};

/**
 * Cached weather on the distinct days (per rounded location) you climbed at each crag.
 * Empty map when the weather cache is empty or a crag has fewer than 5 such days (#278).
 */
export function listVisitClimateByCrag(): Map<string, VisitClimate> {
	ensureSchema();
	const weatherByKey = loadWeatherSnapshotMap();
	const out = new Map<string, VisitClimate>();
	if (weatherByKey.size === 0) return out;
	const locations = loadWeatherLocations();
	const rows = db
		.select({
			ascentDate: ascents.ascentDate,
			routeId: ascents.routeId,
			lat: routes.lat,
			lon: routes.lon,
			gearStyle: routes.gearStyle,
			routeName: routes.name,
			cragName: routes.cragName,
			tagsJson: routes.tagsJson
		})
		.from(ascents)
		.innerJoin(routes, eq(ascents.routeId, routes.id))
		.all()
		.map((r) => attachWeatherLocation(r, locations));
	const byCrag = new Map<string, Map<string, WeatherSnapshot>>();
	for (const r of rows) {
		const day = weatherAscentDay(r.ascentDate);
		const key = ascentWeatherKey(r);
		if (!day || !key) continue;
		const w = logbookRowWeather(weatherByKey, r);
		if (!w) continue;
		const crag = (r.cragName || 'Unknown').trim() || 'Unknown';
		const days = byCrag.get(crag) ?? new Map<string, WeatherSnapshot>();
		days.set(key, w);
		byCrag.set(crag, days);
	}
	for (const [crag, days] of byCrag) {
		const climate = buildVisitClimate([...days.values()]);
		if (climate) out.set(crag, climate);
	}
	return out;
}

/** Group climbed routes by crag → sector tree (parentName, or ancestors when cached). */
export function listSectors(): CragSectorGroup[] {
	ensureSchema();
	const rows = db
		.select({
			cragName: routes.cragName,
			parentName: routes.parentName,
			gearStyle: routes.gearStyle,
			ancestorsJson: routes.ancestorsJson,
			pitchesJson: routes.pitchesJson,
			flagsJson: routes.flagsJson,
			routeId: routes.id,
			ascentCount: sql<number>`count(${ascents.id})`
		})
		.from(routes)
		.innerJoin(ascents, eq(ascents.routeId, routes.id))
		.groupBy(routes.id)
		.all();

	type Agg = {
		routeIds: Set<number>;
		ascentCount: number;
		usedAncestorPaths: boolean;
		sectors: Map<string, SectorTreeNode>;
	};
	const byCrag = new Map<string, Agg>();

	for (const r of rows) {
		const crag = (r.cragName || 'Unknown').trim() || 'Unknown';
		const ascentsN = Number(r.ascentCount) || 0;
		let agg = byCrag.get(crag);
		if (!agg) {
			agg = {
				routeIds: new Set(),
				ascentCount: 0,
				usedAncestorPaths: false,
				sectors: new Map()
			};
			byCrag.set(crag, agg);
		}
		agg.routeIds.add(r.routeId);
		agg.ascentCount += ascentsN;

		const { segments, usedAncestors } = sectorPathUnderCrag({
			ancestorsJson: r.ancestorsJson,
			cragName: crag,
			parentName: r.parentName
		});
		if (usedAncestors) agg.usedAncestorPaths = true;

		insertSectorPath(agg.sectors, segments, r.routeId, ascentsN, {
			multipitch: pitchCountFromJson(r.pitchesJson) >= 2,
			styleMismatch: gearStyleMismatch(r.gearStyle, r.flagsJson)
		});
	}

	const climateByCrag = listVisitClimateByCrag();
	return [...byCrag.entries()]
		.map(([cragName, agg]) => {
			const sectors = [...agg.sectors.values()]
				.map(treeNodeToSectorNode)
				.sort((a, b) => b.ascentCount - a.ascentCount || a.name.localeCompare(b.name));
			const hasAreaTree = agg.usedAncestorPaths && sectorTreeHasDepth(sectors);
			const areaBreadcrumb = agg.usedAncestorPaths
				? buildCragBreadcrumb(rows, cragName)
				: undefined;
			return {
				cragName,
				routeCount: agg.routeIds.size,
				ascentCount: agg.ascentCount,
				areaBreadcrumb,
				hasAreaTree,
				sectors,
				visitClimate: climateByCrag.get(cragName) ?? null
			};
		})
		.sort((a, b) => b.ascentCount - a.ascentCount || a.cragName.localeCompare(b.cragName));
}

function buildCragBreadcrumb(
	rows: {
		cragName: string | null;
		ancestorsJson: string | null;
	}[],
	cragName: string
): string | undefined {
	for (const r of rows) {
		if ((r.cragName || '').trim() !== cragName) continue;
		if (!r.ancestorsJson?.trim()) continue;
		const names = ancestorAreaNames(parseAncestorsJson(r.ancestorsJson));
		const idx = names.findIndex(
			(n) => n.localeCompare(cragName, undefined, { sensitivity: 'accent' }) === 0
		);
		if (idx > 0) return names.slice(0, idx).join(' → ');
	}
	return undefined;
}

/** Average lat/lon per crag weighted by route volume (ascent counts). */
export function listCragMapPoints(): CragMapPoint[] {
	ensureSchema();
	const rows = db
		.select({
			cragName: routes.cragName,
			lat: routes.lat,
			lon: routes.lon,
			ascentCount: sql<number>`count(${ascents.id})`
		})
		.from(routes)
		.innerJoin(ascents, eq(ascents.routeId, routes.id))
		.where(sql`${routes.lat} IS NOT NULL AND ${routes.lon} IS NOT NULL`)
		.groupBy(routes.id)
		.all();

	const agg = new Map<string, { latSum: number; lonSum: number; weight: number; count: number }>();
	for (const r of rows) {
		if (r.lat == null || r.lon == null) continue;
		const crag = (r.cragName || 'Unknown').trim() || 'Unknown';
		const w = Math.max(1, Number(r.ascentCount) || 1);
		const cur = agg.get(crag) ?? { latSum: 0, lonSum: 0, weight: 0, count: 0 };
		cur.latSum += r.lat * w;
		cur.lonSum += r.lon * w;
		cur.weight += w;
		cur.count += Number(r.ascentCount) || 0;
		agg.set(crag, cur);
	}

	return [...agg.entries()]
		.map(([crag, v]) => ({
			crag,
			lat: v.latSum / v.weight,
			lon: v.lonSum / v.weight,
			count: v.count
		}))
		.sort((a, b) => b.count - a.count);
}
