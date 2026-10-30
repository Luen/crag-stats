import { beforeEach, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from './db';
import { ascents, routes, projects } from './db/schema';
import { upsertAscents } from './ingest';
import { getDashboardStats, listLogbook, wipeAllData } from './analytics';
import { mapAscent } from './providers/thecrag/api';
import { repairGradesFromRawJson } from './repairGrades';
import { runDataMigrations } from './db/dataMigrations';
beforeEach(() => wipeAllData());
// Synthetic fixtures based on the public theCrag tick-type/API guides, not private captures.
const mapped = (id: number, tick: string, style: string) =>
	mapAscent({
		id,
		date: '2025-01-01',
		tick: { name: tick },
		climbedGearStyle: style,
		privateMarkdown: 'Private note',
		route: { id: 100 + id, name: `Rope-solo route ${id}`, style: 'Sport', grade: '18' }
	})!;
it('maps, ingests and preserves separate rope-solo evidence through cached repair and dashboard evaluation', () => {
	upsertAscents([mapped(1, 'leadsolo', 'Trad'), mapped(2, 'Roped Solo', 'Top rope')]);
	repairGradesFromRawJson();
	const rows = listLogbook().rows;
	expect(rows.every((r) => r.gearStyle === 'Sport')).toBe(true);
	expect(rows.find((r) => r.tickType === 'leadsolo')?.ascentGearStyle).toBe('Trad');
	expect(rows.find((r) => r.tickType === 'Roped Solo')?.ascentGearStyle).toBe('Top rope');
	const result = getDashboardStats();
	expect(result.badges.earned.find((b) => b.id === 'first_lead_rope_solo')?.routeName).toBe(
		'Rope-solo route 1'
	);
	expect(result.badges.earned.find((b) => b.id === 'first_top_rope_solo')?.routeName).toBe(
		'Rope-solo route 2'
	);
	expect(JSON.stringify(result.badges)).not.toContain('Private note');
});
it('upgrades old completion flags only with matching explicit cached provider evidence', () => {
	upsertAscents([
		mapped(1, 'leadsolo', 'Trad'),
		mapped(2, 'ropedsolo', 'Top rope'),
		mapped(3, 'Attempt', 'Sport')
	]);
	runDataMigrations();
	db.run(sql`DELETE FROM schema_migrations WHERE id='data:0007_repair_explicit_solo_tick_flags'`);
	db.update(ascents).set({ isSend: false, isAttempt: false }).run();
	const before = db.select().from(routes).all();
	db.insert(projects)
		.values({ routeId: before[0].id, status: 'open', updatedAt: '2025-01-01' })
		.run();
	expect(runDataMigrations()).toEqual(['data:0007_repair_explicit_solo_tick_flags']);
	expect(db.select().from(ascents).where(eq(ascents.externalId, '1')).get()).toMatchObject({
		isSend: true,
		ascentGearStyle: 'Trad',
		comment: 'Private note'
	});
	expect(db.select().from(ascents).where(eq(ascents.externalId, '2')).get()?.isSend).toBe(true);
	expect(db.select().from(ascents).where(eq(ascents.externalId, '3')).get()?.isSend).toBe(false);
	expect(db.select().from(routes).all()).toEqual(before);
	expect(
		db.select().from(projects).where(eq(projects.routeId, before[0].id)).get()
	).toBeUndefined();
	expect(runDataMigrations()).toEqual([]);
});
