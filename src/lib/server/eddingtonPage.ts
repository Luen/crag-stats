import { eq } from 'drizzle-orm';
import { usesVScale } from '#lib/grades';
import type {
	EddingtonMilestoneTable,
	EddingtonStats,
	EddingtonTimelinePoint
} from '#lib/types/dashboard';
import { db, ensureSchema } from './db';
import { ascents, routes } from './db/schema';
import {
	buildEddington,
	buildEddingtonMilestoneTables,
	buildEddingtonTimeline,
	type EddingtonRow
} from './eddington';

function validDay(iso: string | null | undefined): string | null {
	const d = (iso || '').slice(0, 10);
	const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return null;
	const year = Number(m[1]);
	const month = Number(m[2]);
	const day = Number(m[3]);
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;
	const dt = new Date(`${d}T12:00:00`);
	if (Number.isNaN(dt.getTime())) return null;
	if (dt.getFullYear() !== year || dt.getMonth() + 1 !== month || dt.getDate() !== day) return null;
	return d;
}

function effectiveScore(row: {
	effectiveGradeScore: number | null;
	gradeScore: number | null;
}): number | null {
	return row.effectiveGradeScore ?? row.gradeScore;
}

function vScale(row: { gradeSystem?: string | null; gearStyle: string | null }): boolean {
	return usesVScale(row.gradeSystem, row.gearStyle);
}

export function listEddingtonRows(): EddingtonRow[] {
	ensureSchema();
	const joined = db
		.select({
			ascentDate: ascents.ascentDate,
			routeId: ascents.routeId,
			isSend: ascents.isSend,
			heightM: ascents.heightM,
			routeHeightM: routes.heightM,
			effectiveGradeScore: ascents.effectiveGradeScore,
			gradeScore: routes.gradeScore,
			gradeSystem: routes.gradeSystem,
			gearStyle: routes.gearStyle
		})
		.from(ascents)
		.innerJoin(routes, eq(ascents.routeId, routes.id))
		.all();

	return joined.map((r) => ({
		day: validDay(r.ascentDate),
		routeId: r.routeId,
		isSend: Boolean(r.isSend),
		heightM: r.heightM ?? r.routeHeightM ?? 0,
		score: effectiveScore(r),
		isBoulder: vScale(r)
	}));
}

export type EddingtonPageData = {
	stats: EddingtonStats;
	timeline: EddingtonTimelinePoint[];
	milestones: EddingtonMilestoneTable[];
};

export function getEddingtonPageData(): EddingtonPageData {
	const rows = listEddingtonRows();
	return {
		stats: buildEddington(rows),
		timeline: buildEddingtonTimeline(rows),
		milestones: buildEddingtonMilestoneTables(rows)
	};
}
