import { eq } from 'drizzle-orm';
import { calendarDay } from '#lib/calendarDay';
import { formatClimbGrade } from '#lib/grades';
import { isTickCountedInProjectsAndGoals } from '#lib/tickSettings';
import { getDisplayGradeSystems, getTickTypeSettings } from './appSettings';
import { db, ensureSchema } from './db';
import { ascents, routes } from './db/schema';
import { isLikelyIndoorRoute, listProjects } from './projects';
import { projectProgress } from './projectProgress';

export function getProjectDetails(routeId: number, now = new Date()) {
	ensureSchema();
	const project = listProjects().find((p) => p.routeId === routeId);
	if (!project) return null;
	const target = db.select().from(routes).where(eq(routes.id, routeId)).get();
	if (!target) return null;
	const rows = loadProjectProgressRows();
	const today = now.toISOString().slice(0, 10);
	const gradeSystems = getDisplayGradeSystems();
	const progress = projectProgress({ routeId, ...target }, rows, today);
	const attempts = rows
		.filter((row) => row.routeId === routeId)
		.map((row) => ({
			id: row.ascentId,
			day: calendarDay(row.ascentDate),
			tickType: row.tickType,
			tickLabel: row.tickLabel,
			grade: formatClimbGrade({ ...row, effectiveGradeRaw: row.grade }, gradeSystems),
			pitchLabel: row.pitchLabel,
			isSend: row.isSend,
			numberAttempts: row.numberAttempts
		}))
		.sort((a, b) => (b.day ?? '').localeCompare(a.day ?? '') || b.id - a.id);
	return {
		project: { ...project, gradeLabel: formatClimbGrade(project, gradeSystems) },
		progress,
		attempts
	};
}

export function loadProjectProgressRows() {
	ensureSchema();
	const tickSettings = getTickTypeSettings();
	// Explicit whitelist: no ascent comment, raw JSON or local project notes are selected.
	return db
		.select({
			ascentId: ascents.id,
			routeId: ascents.routeId,
			ascentDate: ascents.ascentDate,
			isSend: ascents.isSend,
			isAttempt: ascents.isAttempt,
			numberAttempts: ascents.numberAttempts,
			effectiveGradeScore: ascents.effectiveGradeScore,
			gradeScore: routes.gradeScore,
			gradeSystem: routes.gradeSystem,
			gearStyle: routes.gearStyle,
			tickType: ascents.tickType,
			tickLabel: ascents.tickLabel,
			grade: ascents.effectiveGradeRaw,
			gradeRaw: routes.gradeRaw,
			pitchLabel: ascents.pitchLabel,
			name: routes.name,
			cragName: routes.cragName,
			tagsJson: routes.tagsJson
		})
		.from(ascents)
		.innerJoin(routes, eq(routes.id, ascents.routeId))
		.all()
		.filter(
			(row) =>
				!isLikelyIndoorRoute(row) && isTickCountedInProjectsAndGoals(row.tickType, tickSettings)
		);
}
