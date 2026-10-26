import { asc, eq, sql } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { ascents, projects, routes } from './db/schema';

function nowIso() {
	return new Date().toISOString();
}

/**
 * Auto-detect projects: routes with attempts / hangdogs that are not yet cleanly sent,
 * or routes with multiple non-send ticks.
 */
export function refreshProjects() {
	ensureSchema();
	const rows = db
		.select({
			routeId: ascents.routeId,
			attemptCount: sql<number>`sum(case when ${ascents.isAttempt} = 1 then 1 else 0 end)`,
			sendCount: sql<number>`sum(case when ${ascents.isSend} = 1 then 1 else 0 end)`,
			total: sql<number>`count(*)`,
			firstAt: sql<string>`min(${ascents.ascentDate})`,
			lastAt: sql<string>`max(${ascents.ascentDate})`,
			sentAt: sql<string | null>`min(case when ${ascents.isSend} = 1 then ${ascents.ascentDate} end)`
		})
		.from(ascents)
		.groupBy(ascents.routeId)
		.all();

	const updatedAt = nowIso();

	for (const row of rows) {
		const attempts = Number(row.attemptCount) || 0;
		const sends = Number(row.sendCount) || 0;
		const total = Number(row.total) || 0;

		const isProject = attempts > 0 || (total >= 2 && sends === 0);
		if (!isProject && sends === 0) continue;

		const status = sends > 0 ? 'sent' : 'open';
		const existing = db.select().from(projects).where(eq(projects.routeId, row.routeId)).get();

		if (!isProject && status !== 'sent') {
			if (existing) {
				db.delete(projects).where(eq(projects.id, existing.id)).run();
			}
			continue;
		}

		const values = {
			status,
			attemptCount: attempts + (sends === 0 ? Math.max(total - attempts, 0) : attempts),
			firstAttemptAt: row.firstAt,
			lastAttemptAt: row.lastAt,
			sentAt: row.sentAt,
			updatedAt
		};

		if (existing) {
			db.update(projects).set(values).where(eq(projects.id, existing.id)).run();
		} else {
			db.insert(projects)
				.values({
					routeId: row.routeId,
					...values
				})
				.run();
		}
	}
}

export function listProjects(status?: 'open' | 'sent' | 'archived') {
	ensureSchema();
	const q = db
		.select({
			id: projects.id,
			status: projects.status,
			attemptCount: projects.attemptCount,
			firstAttemptAt: projects.firstAttemptAt,
			lastAttemptAt: projects.lastAttemptAt,
			sentAt: projects.sentAt,
			routeId: routes.id,
			routeName: routes.name,
			gradeRaw: routes.gradeRaw,
			gradeBand: routes.gradeBand,
			gradeScore: routes.gradeScore,
			cragName: routes.cragName,
			gearStyle: routes.gearStyle,
			url: routes.url
		})
		.from(projects)
		.innerJoin(routes, eq(projects.routeId, routes.id));

	if (status) {
		return q.where(eq(projects.status, status)).all();
	}
	return q.all();
}

export function getProjectAttempts(routeId: number) {
	ensureSchema();
	return db
		.select()
		.from(ascents)
		.where(eq(ascents.routeId, routeId))
		.orderBy(asc(ascents.ascentDate))
		.all();
}
