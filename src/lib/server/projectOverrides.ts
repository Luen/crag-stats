import { and, eq } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { ascents, projectOverrides, routes } from './db/schema';
import { isLikelyIndoorRoute } from './venue';

export type ProjectDecision = 'auto' | 'include' | 'exclude';
const key = (provider: string, route: string) => `${provider}:${route}`;

export function getProjectOverrides() {
	ensureSchema();
	return new Map(
		db
			.select()
			.from(projectOverrides)
			.all()
			.flatMap((row) =>
				row.decision === 'include' || row.decision === 'exclude'
					? [[key(row.provider, row.routeExternalId), row.decision as ProjectDecision] as const]
					: []
			)
	);
}

export function projectDecision(
	overrides: Map<string, ProjectDecision>,
	provider: string,
	route: string
): ProjectDecision {
	return overrides.get(key(provider, route)) ?? 'auto';
}

/** False for unknown/unlogged routes or attempts to manually select an indoor route. */
export function setProjectOverride(
	provider: string,
	externalId: string,
	decision: ProjectDecision
): boolean {
	ensureSchema();
	const route = db
		.select()
		.from(routes)
		.where(and(eq(routes.provider, provider), eq(routes.externalId, externalId)))
		.get();
	if (
		!route ||
		!db.select({ id: ascents.id }).from(ascents).where(eq(ascents.routeId, route.id)).get()
	)
		return false;
	if (decision === 'include' && isLikelyIndoorRoute(route)) return false;
	const where = and(
		eq(projectOverrides.provider, provider),
		eq(projectOverrides.routeExternalId, externalId)
	);
	if (decision === 'auto') db.delete(projectOverrides).where(where).run();
	else
		db.insert(projectOverrides)
			.values({
				provider,
				routeExternalId: externalId,
				decision,
				updatedAt: new Date().toISOString()
			})
			.onConflictDoUpdate({
				target: [projectOverrides.provider, projectOverrides.routeExternalId],
				set: { decision, updatedAt: new Date().toISOString() }
			})
			.run();
	return true;
}
