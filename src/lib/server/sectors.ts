import { eq, sql } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { ascents, routes } from './db/schema';

export type SectorNode = {
	name: string;
	routeCount: number;
	ascentCount: number;
};

export type CragSectorGroup = {
	cragName: string;
	routeCount: number;
	ascentCount: number;
	sectors: SectorNode[];
};

export type CragMapPoint = {
	crag: string;
	lat: number;
	lon: number;
	count: number;
};

/** Group climbed routes by crag → sector (parentName). */
export function listSectors(): CragSectorGroup[] {
	ensureSchema();
	const rows = db
		.select({
			cragName: routes.cragName,
			parentName: routes.parentName,
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
		sectors: Map<string, { routeIds: Set<number>; ascentCount: number }>;
	};
	const byCrag = new Map<string, Agg>();

	for (const r of rows) {
		const crag = (r.cragName || 'Unknown').trim() || 'Unknown';
		const sector = (r.parentName || 'General').trim() || 'General';
		const ascentsN = Number(r.ascentCount) || 0;
		let agg = byCrag.get(crag);
		if (!agg) {
			agg = { routeIds: new Set(), ascentCount: 0, sectors: new Map() };
			byCrag.set(crag, agg);
		}
		agg.routeIds.add(r.routeId);
		agg.ascentCount += ascentsN;
		let sec = agg.sectors.get(sector);
		if (!sec) {
			sec = { routeIds: new Set(), ascentCount: 0 };
			agg.sectors.set(sector, sec);
		}
		sec.routeIds.add(r.routeId);
		sec.ascentCount += ascentsN;
	}

	return [...byCrag.entries()]
		.map(([cragName, agg]) => ({
			cragName,
			routeCount: agg.routeIds.size,
			ascentCount: agg.ascentCount,
			sectors: [...agg.sectors.entries()]
				.map(([name, s]) => ({
					name,
					routeCount: s.routeIds.size,
					ascentCount: s.ascentCount
				}))
				.sort((a, b) => b.ascentCount - a.ascentCount || a.name.localeCompare(b.name))
		}))
		.sort((a, b) => b.ascentCount - a.ascentCount || a.cragName.localeCompare(b.cragName));
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
