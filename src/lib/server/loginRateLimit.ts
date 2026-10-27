/**
 * In-memory login rate limit / lockout (per process).
 * Fine for single-node Docker homeserver; resets on restart.
 */

export type RateLimitDecision =
	| { ok: true; remaining: number }
	| { ok: false; retryAfterSec: number; message: string };

type Bucket = {
	fails: number;
	windowStart: number;
	lockedUntil: number;
};

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const MIN_ATTEMPT_GAP_MS = 750;

const lastAttempt = new Map<string, number>();

function now() {
	return Date.now();
}

export function clientKeyFromRequest(request: Request, getClientAddress?: () => string): string {
	const xf = request.headers.get('cf-connecting-ip')
		|| request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
		|| request.headers.get('x-real-ip');
	if (xf) return `ip:${xf}`;
	try {
		if (getClientAddress) return `ip:${getClientAddress()}`;
	} catch {
		/* ignore */
	}
	return 'ip:unknown';
}

export function checkLoginAllowed(key: string): RateLimitDecision {
	const t = now();
	const b = buckets.get(key);
	if (b && b.lockedUntil > t) {
		const retryAfterSec = Math.max(1, Math.ceil((b.lockedUntil - t) / 1000));
		return {
			ok: false,
			retryAfterSec,
			message: `Too many failed attempts. Try again in ${retryAfterSec}s.`
		};
	}

	const last = lastAttempt.get(key) ?? 0;
	if (t - last < MIN_ATTEMPT_GAP_MS) {
		return {
			ok: false,
			retryAfterSec: 1,
			message: 'Slow down — wait a moment before trying again.'
		};
	}

	if (b && t - b.windowStart > WINDOW_MS) {
		buckets.delete(key);
	}

	const remaining = Math.max(0, MAX_FAILS - (buckets.get(key)?.fails ?? 0));
	return { ok: true, remaining };
}

export function noteLoginAttempt(key: string) {
	lastAttempt.set(key, now());
}

export function noteLoginFailure(key: string): RateLimitDecision {
	const t = now();
	let b = buckets.get(key);
	if (!b || t - b.windowStart > WINDOW_MS) {
		b = { fails: 0, windowStart: t, lockedUntil: 0 };
	}
	b.fails += 1;
	if (b.fails >= MAX_FAILS) {
		b.lockedUntil = t + LOCK_MS;
	}
	buckets.set(key, b);

	if (b.lockedUntil > t) {
		const retryAfterSec = Math.max(1, Math.ceil((b.lockedUntil - t) / 1000));
		return {
			ok: false,
			retryAfterSec,
			message: `Too many failed attempts. Try again in ${retryAfterSec}s.`
		};
	}

	return {
		ok: true,
		remaining: Math.max(0, MAX_FAILS - b.fails)
	};
}

export function noteLoginSuccess(key: string) {
	buckets.delete(key);
	lastAttempt.delete(key);
}

/** Test helper */
export function _resetLoginRateLimitForTests() {
	buckets.clear();
	lastAttempt.clear();
}
