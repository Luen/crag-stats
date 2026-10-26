import { eq } from 'drizzle-orm';
import { detectAndParseGrade } from '#lib/grades';
import { db, ensureSchema } from './db';
import { ascents, routes } from './db/schema';
import { mapAscent } from './providers/thecrag/api';

/**
 * Re-derive route + effective ascent grades from stored raw_json (API payloads).
 * Fixes V1/2-style parses and multipitch effective grades without waiting for a re-sync.
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
			rawJson: ascents.rawJson,
			provider: ascents.provider
		})
		.from(ascents)
		.all();

	db.transaction((txDb) => {
		for (const row of rows) {
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
					pitchesClimbed: mapped.pitchesClimbed ?? null,
					pitchesTotal: mapped.pitchesTotal ?? null,
					heightM: mapped.heightM ?? null,
					cprBase: mapped.cprBase ?? null,
					cprScore: mapped.cprScore ?? null,
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
					updatedAt
				})
				.where(eq(routes.id, row.routeId))
				.run();
			routeCount += 1;
		}

		const allRoutes = txDb.select().from(routes).all();
		for (const r of allRoutes) {
			if (!r.gradeRaw) continue;
			const parsed = detectAndParseGrade(r.gradeRaw, {
				gearStyle: r.gearStyle,
				gradeBand: r.gradeBand
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
