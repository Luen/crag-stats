import { calendarDay as validDay } from '#lib/calendarDay';
import { eq } from 'drizzle-orm';
import { theCragAscentUrl } from '#lib/thecragUrls';
import { tickKind } from '#lib/ticks';
import { db, ensureSchema } from './db';
import { ascents, routes } from './db/schema';

export type RewindYearSummary = {
	year: number;
	ascents: number;
	sends: number;
	onsights: number;
	heightM: number;
	heightKm: number;
	topCrags: { crag: string; count: number }[];
	hardestSend: {
		name: string;
		gradeRaw: string | null;
		cragName: string | null;
		ascentDate: string | null;
		href: string | null;
		score: number;
	} | null;
};

export function listRewindYears(): number[] {
	ensureSchema();
	const rows = db.select({ ascentDate: ascents.ascentDate }).from(ascents).all();
	const years = new Set<number>();
	for (const r of rows) {
		const day = validDay(r.ascentDate);
		if (!day) continue;
		years.add(Number(day.slice(0, 4)));
	}
	return [...years].sort((a, b) => b - a);
}

export function getRewindSummary(year: number): RewindYearSummary {
	ensureSchema();
	const joined = db
		.select({
			ascentDate: ascents.ascentDate,
			tickType: ascents.tickType,
			isSend: ascents.isSend,
			heightM: ascents.heightM,
			effectiveGradeRaw: ascents.effectiveGradeRaw,
			effectiveGradeScore: ascents.effectiveGradeScore,
			ascentLabel: ascents.ascentLabel,
			ascentUrl: ascents.ascentUrl,
			externalId: ascents.externalId,
			routeName: routes.name,
			cragName: routes.cragName,
			routeGradeRaw: routes.gradeRaw,
			routeUrl: routes.url
		})
		.from(ascents)
		.innerJoin(routes, eq(ascents.routeId, routes.id))
		.all();

	const cragMap = new Map<string, number>();
	let ascentCount = 0;
	let sends = 0;
	let onsights = 0;
	let heightM = 0;
	let hardest: RewindYearSummary['hardestSend'] = null;

	for (const r of joined) {
		const day = validDay(r.ascentDate);
		if (!day || Number(day.slice(0, 4)) !== year) continue;
		ascentCount += 1;
		if (r.isSend) sends += 1;
		if (tickKind(r.tickType) === 'onsight') onsights += 1;
		if (r.heightM != null && Number.isFinite(r.heightM)) heightM += r.heightM;

		const crag = (r.cragName || 'Unknown').trim() || 'Unknown';
		cragMap.set(crag, (cragMap.get(crag) ?? 0) + 1);

		const score = r.effectiveGradeScore;
		if (r.isSend && score != null && Number.isFinite(score)) {
			if (!hardest || score > hardest.score) {
				hardest = {
					name: r.ascentLabel?.trim() || r.routeName,
					gradeRaw: r.effectiveGradeRaw ?? r.routeGradeRaw,
					cragName: r.cragName,
					ascentDate: day,
					href: r.ascentUrl || theCragAscentUrl(r.externalId) || r.routeUrl,
					score
				};
			}
		}
	}

	return {
		year,
		ascents: ascentCount,
		sends,
		onsights,
		heightM: Math.round(heightM),
		heightKm: Math.round((heightM / 1000) * 10) / 10,
		topCrags: [...cragMap.entries()]
			.map(([crag, count]) => ({ crag, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 8),
		hardestSend: hardest
	};
}
