import { sql } from 'drizzle-orm';
import { db, ensureSchema } from './index';
import { refreshProjects } from '../projects';
import { repairGradesFromRawJson } from '../repairGrades';

// Append only, like SQL migrations. The data: prefix keeps these IDs separate
// from SQL file names in the same durable migration ledger.
const MIGRATIONS = [
	{
		id: 'data:0001_repair_cached_grades',
		apply: () => {
			repairGradesFromRawJson();
			refreshProjects();
		}
	}
];

/** Run after schema migrations, before serving requests or starting scheduled work. */
export function runDataMigrations(): string[] {
	ensureSchema();
	const applied: string[] = [];
	for (const migration of MIGRATIONS) {
		db.transaction(
			() => {
				if (db.get(sql`SELECT id FROM schema_migrations WHERE id = ${migration.id}`)) return;
				migration.apply();
				db.run(sql`INSERT INTO schema_migrations (id, applied_at)
					VALUES (${migration.id}, ${new Date().toISOString()})`);
				applied.push(migration.id);
			},
			// Serialize concurrent server starts before checking the marker. Both the
			// repair and its marker roll back on failure, so a later boot retries it.
			{ behavior: 'immediate' }
		);
	}
	return applied;
}
