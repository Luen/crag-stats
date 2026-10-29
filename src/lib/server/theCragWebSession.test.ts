import { beforeEach, expect, it } from 'vitest';
import { wipeAllData } from './analytics';
import { db } from './db';
import { theCragWebSessions } from './db/schema';
import { forgetTheCragSession, theCragSessionStore } from './theCragWebSession';
import { syncIsCurrent } from './syncGeneration';

beforeEach(() => wipeAllData());

it('encrypts cookies and preserves flags/expiry across store instances and key rotation', () => {
	const saved = {
		cookies: [
			{
				name: 'session',
				value: 'synthetic-cookie-value',
				domain: 'www.thecrag.com',
				path: '/climber',
				secure: true,
				httpOnly: true,
				expires: '2027-01-01T00:00:00.000Z'
			}
		],
		nextAllowedAt: 42,
		failures: 2
	};
	theCragSessionStore('sample', 'synthetic-secret').save(saved);
	const row = db.select().from(theCragWebSessions).get()!;
	expect(JSON.stringify(row)).not.toContain('synthetic-cookie-value');
	expect(JSON.stringify(row)).not.toContain('synthetic-secret');
	expect(theCragSessionStore('sample', 'synthetic-secret').load()).toEqual(saved);
	expect(theCragSessionStore('sample', 'rotated-secret').load()).toEqual({ ...saved, cookies: [] });
	expect(theCragSessionStore('another-account', 'synthetic-secret').load().cookies).toEqual([]);
});

it('forget and wipe remove saved sessions and invalidate in-flight jobs', () => {
	const store = theCragSessionStore('sample', 'synthetic-secret');
	store.save({ cookies: [], nextAllowedAt: 42, failures: 1 });
	const current = syncIsCurrent();
	forgetTheCragSession();
	expect(current()).toBe(false);
	expect(db.select().from(theCragWebSessions).all()).toEqual([]);
	store.save({ cookies: [], nextAllowedAt: 42, failures: 1 });
	const beforeWipe = syncIsCurrent();
	wipeAllData();
	expect(beforeWipe()).toBe(false);
	expect(db.select().from(theCragWebSessions).all()).toEqual([]);
});
