import { count, eq } from 'drizzle-orm';
import { assertCsvExportPlausibleForPrune } from './csvPruneGuard';
import { db, ensureSchema } from './db';
import { ascents, profiles } from './db/schema';
import { env } from './env';
import { reconcileProviderAscents, upsertAscents, upsertProfile } from './ingest';
import { downloadLogbook, openLogbookSession } from './providers/thecrag/logbookSession';
import { forgetTheCragSession, theCragSessionStore } from './theCragWebSession';

const PROVIDER = 'thecrag';

/**
 * Download the CSV export, upsert, then prune local ascents missing from the file
 * (CSV as source of truth, #217). Refuses the whole sync — no writes — when the
 * export is empty against a non-empty cache or drops more than half of a large
 * logbook in one run (likely a truncated download).
 */
export async function syncTheCragCsv(stillCurrent: () => boolean) {
	const username = env('THECRAG_USERNAME').trim();
	ensureSchema();
	const profile = db.select().from(profiles).where(eq(profiles.provider, PROVIDER)).get();
	if (profile?.login && profile.login.toLowerCase() !== username.toLowerCase()) {
		// Drop the previous account's encrypted jar so a DB backup cannot keep old cookies.
		forgetTheCragSession();
		throw new Error(
			'The configured theCrag username differs from the saved profile. Wipe local data before switching accounts.'
		);
	}
	const rows = await downloadLogbook(
		{ username, password: env('THECRAG_PASSWORD') },
		theCragSessionStore(username, env('SESSION_SECRET')),
		{
			open: openLogbookSession,
			now: Date.now,
			sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
			stillCurrent
		}
	);
	if (!stillCurrent())
		throw new Error(
			'Logbook download cancelled because local data or the saved login was cleared.'
		);

	return db.transaction(
		() => {
			// Count after the download, under the same write lock as the import. A
			// manual import may have completed while the network request was pending.
			const localCount =
				db.select({ n: count() }).from(ascents).where(eq(ascents.provider, PROVIDER)).get()?.n ?? 0;
			assertCsvExportPlausibleForPrune(localCount, rows.length);
			upsertAscents(rows);
			const pruned = reconcileProviderAscents(
				PROVIDER,
				rows.map((a) => a.externalId),
				{ expectedCount: rows.length }
			);
			// CSV identity only — never retain the shared API key owner's account stats.
			upsertProfile({
				provider: PROVIDER,
				login: username,
				name: username,
				ascentCount: rows.length,
				externalId: null,
				avatar: null,
				typeOfClimber: null,
				outdoorAscentCount: null,
				indoorAscentCount: null,
				heightClimbed: null,
				routesTicked: null,
				rawJson: null
			});
			return { count: rows.length, profileName: username, pruned };
		},
		{ behavior: 'immediate' }
	);
}
