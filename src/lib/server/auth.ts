import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from './env';

const COOKIE = 'crag_stats_session';

function secret() {
	return env('SESSION_SECRET', 'dev-insecure-session-secret');
}

export function isAuthEnabled() {
	return Boolean(env('APP_PASSWORD').trim());
}

export function verifyPassword(password: string) {
	const expected = env('APP_PASSWORD');
	if (!expected) return true;
	const a = Buffer.from(password);
	const b = Buffer.from(expected);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

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
