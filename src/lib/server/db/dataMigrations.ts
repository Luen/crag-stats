import { eq, sql } from 'drizzle-orm';
import { db, ensureSchema } from './index';
import { appSettings } from './schema';
import { refreshProjects } from '../projects';
import { repairGradesFromRawJson } from '../repairGrades';

const GRADE_SYSTEMS = new Set(['ewbank', 'french', 'yds', 'v_scale', 'font']);

/**
 * #84 dropped the PREFERRED_GRADE_SYSTEM and SHOW_PRIVATE_NOTES env vars. Keep what an
 * upgraded install had configured there, unless Settings already holds a value.
 */
export function legacyEnvSettings(
	envVars: Record<string, string | undefined>,
	stored: { gradeSystem: string | null; showNotes: string | null }
): { grade_system?: string; show_notes?: 'on' } {
	const out: { grade_system?: string; show_notes?: 'on' } = {};
	const system = envVars.PREFERRED_GRADE_SYSTEM?.trim().toLowerCase();
	if (!stored.gradeSystem && system && GRADE_SYSTEMS.has(system)) out.grade_system = system;
	const notes = envVars.SHOW_PRIVATE_NOTES?.trim().toLowerCase();
	if (!stored.showNotes && notes && ['1', 'true', 'yes', 'on'].includes(notes)) {
		out.show_notes = 'on';
	}
	return out;
}

// Append only, like SQL migrations. The data: prefix keeps these IDs separate
// from SQL file names in the same durable migration ledger.
const MIGRATIONS = [
	{
		id: 'data:0001_repair_cached_grades',
		apply: () => {
			repairGradesFromRawJson();
			refreshProjects();
		}
	},
	{
		id: 'data:0002_legacy_env_settings',
		apply: () => {
			// Plain table access: appSettings.ts pulls in the Kit env module, which tests can't load.
			const stored = (key: string) =>
				db.select().from(appSettings).where(eq(appSettings.key, key)).get()?.value ?? null;
			const carry = legacyEnvSettings(process.env, {
				gradeSystem: stored('grade_system'),
				showNotes: stored('show_notes')
			});
			const updatedAt = new Date().toISOString();
			for (const [key, value] of Object.entries(carry)) {
				db.insert(appSettings).values({ key, value, updatedAt }).run();
			}
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
