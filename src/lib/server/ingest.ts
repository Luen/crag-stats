import { eq, and, sql } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { ascents, profiles, projects, routes, syncState } from './db/schema';
import type { CanonicalAscent, ProviderProfile } from './providers/types';

function nowIso() {
	return new Date().toISOString();
}

/**
 * Upsert routes + ascents. Upstream payload is source of truth for each record:
 * fields are overwritten from the provider (not merged with stale local values).
 */
export function upsertAscents(batch: CanonicalAscent[]): { routes: number; ascents: number } {
	ensureSchema();
	const updatedAt = nowIso();
	let routeCount = 0;
	let ascentCount = 0;

	db.transaction((txDb) => {
		for (const item of batch) {
			const existingRoute = txDb
				.select()
				.from(routes)
				.where(
					and(eq(routes.provider, item.route.provider), eq(routes.externalId, item.route.externalId))
				)
				.get();

			let routeId: number;
			const routeValues = {
				name: item.route.name,
				gradeRaw: item.route.gradeRaw ?? null,
				gradeScore: item.route.gradeScore ?? null,
				gradeBand: item.route.gradeBand ?? null,
				gradeSystem: item.route.gradeSystem ?? null,
				gearStyle: item.route.gearStyle ?? null,
				heightM: item.route.heightM ?? null,
				stars: item.route.stars ?? null,
				url: item.route.url ?? null,
				country: item.route.country ?? null,
				cragName: item.route.cragName ?? null,
				cragPath: item.route.cragPath ?? null,
				areaExternalId: item.route.areaExternalId ?? null,
				updatedAt
			};

			if (existingRoute) {
				routeId = existingRoute.id;
				txDb.update(routes).set(routeValues).where(eq(routes.id, routeId)).run();
			} else {
				const inserted = txDb
					.insert(routes)
					.values({
						provider: item.route.provider,
						externalId: item.route.externalId,
						...routeValues
					})
					.returning({ id: routes.id })
					.get();
				routeId = inserted.id;
				routeCount += 1;
			}

			const existingAscent = txDb
				.select()
				.from(ascents)
				.where(and(eq(ascents.provider, item.provider), eq(ascents.externalId, item.externalId)))
				.get();

			const values = {
				routeId,
				ascentDate: item.ascentDate ?? null,
				logDate: item.logDate ?? null,
				tickType: item.tickType ?? null,
				tickLabel: item.tickLabel ?? null,
				ascentGearStyle: item.ascentGearStyle ?? null,
				ascentGradeRaw: item.ascentGradeRaw ?? null,
				heightM: item.heightM ?? null,
				quality: item.quality ?? null,
				partners: item.partners ?? null,
				comment: item.comment ?? null,
				isSend: item.isSend,
				isAttempt: item.isAttempt,
				epoch: item.epoch ?? null,
				cprBase: item.cprBase ?? null,
				cprScore: item.cprScore ?? null,
				rawJson: item.rawJson ?? null,
				updatedAt
			};

			if (existingAscent) {
				txDb.update(ascents).set(values).where(eq(ascents.id, existingAscent.id)).run();
			} else {
				txDb
					.insert(ascents)
					.values({
						provider: item.provider,
						externalId: item.externalId,
						...values
					})
					.run();
				ascentCount += 1;
			}
		}
	});

	return { routes: routeCount, ascents: ascentCount };
}

/**
 * After a full provider pull, delete local ascents that no longer exist upstream.
 * Also removes orphan routes and projects that referenced pruned routes.
 *
 * Safety: refuses to wipe everything if the API returned zero IDs but the account
 * still reports a positive ascentCount (likely a partial/failed pull).
 */
export function reconcileProviderAscents(
	provider: string,
	seenExternalIds: Iterable<string>,
	opts?: { expectedCount?: number | null }
): { deletedAscents: number; deletedRoutes: number; deletedProjects: number } {
	ensureSchema();
	const seen = [...new Set([...seenExternalIds].map(String))];
	const expected = opts?.expectedCount;

	if (seen.length === 0 && expected != null && expected > 0) {
		throw new Error(
			`Refusing to prune ${provider} logbook: API returned 0 ascents but account reports ${expected}`
		);
	}

	const local = db
		.select({ id: ascents.id, externalId: ascents.externalId })
		.from(ascents)
		.where(eq(ascents.provider, provider))
		.all();

	const seenSet = new Set(seen);
	const staleIds =
		seen.length === 0 ? local.map((a) => a.id) : local.filter((a) => !seenSet.has(a.externalId)).map((a) => a.id);

	let deletedAscents = 0;
	let deletedRoutes = 0;
	let deletedProjects = 0;

	db.transaction((txDb) => {
		for (const id of staleIds) {
			deletedAscents += txDb.delete(ascents).where(eq(ascents.id, id)).run().changes;
		}

		const orphans = txDb
			.select({ id: routes.id })
			.from(routes)
			.where(
				and(
					eq(routes.provider, provider),
					sql`${routes.id} NOT IN (SELECT ${ascents.routeId} FROM ${ascents})`
				)
			)
			.all();

		for (const r of orphans) {
			deletedProjects += txDb.delete(projects).where(eq(projects.routeId, r.id)).run().changes;
			deletedRoutes += txDb.delete(routes).where(eq(routes.id, r.id)).run().changes;
		}
	});

	return { deletedAscents, deletedRoutes, deletedProjects };
}

export function upsertProfile(profile: ProviderProfile) {
	ensureSchema();
	const updatedAt = nowIso();
	const existing = db.select().from(profiles).where(eq(profiles.provider, profile.provider)).get();
	if (existing) {
		db.update(profiles)
			.set({
				externalId: profile.externalId ?? null,
				name: profile.name ?? null,
				login: profile.login ?? null,
				country: profile.country ?? null,
				ascentCount: profile.ascentCount ?? null,
				rawJson: profile.rawJson ?? null,
				updatedAt
			})
			.where(eq(profiles.id, existing.id))
			.run();
	} else {
		db.insert(profiles)
			.values({
				provider: profile.provider,
				externalId: profile.externalId ?? null,
				name: profile.name ?? null,
				login: profile.login ?? null,
				country: profile.country ?? null,
				ascentCount: profile.ascentCount ?? null,
				rawJson: profile.rawJson ?? null,
				updatedAt
			})
			.run();
	}
}

export function getOrCreateSyncState(provider: string) {
	ensureSchema();
	const existing = db.select().from(syncState).where(eq(syncState.provider, provider)).get();
	if (existing) return existing;
	db.insert(syncState).values({ provider, status: 'idle' }).run();
	return db.select().from(syncState).where(eq(syncState.provider, provider)).get()!;
}

export function updateSyncState(
	provider: string,
	patch: Partial<{
		cursor: string | null;
		lastSyncAt: string | null;
		lastSuccessAt: string | null;
		lastError: string | null;
		status: string;
	}>
) {
	ensureSchema();
	getOrCreateSyncState(provider);
	db.update(syncState).set(patch).where(eq(syncState.provider, provider)).run();
}
