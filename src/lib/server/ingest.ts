import { eq, and } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { ascents, profiles, routes, syncState } from './db/schema';
import type { CanonicalAscent, ProviderProfile } from './providers/types';

function nowIso() {
	return new Date().toISOString();
}

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
			if (existingRoute) {
				routeId = existingRoute.id;
				txDb
					.update(routes)
					.set({
						name: item.route.name,
						gradeRaw: item.route.gradeRaw ?? existingRoute.gradeRaw,
						gradeScore: item.route.gradeScore ?? existingRoute.gradeScore,
						gradeBand: item.route.gradeBand ?? existingRoute.gradeBand,
						gradeSystem: item.route.gradeSystem ?? existingRoute.gradeSystem,
						gearStyle: item.route.gearStyle ?? existingRoute.gearStyle,
						heightM: item.route.heightM ?? existingRoute.heightM,
						stars: item.route.stars ?? existingRoute.stars,
						url: item.route.url ?? existingRoute.url,
						country: item.route.country ?? existingRoute.country,
						cragName: item.route.cragName ?? existingRoute.cragName,
						cragPath: item.route.cragPath ?? existingRoute.cragPath,
						areaExternalId: item.route.areaExternalId ?? existingRoute.areaExternalId,
						updatedAt
					})
					.where(eq(routes.id, routeId))
					.run();
			} else {
				const inserted = txDb
					.insert(routes)
					.values({
						provider: item.route.provider,
						externalId: item.route.externalId,
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

export function upsertProfile(profile: ProviderProfile) {
	ensureSchema();
	const updatedAt = nowIso();
	const existing = db.select().from(profiles).where(eq(profiles.provider, profile.provider)).get();
	if (existing) {
		db.update(profiles)
			.set({
				externalId: profile.externalId ?? existing.externalId,
				name: profile.name ?? existing.name,
				login: profile.login ?? existing.login,
				country: profile.country ?? existing.country,
				ascentCount: profile.ascentCount ?? existing.ascentCount,
				rawJson: profile.rawJson ?? existing.rawJson,
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
