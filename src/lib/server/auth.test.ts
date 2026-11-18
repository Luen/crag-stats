import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { timingSafeEqualString, verifySharedSecret } from './cryptoCompare';
import { safeRedirectPath } from './safeRedirect';
import { canTriggerSync } from './auth';
import {
	_resetLoginRateLimitForTests,
	checkLoginAllowed,
	noteLoginAttempt,
	noteLoginFailure,
	noteLoginSuccess
} from './loginRateLimit';

describe('safeRedirectPath', () => {
	it('allows relative paths with query', () => {
		expect(safeRedirectPath('/settings')).toBe('/settings');
		expect(safeRedirectPath('/logbook?style=sport')).toBe('/logbook?style=sport');
	});

	it('rejects open redirects', () => {
		expect(safeRedirectPath('https://evil.example')).toBe('/');
		expect(safeRedirectPath('//evil.example')).toBe('/');
		expect(safeRedirectPath('/\\evil')).toBe('/');
		expect(safeRedirectPath('settings')).toBe('/');
		expect(safeRedirectPath('@evil')).toBe('/');
	});

	it('uses fallback', () => {
		expect(safeRedirectPath(null, '/settings')).toBe('/settings');
		expect(safeRedirectPath('//x', '/settings')).toBe('/settings');
	});
});

describe('timingSafeEqualString', () => {
	it('matches equal strings including empty', () => {
		expect(timingSafeEqualString('secret', 'secret')).toBe(true);
		expect(timingSafeEqualString('', '')).toBe(true);
	});

	it('rejects unequal content and length (incl. NUL padding tricks)', () => {
		expect(timingSafeEqualString('secret', 'Secret')).toBe(false);
		expect(timingSafeEqualString('ab', 'a')).toBe(false);
		expect(timingSafeEqualString('a\0', 'a')).toBe(false);
	});
});

describe('verifySharedSecret', () => {
	it('accepts matching secrets', () => {
		expect(verifySharedSecret('abc', 'abc')).toBe(true);
	});

	it('rejects mismatches and empties', () => {
		expect(verifySharedSecret('abc', 'xyz')).toBe(false);
		expect(verifySharedSecret(null, 'abc')).toBe(false);
		expect(verifySharedSecret('abc', '')).toBe(false);
	});
});

describe('canTriggerSync', () => {
	const original = { secret: process.env.SESSION_SECRET, password: process.env.APP_PASSWORD };

	beforeEach(() => {
		process.env.SESSION_SECRET = 'worker-secret-for-tests';
		delete process.env.APP_PASSWORD;
	});

	afterEach(() => {
		process.env.SESSION_SECRET = original.secret ?? '';
		process.env.APP_PASSWORD = original.password ?? '';
	});

	it('accepts the worker secret', () => {
		expect(canTriggerSync('worker-secret-for-tests', false)).toBe(true);
	});

	it('rejects anonymous callers on an install with no password', () => {
		// With APP_PASSWORD unset every visitor is `authed`, which must not start a sync (#505).
		expect(canTriggerSync(null, true)).toBe(false);
		expect(canTriggerSync('wrong-secret', true)).toBe(false);
	});

	it('accepts an owner session only when a password is configured', () => {
		process.env.APP_PASSWORD = 'owner-password';
		expect(canTriggerSync(null, true)).toBe(true);
		expect(canTriggerSync(null, false)).toBe(false);
		expect(canTriggerSync('wrong-secret', false)).toBe(false);
	});

	it('fails closed when no secret is configured', () => {
		process.env.SESSION_SECRET = '';
		expect(canTriggerSync('anything', false)).toBe(false);
	});
});

describe('loginRateLimit', () => {
	it('locks after repeated failures', () => {
		_resetLoginRateLimitForTests();
		const key = 'ip:test-lock';
		for (let i = 0; i < 5; i++) {
			const r = noteLoginFailure(key);
			if (i < 4) expect(r.ok).toBe(true);
			else expect(r.ok).toBe(false);
		}
		const gate = checkLoginAllowed(key);
		expect(gate.ok).toBe(false);
		if (!gate.ok) expect(gate.retryAfterSec).toBeGreaterThan(0);
	});

	it('clears on success', () => {
		_resetLoginRateLimitForTests();
		const key = 'ip:test-ok';
		noteLoginFailure(key);
		noteLoginSuccess(key);
		expect(checkLoginAllowed(key).ok).toBe(true);
	});

	it('enforces min gap between attempts', () => {
		_resetLoginRateLimitForTests();
		const key = 'ip:test-gap';
		expect(checkLoginAllowed(key).ok).toBe(true);
		noteLoginAttempt(key);
		const gated = checkLoginAllowed(key);
		expect(gated.ok).toBe(false);
	});
});
