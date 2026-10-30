import { beforeEach, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import fixture from './providers/thecrag/fixtures/aspect-tags.sanitized.json';
import { mapAscent } from './providers/thecrag/api';
import { db } from './db';
import { routes, ascents } from './db/schema';
import { runDataMigrations } from './db/dataMigrations';
import { getDashboardStats, wipeAllData } from './analytics';
import { upsertAscents } from './ingest';
const mapped = (
	id: number,
	tags: typeof fixture.direct | typeof fixture.inherited,
	date = '2025-01-01',
	name = 'Synthetic sun face'
) =>
	mapAscent({
		id,
		date,
		tick: { name: 'Attempt' },
		route: {
			id,
			name,
			style: 'Sport',
			tags,
			ancestors: { TLC: { id: 999, name: 'Synthetic crag', geometry: [151, -34] } }
		}
	})!;
beforeEach(() => wipeAllData());
it('awards the earliest qualifying climb without weather cache and skips indoor/inherited tags', () => {
	upsertAscents([
		mapped(1, fixture.direct, '2025-02-01'),
		mapped(2, fixture.direct, '2025-01-01'),
		mapped(3, fixture.inherited, '2024-01-01'),
		mapped(4, fixture.direct, '2023-01-01', 'Indoor gym')
	]);
	const badges = getDashboardStats().badges;
	expect(badges.earned.find((b) => b.id === 'sun_facing_summer')).toMatchObject({
		date: '2025-01-01',
		icon: 'sun'
	});
	expect(badges.almost.some((b) => b.id === 'sun_facing_summer')).toBe(false);
});
it('repairs legacy aspect provenance at startup without touching notes, other tags or coordinates', () => {
	upsertAscents([mapped(1, fixture.direct), mapped(2, fixture.inherited)]);
	runDataMigrations();
	db.run(sql`DELETE FROM schema_migrations WHERE id='data:0006_preserve_aspect_tag_provenance'`);
	db.update(routes)
		.set({
			tagsJson: '[{"category":"Aspect","name":"N"},{"category":"Rock type","name":"Granite"}]'
		})
		.run();
	db.update(ascents).set({ comment: 'Private note stays private' }).run();
	const before = db.select().from(routes).where(eq(routes.externalId, '1')).get()!;
	expect(runDataMigrations()).toEqual(['data:0006_preserve_aspect_tag_provenance']);
	const rows = db.select().from(routes).all();
	expect(JSON.parse(rows.find((r) => r.externalId === '1')!.tagsJson!)).toContainEqual({
		category: 'Aspect',
		name: 'N',
		source: 'route'
	});
	expect(JSON.parse(rows.find((r) => r.externalId === '2')!.tagsJson!)).toContainEqual({
		category: 'Aspect',
		name: 'NE',
		source: 'ancestor'
	});
	expect(
		rows.every((r) =>
			JSON.parse(r.tagsJson!).some((t: { category: string }) => t.category === 'Rock type')
		)
	).toBe(true);
	expect(db.select().from(ascents).get()?.comment).toBe('Private note stays private');
	expect(rows.find((r) => r.externalId === '1')?.lat).toBe(before.lat);
	expect(getDashboardStats().badges.earned.some((b) => b.id === 'sun_facing_summer')).toBe(true);
	expect(runDataMigrations()).toEqual([]);
});

it('maps and upgrades direct Weather tags while inherited sun and indoor climbs stay excluded', async () => {
	const { default: sun } = await import('./providers/thecrag/fixtures/sun-tags.sanitized.json');
	const direct = mapped(11, sun.direct as unknown as typeof fixture.direct);
	const inherited = mapped(12, sun.inherited as unknown as typeof fixture.inherited, '2024-01-01');
	const indoor = mapped(
		13,
		sun.direct as unknown as typeof fixture.direct,
		'2023-01-01',
		'Indoor gym'
	);
	upsertAscents([direct, inherited, indoor]);
	runDataMigrations();
	db.update(routes)
		.set({
			tagsJson:
				'[{"category":"Weather","name":"All day sun"},{"category":"Rock type","name":"Granite"}]'
		})
		.run();
	db.run(sql`DELETE FROM schema_migrations WHERE id='data:0007_preserve_weather_tag_provenance'`);
	db.update(ascents).set({ comment: 'Private test note' }).run();
	expect(runDataMigrations()).toEqual(['data:0007_preserve_weather_tag_provenance']);
	const tags = db.select().from(routes).all();
	expect(JSON.parse(tags.find((r) => r.externalId === '11')!.tagsJson!)).toContainEqual({
		category: 'Weather',
		name: 'All day sun',
		source: 'route'
	});
	expect(JSON.parse(tags.find((r) => r.externalId === '12')!.tagsJson!)).toContainEqual({
		category: 'Weather',
		name: 'All day sun',
		source: 'ancestor'
	});
	expect(
		tags.every((r) =>
			JSON.parse(r.tagsJson!).some((t: { category: string }) => t.category === 'Rock type')
		)
	).toBe(true);
	const stats = getDashboardStats();
	expect(stats.badges.earned.find((b) => b.id === 'sun_facing_summer')?.date).toBe('2025-01-01');
	expect(JSON.stringify(stats)).not.toContain('Private test note');
	expect(db.select().from(ascents).get()?.comment).toBe('Private test note');
	expect(runDataMigrations()).toEqual([]);
});
