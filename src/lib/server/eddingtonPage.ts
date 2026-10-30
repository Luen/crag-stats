import { calendarDay as validDay } from '#lib/calendarDay';
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
