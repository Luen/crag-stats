/**
 * Apply pending SQL migrations from /migrations (or MIGRATIONS_DIR).
 * Safe to run on every boot — tracks applied files in schema_migrations.
 */
import Database from 'better-sqlite3';
import { readdirSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const migrationsDir = process.env.MIGRATIONS_DIR || join(root, 'migrations');
const dbPath = process.env.DATABASE_PATH || './data/crag-stats.sqlite';

export function runMigrations(databasePath = dbPath) {
	mkdirSync(dirname(databasePath), { recursive: true });
	const db = new Database(databasePath);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');

	db.exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id TEXT PRIMARY KEY,
			applied_at TEXT NOT NULL
		);
	`);

	if (!existsSync(migrationsDir)) {
		console.warn(`[migrate] no migrations directory at ${migrationsDir}`);
		db.close();
		return { applied: [] };
	}

	const files = readdirSync(migrationsDir)
		.filter((f) => f.endsWith('.sql'))
		.sort();

	const applied = [];
	const insert = db.prepare(`INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)`);
	const has = db.prepare(`SELECT 1 AS ok FROM schema_migrations WHERE id = ?`);

	for (const file of files) {
		if (has.get(file)) continue;
		const sql = readFileSync(join(migrationsDir, file), 'utf8');
		const tx = db.transaction(() => {
			db.exec(sql);
			insert.run(file, new Date().toISOString());
		});
		tx();
		applied.push(file);
		console.log(`[migrate] applied ${file}`);
	}

	db.close();
	return { applied };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
	const result = runMigrations();
	console.log(
		result.applied.length ? `[migrate] done (${result.applied.length} new)` : '[migrate] up to date'
	);
}
