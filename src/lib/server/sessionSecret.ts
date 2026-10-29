const PLACEHOLDERS = new Set([
	'change-me-to-a-long-random-string',
	'dev-insecure-session-secret',
	'changeme',
	'change-me',
	'secret',
	'password',
	'session-secret',
	'a-long-random-secret'
]);

/**
 * CSV mode encrypts saved theCrag cookies with SESSION_SECRET. Reject the documented
 * example/dev placeholders and very short values so a copied `.env.example` can't be used.
 */
export function isUsableSessionSecret(secret: string): boolean {
	const value = secret.trim();
	if (value.length < 16) return false;
	const lower = value.toLowerCase();
	if (PLACEHOLDERS.has(lower)) return false;
	return !/^(change[-_ ]?me|replace[-_ ]?me|your[-_ ]?secret)/.test(lower);
}
