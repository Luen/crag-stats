import { eq } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { profiles } from './db/schema';
import { env } from './env';
import { upsertAscents, upsertProfile } from './ingest';
import { downloadLogbook, openLogbookSession } from './providers/thecrag/logbookSession';
import { theCragSessionStore } from './theCragWebSession';

/** CSV exports are upsert-only. Never prune local ascents on this path. */
export async function syncTheCragCsv(stillCurrent: () => boolean) {
	const username = env('THECRAG_USERNAME').trim();
	ensureSchema();
	const profile = db.select().from(profiles).where(eq(profiles.provider, 'thecrag')).get();
	if (profile?.login && profile.login.toLowerCase() !== username.toLowerCase()) {
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
		if (profile) {
			db.update(profiles)
				.set({ login: username, ascentCount: ascents.length, updatedAt: new Date().toISOString() })
				.where(eq(profiles.id, profile.id))
				.run();
		} else {
			upsertProfile({
				provider: 'thecrag',
				login: username,
				name: username,
				ascentCount: ascents.length
			});
		}
	});
	return { count: ascents.length, profileName: profile?.name ?? username };
}
