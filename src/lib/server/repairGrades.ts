import { eq } from 'drizzle-orm';
import { detectAndParseGrade } from '#lib/grades';
import { theCragAscentUrl } from '#lib/thecragUrls';
import { db, ensureSchema } from './db';
import { ascents, routes } from './db/schema';
import { mapAscent } from './providers/thecrag/api';

/**
 * Re-derive route + effective ascent grades (and URLs) from stored raw_json.
 * Fixes V1/2-style parses, multipitch effective grades, and broken area-stub links.
 */
export function repairGradesFromRawJson(): { routes: number; ascents: number } {
	ensureSchema();
	const updatedAt = new Date().toISOString();
	let routeCount = 0;
	let ascentCount = 0;

	const rows = db
		.select({
			id: ascents.id,
			routeId: ascents.routeId,
			externalId: ascents.externalId,
			rawJson: ascents.rawJson,
			provider: ascents.provider,
			ascentUrl: ascents.ascentUrl
		})
		.from(ascents)
		.all();

	db.transaction((txDb) => {
		for (const row of rows) {
			if (row.provider === 'thecrag' && !row.ascentUrl) {
				txDb
					.update(ascents)
					.set({ ascentUrl: theCragAscentUrl(row.externalId), updatedAt })
					.where(eq(ascents.id, row.id))
					.run();
				ascentCount += 1;
			}

			if (!row.rawJson || row.provider !== 'thecrag') continue;
			let parsed: unknown;
			try {
				parsed = JSON.parse(row.rawJson);
			} catch {
				continue;
			}
			// CSV rows are flat objects without nested route — skip to route re-parse below
			if (!parsed || typeof parsed !== 'object' || !('route' in (parsed as object))) continue;

			const mapped = mapAscent(parsed as Parameters<typeof mapAscent>[0]);
			if (!mapped) continue;

			txDb
				.update(ascents)
				.set({
					ascentGradeRaw: mapped.ascentGradeRaw ?? null,
					effectiveGradeRaw: mapped.effectiveGradeRaw ?? null,
					effectiveGradeScore: mapped.effectiveGradeScore ?? null,
					effectiveGradeBand: mapped.effectiveGradeBand ?? null,
					pitchLabel: mapped.pitchLabel ?? null,
					ascentLabel: mapped.ascentLabel ?? null,
					pitchesClimbed: mapped.pitchesClimbed ?? null,
					pitchesTotal: mapped.pitchesTotal ?? null,
					heightM: mapped.heightM ?? null,
					quality: mapped.quality ?? null,
					partners: mapped.partners ?? null,
					numberAttempts: mapped.numberAttempts ?? null,
					cprBase: mapped.cprBase ?? null,
					cprScore: mapped.cprScore ?? null,
					cprShiftedScore: mapped.cprShiftedScore ?? null,
					cprShiftedGrade: mapped.cprShiftedGrade ?? null,
					cprDecayedScore: mapped.cprDecayedScore ?? null,
					cprDecayedGrade: mapped.cprDecayedGrade ?? null,
					ascentUrl: mapped.ascentUrl ?? theCragAscentUrl(row.externalId),
					updatedAt
				})
				.where(eq(ascents.id, row.id))
				.run();
			ascentCount += 1;

			txDb
				.update(routes)
				.set({
					gradeRaw: mapped.route.gradeRaw ?? null,
					gradeScore: mapped.route.gradeScore ?? null,
					gradeBand: mapped.route.gradeBand ?? null,
					gradeSystem: mapped.route.gradeSystem ?? null,
					url: mapped.route.url ?? null,
					cragName: mapped.route.cragName ?? null,
					cragPath: mapped.route.cragPath ?? null,
					cragUrl: mapped.route.cragUrl ?? null,
					areaExternalId: mapped.route.areaExternalId ?? null,
					country: mapped.route.country ?? null,
					tagsJson: mapped.route.tags?.length ? JSON.stringify(mapped.route.tags) : null,
					bolts: mapped.route.bolts ?? null,
					parentName: mapped.route.parentName ?? null,
					parentExternalId: mapped.route.parentExternalId ?? null,
					lat: mapped.route.lat ?? null,
					lon: mapped.route.lon ?? null,
					updatedAt
				})
				.where(eq(routes.id, row.routeId))
				.run();
			routeCount += 1;
		}

		const allRoutes = txDb.select().from(routes).all();
		for (const r of allRoutes) {
			if (!r.gradeRaw) continue;
			// Prefer AU when re-parsing bare Australian boulder digits so "9"→VB not V9 (#112).
			const country = (r.country ?? '').toLowerCase();
			const auBoulder =
				(r.gearStyle ?? '').toLowerCase().includes('boulder') &&
				/^\d{1,2}$/.test(r.gradeRaw.trim()) &&
				(country.includes('australia') || country === 'au');
			const parsed = detectAndParseGrade(r.gradeRaw, {
				gearStyle: r.gearStyle,
				gradeBand: r.gradeBand,
				gradeSystem: auBoulder ? 'AU' : null
			});
			if (parsed.score === r.gradeScore && parsed.system === r.gradeSystem) continue;
			txDb
				.update(routes)
				.set({
					gradeScore: parsed.score,
					gradeBand: parsed.band?.id ?? r.gradeBand,
					gradeSystem: parsed.system,
					updatedAt
				})
				.where(eq(routes.id, r.id))
				.run();
			routeCount += 1;

			const kids = txDb.select().from(ascents).where(eq(ascents.routeId, r.id)).all();
			for (const a of kids) {
				if (a.pitchLabel) continue;
				if (a.rawJson?.includes('"pitch"')) continue;
				txDb
					.update(ascents)
					.set({
						effectiveGradeRaw: a.effectiveGradeRaw ?? a.ascentGradeRaw ?? r.gradeRaw,
						effectiveGradeScore: a.effectiveGradeScore ?? parsed.score,
						effectiveGradeBand: a.effectiveGradeBand ?? parsed.band?.id ?? r.gradeBand,
						updatedAt
					})
					.where(eq(ascents.id, a.id))
					.run();
				ascentCount += 1;
			}
		}
	});

	return { routes: routeCount, ascents: ascentCount };
}
