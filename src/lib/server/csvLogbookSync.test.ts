import { readFileSync } from 'node:fs';
import { beforeEach, expect, it, vi } from 'vitest';
import { wipeAllData } from './analytics';
import { db } from './db';
import { ascents, profiles, theCragWebSessions } from './db/schema';
import { upsertAscents } from './ingest';
import { parseTheCragCsv } from './providers/thecrag/csv';
import { downloadLogbook } from './providers/thecrag/logbookSession';
import { syncTheCragCsv } from './csvLogbookSync';
import { syncIsCurrent } from './syncGeneration';
import { theCragSessionStore } from './theCragWebSession';

vi.mock('./env', () => ({
	env: (name: string) =>
		({
			THECRAG_USERNAME: 'sample',
			THECRAG_PASSWORD: 'synthetic-password',
			SESSION_SECRET: 'synthetic-secret'
		})[name] ?? ''
}));
vi.mock('./providers/thecrag/logbookSession', () => ({
	downloadLogbook: vi.fn(),
	openLogbookSession: vi.fn()
}));
const sample = parseTheCragCsv(readFileSync('samples/thecrag-logbook-sample.csv'));

beforeEach(() => {
	wipeAllData();
	vi.clearAllMocks();
});

it('imports a validated export atomically, preserves absent ascents, and creates a CSV profile', async () => {
	upsertAscents(sample);
	vi.mocked(downloadLogbook).mockResolvedValue([sample[0]]);
	await syncTheCragCsv(() => true);
	expect(db.select().from(ascents).all()).toHaveLength(sample.length);
	expect(db.select().from(profiles).get()).toMatchObject({ login: 'sample', ascentCount: 1 });
});

it('clears API-only profile fields so a shared API key cannot leave key-owner account stats', async () => {
	const updatedAt = new Date().toISOString();
	db.insert(profiles)
		.values({
			provider: 'thecrag',
			login: 'sample',
			name: 'Key Owner',
			externalId: '999',
			avatar: 'https://example.com/a.png',
			typeOfClimber: 'Sport climber',
			outdoorAscentCount: 800,
			indoorAscentCount: 10,
			heightClimbed: 50000,
			routesTicked: 500,
			rawJson: '{"routesTicked":500}',
			ascentCount: 1,
			updatedAt
		})
		.run();
	vi.mocked(downloadLogbook).mockResolvedValue([sample[0]]);
	const result = await syncTheCragCsv(() => true);
	expect(result.profileName).toBe('sample');
	expect(db.select().from(profiles).get()).toMatchObject({
		login: 'sample',
		name: 'sample',
		ascentCount: 1,
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

it('does not ingest an export returned after a wipe', async () => {
	const current = syncIsCurrent();
	vi.mocked(downloadLogbook).mockImplementationOnce(async () => {
		wipeAllData();
		return sample;
	});
	await expect(syncTheCragCsv(current)).rejects.toThrow('cancelled');
	expect(db.select().from(ascents).all()).toHaveLength(0);
	expect(db.select().from(profiles).all()).toHaveLength(0);
});

it('refuses to mix another account into an existing logbook', async () => {
	db.insert(profiles)
		.values({ provider: 'thecrag', login: 'another-account', updatedAt: new Date().toISOString() })
		.run();
	theCragSessionStore('another-account', 'synthetic-secret').save({
		cookies: [{ name: 'session', value: 'stale-other-account' }],
		nextAllowedAt: 0,
		failures: 0
	});
	await expect(syncTheCragCsv(() => true)).rejects.toThrow('differs from the saved profile');
	expect(downloadLogbook).not.toHaveBeenCalled();
	expect(db.select().from(theCragWebSessions).all()).toEqual([]);
});
