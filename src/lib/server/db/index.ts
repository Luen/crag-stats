import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from './schema';

const rootDir = join(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const dbPath = process.env.DATABASE_PATH || process.env.DATABASE_URL || './data/crag-stats.sqlite';

mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

let migrated = false;

/**
 * Apply versioned SQL migrations from /migrations on boot.
 * Homeserver image upgrades pick up new migration files automatically.
 */
export function ensureSchema() {
	if (migrated) return;
	runMigrations(sqlite, resolveMigrationsDir());
	migrated = true;
}

/**
 * MIGRATIONS_DIR wins; otherwise the source-relative path (dev) or ./migrations from the
 * working directory. The bundled server (`node build`) lives at a different depth, so the
 * source-relative guess misses there and a fresh DB would get no tables.
 */
function resolveMigrationsDir(): string {
	const candidates = [
		process.env.MIGRATIONS_DIR,
		join(rootDir, 'migrations'),
		join(process.cwd(), 'migrations')
	].filter((d): d is string => Boolean(d));
	return candidates.find((d) => existsSync(d)) ?? candidates[0];
}

function runMigrations(database: Database.Database, migrationsDir: string) {
	database.exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id TEXT PRIMARY KEY,
			applied_at TEXT NOT NULL
		);
	`);

	if (!existsSync(migrationsDir)) {
		console.warn(`[db] migrations directory missing: ${migrationsDir}`);
		return;
	}

	const files = readdirSync(migrationsDir)
		.filter((f) => f.endsWith('.sql'))
		.sort();
	const has = database.prepare(`SELECT 1 AS ok FROM schema_migrations WHERE id = ?`);
	const insert = database.prepare(`INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)`);

	for (const file of files) {
		if (has.get(file)) continue;
		const sql = readFileSync(join(migrationsDir, file), 'utf8');
		const apply = database.transaction(() => {
			database.exec(sql);
			insert.run(file, new Date().toISOString());
		});
		apply();
		console.log(`[db] applied migration ${file}`);
	}
}

export { schema };
