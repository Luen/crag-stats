import { createHmac, timingSafeEqual } from 'node:crypto';
import { timingSafeEqualString, verifySharedSecret } from './cryptoCompare';
import { env } from './env';

export { verifySharedSecret };

const COOKIE = 'crag_stats_session';

function secret() {
	return env('SESSION_SECRET', 'dev-insecure-session-secret');
}

export type AuthScope = 'settings' | 'all';

export function isAuthEnabled() {
	return Boolean(env('APP_PASSWORD').trim());
}

/** `settings` = protect admin surfaces only; `all` = entire UI. Default settings. */
export function authScope(): AuthScope {
	const raw = env('AUTH_SCOPE', 'settings').trim().toLowerCase();
	return raw === 'all' ? 'all' : 'settings';
}

/** Paths that require a session when AUTH_SCOPE=settings. */
export function isProtectedPath(pathname: string): boolean {
	if (!isAuthEnabled()) return false;
	if (authScope() === 'all') return true;
	if (pathname === '/settings' || pathname.startsWith('/settings/')) return true;
	// Browser-triggered sync should not be anonymous when a password is set
	if (pathname === '/api/sync') return true;
	return false;
}

/**
 * Constant-time password check via HMAC digests so length differences
 * do not short-circuit (unlike raw Buffer compare of unequal lengths).
 */
export function verifyPassword(password: string) {
	const expected = env('APP_PASSWORD');
	if (!expected) return true;
	return timingSafeEqualString(`pw:${secret()}:${password}`, `pw:${secret()}:${expected}`);
}

export { safeRedirectPath } from './safeRedirect';

export function createSessionToken() {
	const exp = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
	const payload = `ok.${exp}`;
	const sig = createHmac('sha256', secret()).update(payload).digest('hex');
	return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
	if (!isAuthEnabled()) return true;
	if (!token) return false;
	const parts = token.split('.');
	if (parts.length !== 3) return false;
	const [ok, expStr, sig] = parts;
	if (ok !== 'ok') return false;
	const exp = Number(expStr);
	if (!exp || Date.now() > exp) return false;
	const payload = `${ok}.${expStr}`;
	const expected = createHmac('sha256', secret()).update(payload).digest('hex');
	try {
		return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
	} catch {
		return false;
	}
}

export function sessionCookieName() {
	return COOKIE;
}

export function sessionCookieOptions() {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 30
	};
}
