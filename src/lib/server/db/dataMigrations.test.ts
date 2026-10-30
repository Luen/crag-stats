import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from './index';
import { appSettings, ascents, goals, routes } from './schema';
import {
	invalidateIncompleteRouteCache,
	legacyEnvSettings,
	runDataMigrations
} from './dataMigrations';
import { getDashboardStats, wipeAllData } from '../analytics';
import { getFirstAscentMarks, setFirstAscent } from '../firstAscents';
import { upsertAscents } from '../ingest';
import * as projects from '../projects';
import { mapAscent } from '../providers/thecrag/api';
import { mapTheCragCsvRow } from '../providers/thecrag/csv';

const ID = 'data:0001_repair_cached_grades';
const ALL = [
	ID,
	'data:0002_legacy_env_settings',
	'data:0003_csv_au_boulder_grades',
	'data:0004_invalidate_incomplete_route_cache',
	'data:0005_repair_tlc_bare_geometry_coords'
];

beforeEach(() => {
	wipeAllData();
	db.run(sql`DELETE FROM schema_migrations WHERE id LIKE 'data:%'`);
});
afterEach(() => vi.restoreAllMocks());

function seedOldGrades() {
	for (const [id, gradeSystem, grade] of [
		[81001, 'AU', '9'],
		[81002, 'BLDV', '5']
	] as const) {
		upsertAscents([
			mapAscent({
				id,
				date: '2026-01-01',
				gradeSystem,
				tick: { name: 'Tick' },
				route: {
					id,
					name: `Synthetic boulder ${id}`,
					grade,
					style: 'Boulder',
					ancestors: { country: { name: 'Australia' } }
				}
			})!
		]);
	}
	db.update(routes).set({ gradeScore: 9 }).where(eq(routes.externalId, '81001')).run();
	db.update(ascents).set({ effectiveGradeScore: 9 }).where(eq(ascents.externalId, '81001')).run();
}

describe('startup data migrations', () => {
	it('repairs CSV grades after earlier data migrations have already run', () => {
		runDataMigrations();
		db.run(sql`DELETE FROM schema_migrations WHERE id = 'data:0003_csv_au_boulder_grades'`);
		const old = mapTheCragCsvRow({
			'Ascent ID': 'csv-upgrade',
			'Route ID': 'csv-route',
			'Route Name': 'Synthetic Australian boulder',
			'Route Grade': '9',
			'Route Gear Style': 'Boulder',
			Country: 'Australia'
		})!;
		old.route.gradeScore = 9;
		old.effectiveGradeScore = 9;
		upsertAscents([old]);
		setFirstAscent('thecrag', 'csv-route', 'FA');
		const marks = getFirstAscentMarks();
		db.update(routes).set({ tagsJson: '["Rock:Granite"]' }).run();
		expect(runDataMigrations()).toEqual(['data:0003_csv_au_boulder_grades']);
		expect(db.select().from(routes).get()).toMatchObject({
			gradeScore: -0.7,
			tagsJson: '["Rock:Granite"]'
		});
		expect(db.select().from(ascents).get()!.effectiveGradeScore).toBe(-0.7);
		expect(getFirstAscentMarks()).toEqual(marks);
		expect(runDataMigrations()).toEqual([]);
	});

	it('upgrades cached grades while preserving explicit scales and local-only data', () => {
		seedOldGrades();
		setFirstAscent('thecrag', '81001', 'FA');
		const now = new Date().toISOString();
		db.insert(appSettings)
			.values([
				{ key: 'grade_system', value: 'french', updatedAt: now },
				{ key: 'dashboard_layout', value: 'synthetic-layout', updatedAt: now }
			])
			.run();
		db.insert(goals)
			.values({ kind: 'custom', title: 'Synthetic goal', createdAt: now, updatedAt: now })
			.run();
		const marks = getFirstAscentMarks();

		expect(runDataMigrations()).toEqual(ALL);
		expect(db.select().from(routes).where(eq(routes.externalId, '81001')).get()!.gradeScore).toBe(
			-0.7
		);
		expect(
			db.select().from(ascents).where(eq(ascents.externalId, '81001')).get()!.effectiveGradeScore
		).toBe(-0.7);
		expect(db.select().from(routes).where(eq(routes.externalId, '81002')).get()!.gradeScore).toBe(
			5
		);
		expect(
			db.select().from(appSettings).where(eq(appSettings.key, 'grade_system')).get()!.value
		).toBe('french');
		expect(
			db.select().from(appSettings).where(eq(appSettings.key, 'dashboard_layout')).get()!.value
		).toBe('synthetic-layout');
		expect(getFirstAscentMarks()).toEqual(marks);
		expect(db.select().from(goals).get()!.title).toBe('Synthetic goal');
	});

	it('persists completion in SQLite and skips the repair on later starts', () => {
		seedOldGrades();
		expect(runDataMigrations()).toEqual(ALL);
		expect(db.get(sql`SELECT id FROM schema_migrations WHERE id = ${ID}`)).toEqual({ id: ID });
		// A second startup must not re-parse the database just because the process restarted.
		db.update(routes).set({ gradeScore: 123 }).where(eq(routes.externalId, '81001')).run();
		expect(runDataMigrations()).toEqual([]);
		expect(db.select().from(routes).where(eq(routes.externalId, '81001')).get()!.gradeScore).toBe(
			123
		);
	});

	it('rolls back the repair and marker on failure, then retries successfully', () => {
		seedOldGrades();
		vi.spyOn(projects, 'refreshProjects').mockImplementationOnce(() => {
			throw new Error('Synthetic migration failure');
		});
		expect(() => runDataMigrations()).toThrow('Synthetic migration failure');
		expect(db.get(sql`SELECT id FROM schema_migrations WHERE id = ${ID}`)).toBeUndefined();
		expect(db.select().from(routes).where(eq(routes.externalId, '81001')).get()!.gradeScore).toBe(
			9
		);
		expect(
			db.select().from(ascents).where(eq(ascents.externalId, '81001')).get()!.effectiveGradeScore
		).toBe(9);
		expect(runDataMigrations()).toEqual(ALL);
		expect(db.select().from(routes).where(eq(routes.externalId, '81001')).get()!.gradeScore).toBe(
			-0.7
		);
	});

	it('handles a fresh install and leaves SQL migration records intact', () => {
		const schemaBefore = db.all(sql`SELECT * FROM schema_migrations ORDER BY id`);
		expect(runDataMigrations()).toEqual(ALL);
		expect(
			db.all(sql`SELECT * FROM schema_migrations WHERE id NOT LIKE 'data:%' ORDER BY id`)
		).toEqual(schemaBefore);
		expect(db.select().from(routes).all()).toEqual([]);
		expect(runDataMigrations()).toEqual([]);
	});

	it('does not trigger a grade migration from a dashboard request', () => {
		seedOldGrades();
		getDashboardStats();
		expect(db.select().from(routes).where(eq(routes.externalId, '81001')).get()!.gradeScore).toBe(
			9
		);
		expect(db.get(sql`SELECT id FROM schema_migrations WHERE id = ${ID}`)).toBeUndefined();
	});
});

describe('invalidate incomplete route cache (#209)', () => {
	const NOW = '2026-01-01T00:00:00.000Z';

	function seedRoute(externalId: string) {
		db.run(sql`
			INSERT INTO routes (provider, external_id, name, grade_raw, grade_score, updated_at)
			VALUES ('thecrag', ${externalId}, ${`Route ${externalId}`}, '20', 20, ${NOW})
		`);
	}

	function seedFetch(externalId: string) {
		db.run(sql`
			INSERT INTO route_history_fetches (provider, route_external_id, status, history_count, fetched_at)
			VALUES ('thecrag', ${externalId}, 'ok', 1, ${NOW})
		`);
	}

	it('drops ok fetch rows when route info or route_api_json is missing', () => {
		seedRoute('stale-a');
		seedRoute('stale-b');
		seedRoute('complete');
		seedRoute('gone');
		seedFetch('stale-a');
		seedFetch('stale-b');
		seedFetch('complete');
		db.run(sql`
			INSERT INTO route_history_fetches (provider, route_external_id, status, history_count, fetched_at)
			VALUES ('thecrag', 'gone', 'missing', 0, ${NOW})
		`);
		db.run(sql`UPDATE routes SET route_info_updated_at = ${NOW} WHERE external_id = 'stale-b'`);
		db.run(sql`
			UPDATE routes
			SET route_info_updated_at = ${NOW}, route_api_json = '{"id":1}'
			WHERE external_id = 'complete'
		`);

		expect(invalidateIncompleteRouteCache()).toBe(2);
		expect(
			db.all(sql`SELECT route_external_id FROM route_history_fetches ORDER BY route_external_id`)
		).toEqual([{ route_external_id: 'complete' }, { route_external_id: 'gone' }]);
	});

	it('is a no-op once caches are complete', () => {
		seedRoute('complete');
		seedFetch('complete');
		db.run(sql`
			UPDATE routes
			SET route_info_updated_at = ${NOW}, route_api_json = '{"id":1}'
			WHERE external_id = 'complete'
		`);

		expect(invalidateIncompleteRouteCache()).toBe(0);
		expect(db.get(sql`SELECT count(*) AS n FROM route_history_fetches`)).toEqual({ n: 1 });
	});

	it('runs once via runDataMigrations', () => {
		seedRoute('stale');
		seedFetch('stale');
		expect(runDataMigrations()).toEqual(ALL);
		expect(db.get(sql`SELECT count(*) AS n FROM route_history_fetches`)).toEqual({ n: 0 });
		expect(runDataMigrations()).toEqual([]);
	});
});

describe('legacy env settings carry-over (#84)', () => {
	const none = { gradeSystem: null, showNotes: null };

	it('copies a valid grade system and an enabled notes flag when Settings is empty', () => {
		expect(
			legacyEnvSettings({ PREFERRED_GRADE_SYSTEM: ' French ', SHOW_PRIVATE_NOTES: 'true' }, none)
		).toEqual({ grade_system: 'french', show_notes: 'on' });
	});

	it('ignores unset, invalid or off values', () => {
		expect(legacyEnvSettings({}, none)).toEqual({});
		expect(
			legacyEnvSettings({ PREFERRED_GRADE_SYSTEM: 'british', SHOW_PRIVATE_NOTES: 'false' }, none)
		).toEqual({});
	});

	it('never overrides a value already saved in Settings', () => {
		expect(
			legacyEnvSettings(
				{ PREFERRED_GRADE_SYSTEM: 'yds', SHOW_PRIVATE_NOTES: '1' },
				{ gradeSystem: 'ewbank', showNotes: 'off' }
			)
		).toEqual({});
	});

	it('writes the carried-over values once at startup', () => {
		db.delete(appSettings).run();
		vi.stubEnv('PREFERRED_GRADE_SYSTEM', 'v_scale');
		vi.stubEnv('SHOW_PRIVATE_NOTES', 'yes');
		try {
			expect(runDataMigrations()).toEqual(ALL);
		} finally {
			vi.unstubAllEnvs();
		}
		const value = (key: string) =>
			db.select().from(appSettings).where(eq(appSettings.key, key)).get()?.value;
		expect(value('grade_system')).toBe('v_scale');
		expect(value('show_notes')).toBe('on');
	});
});
