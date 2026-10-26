import { desc, eq, sql } from 'drizzle-orm';
import { bandById, GRADE_BANDS } from '#lib/grades';
import { db, ensureSchema } from './db';
import { ascents, profiles, routes } from './db/schema';

export type DashboardStats = {
	profileName: string | null;
	totalAscents: number;
	totalSends: number;
	totalAttempts: number;
	heightM: number;
	distinctRoutes: number;
	distinctCrags: number;
	tickBreakdown: { tick: string; count: number }[];
	styleBreakdown: { style: string; count: number }[];
	topCrags: { crag: string; count: number; maxGrade: string | null; maxBand: number | null }[];
	volumeByMonth: { month: string; count: number; sends: number }[];
	gradePyramid: { grade: string; score: number; band: number | null; count: number; color: string }[];
	bandBreakdown: { band: number; name: string; count: number; color: string }[];
	hardestSends: {
		routeName: string;
		gradeRaw: string | null;
		gradeBand: number | null;
		tickType: string | null;
		ascentDate: string | null;
		cragName: string | null;
		url: string | null;
	}[];
	heatmap: { date: string; count: number }[];
	recent: {
		id: number;
		routeName: string;
		gradeRaw: string | null;
		gradeBand: number | null;
		tickType: string | null;
		ascentDate: string | null;
		cragName: string | null;
		isSend: boolean;
		isAttempt: boolean;
		url: string | null;
	}[];
};

function dateKey(iso: string | null | undefined): string | null {
	if (!iso) return null;
	return iso.slice(0, 10);
}

function monthKey(iso: string | null | undefined): string | null {
	if (!iso) return null;
	return iso.slice(0, 7);
}

export function getDashboardStats(): DashboardStats {
	ensureSchema();

	const profile = db.select().from(profiles).limit(1).get();
	const all = db
		.select({
			id: ascents.id,
			ascentDate: ascents.ascentDate,
			tickType: ascents.tickType,
			isSend: ascents.isSend,
			isAttempt: ascents.isAttempt,
			heightM: ascents.heightM,
			routeId: routes.id,
			routeName: routes.name,
			gradeRaw: routes.gradeRaw,
			gradeScore: routes.gradeScore,
			gradeBand: routes.gradeBand,
			gearStyle: routes.gearStyle,
			cragName: routes.cragName,
			url: routes.url,
			routeHeightM: routes.heightM
		})
		.from(ascents)
		.innerJoin(routes, eq(ascents.routeId, routes.id))
		.all();

	const tickMap = new Map<string, number>();
	const styleMap = new Map<string, number>();
	const cragMap = new Map<string, { count: number; maxScore: number; maxGrade: string | null; maxBand: number | null }>();
	const monthMap = new Map<string, { count: number; sends: number }>();
	const pyramidMap = new Map<number, { grade: string; band: number | null; count: number }>();
	const bandMap = new Map<number, number>();
	const heatMap = new Map<string, number>();
	const routeSet = new Set<number>();
	let heightM = 0;
	let sends = 0;
	let attempts = 0;

	for (const row of all) {
		routeSet.add(row.routeId);
		const tick = row.tickType || 'Unknown';
		tickMap.set(tick, (tickMap.get(tick) ?? 0) + 1);
		const style = row.gearStyle || 'Unknown';
		styleMap.set(style, (styleMap.get(style) ?? 0) + 1);

		const h = row.heightM ?? row.routeHeightM ?? 0;
		if (h) heightM += h;
		if (row.isSend) sends += 1;
		if (row.isAttempt) attempts += 1;

		const crag = row.cragName || 'Unknown';
		const prev = cragMap.get(crag) ?? { count: 0, maxScore: -Infinity, maxGrade: null, maxBand: null };
		prev.count += 1;
		const score = row.gradeScore ?? -Infinity;
		if (score > prev.maxScore) {
			prev.maxScore = score;
			prev.maxGrade = row.gradeRaw;
			prev.maxBand = row.gradeBand;
		}
		cragMap.set(crag, prev);

		const month = monthKey(row.ascentDate);
		if (month) {
			const m = monthMap.get(month) ?? { count: 0, sends: 0 };
			m.count += 1;
			if (row.isSend) m.sends += 1;
			monthMap.set(month, m);
		}

		const day = dateKey(row.ascentDate);
		if (day) heatMap.set(day, (heatMap.get(day) ?? 0) + 1);

		if (row.isSend && row.gradeScore != null) {
			const key = Math.round(row.gradeScore);
			const p = pyramidMap.get(key) ?? {
				grade: row.gradeRaw || String(key),
				band: row.gradeBand,
				count: 0
			};
			p.count += 1;
			pyramidMap.set(key, p);
		}

		if (row.gradeBand && row.isSend) {
			bandMap.set(row.gradeBand, (bandMap.get(row.gradeBand) ?? 0) + 1);
		}
	}

	const hardestSends = all
		.filter((r) => r.isSend && r.gradeScore != null)
		.sort((a, b) => (b.gradeScore ?? 0) - (a.gradeScore ?? 0))
		.slice(0, 10)
		.map((r) => ({
			routeName: r.routeName,
			gradeRaw: r.gradeRaw,
			gradeBand: r.gradeBand,
			tickType: r.tickType,
			ascentDate: r.ascentDate,
			cragName: r.cragName,
			url: r.url
		}));

	const recent = [...all]
		.sort((a, b) => (b.ascentDate || '').localeCompare(a.ascentDate || ''))
		.slice(0, 20)
		.map((r) => ({
			id: r.id,
			routeName: r.routeName,
			gradeRaw: r.gradeRaw,
			gradeBand: r.gradeBand,
			tickType: r.tickType,
			ascentDate: r.ascentDate,
			cragName: r.cragName,
			isSend: r.isSend,
			isAttempt: r.isAttempt,
			url: r.url
		}));

	return {
		profileName: profile?.name ?? null,
		totalAscents: all.length,
		totalSends: sends,
		totalAttempts: attempts,
		heightM: Math.round(heightM),
		distinctRoutes: routeSet.size,
		distinctCrags: cragMap.size,
		tickBreakdown: [...tickMap.entries()]
			.map(([tick, count]) => ({ tick, count }))
			.sort((a, b) => b.count - a.count),
		styleBreakdown: [...styleMap.entries()]
			.map(([style, count]) => ({ style, count }))
			.sort((a, b) => b.count - a.count),
		topCrags: [...cragMap.entries()]
			.map(([crag, v]) => ({
				crag,
				count: v.count,
				maxGrade: v.maxGrade,
				maxBand: v.maxBand
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 12),
		volumeByMonth: [...monthMap.entries()]
			.map(([month, v]) => ({ month, ...v }))
			.sort((a, b) => a.month.localeCompare(b.month))
			.slice(-24),
		gradePyramid: [...pyramidMap.entries()]
			.map(([score, v]) => {
				const band = bandById(v.band ?? 0);
				return {
					grade: v.grade,
					score,
					band: v.band,
					count: v.count,
					color: band?.color ?? '#888'
				};
			})
			.sort((a, b) => a.score - b.score),
		bandBreakdown: GRADE_BANDS.map((b) => ({
			band: b.id,
			name: b.name,
			count: bandMap.get(b.id) ?? 0,
			color: b.color
		})),
		hardestSends,
		heatmap: [...heatMap.entries()]
			.map(([date, count]) => ({ date, count }))
			.sort((a, b) => a.date.localeCompare(b.date)),
		recent
	};
}

export function listLogbook(filters?: {
	q?: string;
	style?: string;
	tick?: string;
	limit?: number;
	offset?: number;
}) {
	ensureSchema();
	const limit = filters?.limit ?? 100;
	const offset = filters?.offset ?? 0;

	let rows = db
		.select({
			id: ascents.id,
			ascentDate: ascents.ascentDate,
			tickType: ascents.tickType,
			isSend: ascents.isSend,
			isAttempt: ascents.isAttempt,
			partners: ascents.partners,
			comment: ascents.comment,
			quality: ascents.quality,
			ascentGearStyle: ascents.ascentGearStyle,
			routeName: routes.name,
			gradeRaw: routes.gradeRaw,
			gradeBand: routes.gradeBand,
			gradeScore: routes.gradeScore,
			gearStyle: routes.gearStyle,
			cragName: routes.cragName,
			cragPath: routes.cragPath,
			country: routes.country,
			heightM: routes.heightM,
			url: routes.url,
			stars: routes.stars
		})
		.from(ascents)
		.innerJoin(routes, eq(ascents.routeId, routes.id))
		.orderBy(desc(ascents.ascentDate))
		.all();

	if (filters?.style) {
		const s = filters.style.toLowerCase();
		rows = rows.filter((r) => (r.gearStyle || '').toLowerCase() === s);
	}
	if (filters?.tick) {
		const t = filters.tick.toLowerCase();
		rows = rows.filter((r) => (r.tickType || '').toLowerCase() === t);
	}
	if (filters?.q) {
		const q = filters.q.toLowerCase();
		rows = rows.filter(
			(r) =>
				r.routeName.toLowerCase().includes(q) ||
				(r.cragName || '').toLowerCase().includes(q) ||
				(r.comment || '').toLowerCase().includes(q)
		);
	}

	const total = rows.length;
	return { total, rows: rows.slice(offset, offset + limit) };
}

export function wipeAllData() {
	ensureSchema();
	db.run(sql`DELETE FROM projects`);
	db.run(sql`DELETE FROM goals`);
	db.run(sql`DELETE FROM ascents`);
	db.run(sql`DELETE FROM routes`);
	db.run(sql`DELETE FROM profiles`);
	db.run(sql`DELETE FROM sync_state`);
}
