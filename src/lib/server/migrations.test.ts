/**
 * Upgrades from every older schema straight to the latest, as a homeserver that skipped
 * releases does on `docker compose pull && up -d` (AGENTS.md → "Migrations must survive
 * every release"). Each case applies the first `k` migration files, adds real-looking
 * rows, then runs the entrypoint's migrate script and checks the data survived and the
 * schema matches the Drizzle tables.
 */
import Database from 'better-sqlite3';
import { getTableColumns, getTableName, is } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain JS module run by scripts/docker-entrypoint.mjs (no .d.ts)
import { runMigrations } from '../../../scripts/migrate.mjs';
import * as schema from './db/schema';

const DIR = join(process.cwd(), 'migrations');
const FILES = readdirSync(DIR)
	.filter((f) => f.endsWith('.sql'))
	.sort();
const tmp = mkdtempSync(join(tmpdir(), 'crag-migrate-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const NOW = '2024-01-01T00:00:00.000Z';

/** What an older release left behind: its migrations applied, recorded, plus data. */
function oldDatabase(path: string, applied: string[]) {
	const db = new Database(path);
	db.exec(
		'CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)'
	);
	for (const f of applied) {
		db.exec(readFileSync(join(DIR, f), 'utf8'));
		db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(f, NOW);
	}
	if (applied.length) {
		// Only 0001 columns, so this works on every schema since the first release.
		db.prepare(
			`INSERT INTO profiles (provider, name, login, updated_at) VALUES ('thecrag', 'Sample Climber', 'sample', ?)`
		).run(NOW);
		db.prepare(
			`INSERT INTO routes (provider, external_id, name, grade_raw, grade_score, updated_at)
			 VALUES ('thecrag', 'r1', 'Sample Route', '20', 20, ?)`
		).run(NOW);
		db.prepare(
			`INSERT INTO ascents (provider, external_id, route_id, ascent_date, tick_type, comment, is_send, updated_at)
			 VALUES ('thecrag', 'a1', 1, '2023-05-01', 'Red point', 'sample note', 1, ?)`
		).run(NOW);
		db.prepare(
			`INSERT INTO goals (kind, title, created_at, updated_at) VALUES ('custom', 'Local goal', ?, ?)`
		).run(NOW, NOW);
		db.prepare(`INSERT INTO sync_state (provider, last_success_at) VALUES ('thecrag', ?)`).run(NOW);
	}
	// Local-only data from later releases, which must never be lost.
	if (applied.includes('0008_app_settings.sql')) {
		db.prepare(
			`INSERT INTO app_settings (key, value, updated_at) VALUES ('grade_system', 'french', ?)`
		).run(NOW);
	}
	if (applied.includes('0009_first_ascents.sql')) {
		db.prepare(
			`INSERT INTO first_ascents (provider, route_external_id, kind, created_at) VALUES ('thecrag', 'r1', 'FFA', ?)`
		).run(NOW);
	}
	if (applied.includes('0012_route_info.sql')) {
		db.prepare('UPDATE routes SET ascent_count = 7').run();
	}
	if (applied.includes('0013_route_ascent_snapshot.sql')) {
		db.prepare('UPDATE routes SET ascent_count_own = 2').run();
	}
	db.close();
}

describe('migrations survive skipped releases', () => {
	it('has an append-only, numbered file list', () => {
		expect(FILES.length).toBeGreaterThan(0);
		FILES.forEach((f, i) =>
			expect(f.startsWith(String(i + 1).padStart(4, '0') + '_'), f).toBe(true)
		);
	});

	// k = 0 is a fresh install; k = FILES.length is an already up-to-date DB.
	for (let k = 0; k <= FILES.length; k++) {
		const from = k === 0 ? 'an empty DB' : `${FILES[k - 1]}`;
		it(`upgrades from ${from} to the latest`, () => {
			const path = join(tmp, `from-${k}.sqlite`);
			oldDatabase(path, FILES.slice(0, k));

			const first = runMigrations(path) as { applied: string[] };
			expect(first.applied).toEqual(FILES.slice(k));
			// Running again (every container start) is a no-op.
			expect((runMigrations(path) as { applied: string[] }).applied).toEqual([]);

			const db = new Database(path, { readonly: true });
			try {
				const recorded = db.prepare('SELECT id FROM schema_migrations ORDER BY id').all() as {
					id: string;
				}[];
				expect(recorded.map((r) => r.id)).toEqual(FILES);

				// Every Drizzle table and column exists after upgrading.
				for (const table of Object.values(schema)) {
					if (!is(table, SQLiteTable)) continue;
					const name = getTableName(table);
					const cols = (db.prepare(`PRAGMA table_info(${name})`).all() as { name: string }[]).map(
						(c) => c.name
					);
					for (const col of Object.values(getTableColumns(table))) {
						expect(cols, `${name}.${col.name}`).toContain(col.name);
					}
				}

				if (k > 0) {
					const ascent = db
						.prepare(
							`SELECT a.comment, a.is_send, r.name FROM ascents a JOIN routes r ON r.id = a.route_id`
						)
						.get() as { comment: string; is_send: number; name: string };
					expect(ascent).toEqual({ comment: 'sample note', is_send: 1, name: 'Sample Route' });
					expect(db.prepare('SELECT title FROM goals').get()).toEqual({ title: 'Local goal' });
					expect(db.prepare('SELECT login FROM profiles').get()).toEqual({ login: 'sample' });
				}
				if (k >= FILES.indexOf('0008_app_settings.sql') + 1) {
					expect(
						db.prepare(`SELECT value FROM app_settings WHERE key = 'grade_system'`).get()
					).toEqual({
						value: 'french'
					});
				}
				if (k >= FILES.indexOf('0009_first_ascents.sql') + 1) {
					expect(db.prepare('SELECT kind FROM first_ascents').get()).toEqual({ kind: 'FFA' });
				}
				if (k >= FILES.indexOf('0012_route_info.sql') + 1) {
					expect(
						db
							.prepare('SELECT ascent_count, ascent_count_own, ascent_count_fetched_at FROM routes')
							.get()
					).toEqual({
						ascent_count: 7,
						ascent_count_own: k >= FILES.indexOf('0013_route_ascent_snapshot.sql') + 1 ? 2 : null,
						ascent_count_fetched_at: null
					});
				}
			} finally {
				db.close();
			}
		});
	}
});
