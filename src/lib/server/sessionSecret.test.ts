import { randomBytes } from 'node:crypto';
import { expect, it } from 'vitest';
import { isUsableSessionSecret } from './sessionSecret';

it('rejects placeholder, dev and short session secrets', () => {
	for (const value of [
		'',
		'short',
		'change-me-to-a-long-random-string',
		'  Change-Me-To-A-Long-Random-String ',
		'dev-insecure-session-secret',
		'a-long-random-secret',
		'replace-me-with-something-long'
	])
		expect(isUsableSessionSecret(value), value).toBe(false);
});

it('accepts a long random secret', () => {
	expect(isUsableSessionSecret(randomBytes(32).toString('hex'))).toBe(true);
});
