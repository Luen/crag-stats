import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { theCragWebSessions } from './db/schema';
import type { LogbookSessionStore, SavedCookie } from './providers/thecrag/logbookSession';
import { invalidateLogbookSync } from './syncGeneration';

/** Server-only encrypted cookie store. Bound to both the configured account and secret. */
export function theCragSessionStore(username: string, secret: string): LogbookSessionStore {
	if (!secret) throw new Error('SESSION_SECRET is required for encrypted theCrag login storage.');
	const accountKey = createHash('sha256').update(username.toLowerCase()).digest('hex');
	const key = createHash('sha256').update(`thecrag-web-session:${secret}`).digest();
	const aad = Buffer.from(accountKey);
	return {
		load() {
			ensureSchema();
			const row = db
				.select()
				.from(theCragWebSessions)
				.where(eq(theCragWebSessions.accountKey, accountKey))
				.get();
			let cookies: SavedCookie[] = [];
			if (row) {
				try {
					const [iv, tag, payload] = row.encryptedCookies
						.split('.')
						.map((p) => Buffer.from(p, 'base64'));
					const decipher = createDecipheriv('aes-256-gcm', key, iv);
					decipher.setAAD(aad);
					decipher.setAuthTag(tag);
					cookies = JSON.parse(
						Buffer.concat([decipher.update(payload), decipher.final()]).toString('utf8')
					);
				} catch {
					// Rotating SESSION_SECRET requires a new login; drop unusable cookies and stale pause.
					return { cookies: [], nextAllowedAt: 0, failures: 0 };
				}
			}
			return { cookies, nextAllowedAt: row?.nextAllowedAt ?? 0, failures: row?.failures ?? 0 };
		},
		save(state) {
			ensureSchema();
			const iv = randomBytes(12);
			const cipher = createCipheriv('aes-256-gcm', key, iv);
			cipher.setAAD(aad);
			const payload = Buffer.concat([cipher.update(JSON.stringify(state.cookies)), cipher.final()]);
			const encryptedCookies = [iv, cipher.getAuthTag(), payload]
				.map((p) => p.toString('base64'))
				.join('.');
			// A single installation has one owner. Changing accounts drops the previous jar.
			db.transaction(() => {
				db.delete(theCragWebSessions).run();
				db.insert(theCragWebSessions)
					.values({
						accountKey,
						encryptedCookies,
						nextAllowedAt: state.nextAllowedAt,
						failures: state.failures
					})
					.run();
			});
		}
	};
}

export function forgetTheCragSession() {
	invalidateLogbookSync();
	ensureSchema();
	db.delete(theCragWebSessions).run();
}
