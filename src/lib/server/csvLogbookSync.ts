import { eq } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { profiles } from './db/schema';
import { env } from './env';
import { upsertAscents, upsertProfile } from './ingest';
import { downloadLogbook, openLogbookSession } from './providers/thecrag/logbookSession';
import { forgetTheCragSession, theCragSessionStore } from './theCragWebSession';

/** CSV exports are upsert-only. Never prune local ascents on this path. */
export async function syncTheCragCsv(stillCurrent: () => boolean) {
	const username = env('THECRAG_USERNAME').trim();
	ensureSchema();
	const profile = db.select().from(profiles).where(eq(profiles.provider, 'thecrag')).get();
	if (profile?.login && profile.login.toLowerCase() !== username.toLowerCase()) {
		// Drop the previous account's encrypted jar so a DB backup cannot keep old cookies.
		forgetTheCragSession();
		throw new Error(
			'The configured theCrag username differs from the saved profile. Wipe local data before switching accounts.'
		);
	}
	const ascents = await downloadLogbook(
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
	db.transaction(() => {
		upsertAscents(ascents);
		// CSV identity only — clear API account fields so a shared THECRAG_API_KEY
		// (route history) cannot leave key-owner stats on the profile. Null rawJson
		// also stops analytics from backfilling account JSON into the columns.
		upsertProfile({
			provider: 'thecrag',
			login: username,
			name: username,
			ascentCount: ascents.length,
			externalId: null,
			avatar: null,
			typeOfClimber: null,
			outdoorAscentCount: null,
			indoorAscentCount: null,
			heightClimbed: null,
			routesTicked: null,
			rawJson: null
		});
	});
	return { count: ascents.length, profileName: username };
}
