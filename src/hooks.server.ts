import type { Handle } from '@sveltejs/kit/hooks';
import {
	isAuthEnabled,
	isProtectedPath,
	sessionCookieName,
	verifySessionToken,
	verifySharedSecret
} from '#lib/server/auth';
import { ensureSchema } from '#lib/server/db';
import { env } from '#lib/server/env';

ensureSchema();

const PUBLIC = new Set(['/login', '/logout', '/health']);

const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	if (path === '/health' || path.startsWith('/health/')) {
		const res = await resolve(event);
		for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
		return res;
	}

	// Worker can trigger sync with shared secret even when password gate is on
	if (path === '/api/sync') {
		const secret = env('SESSION_SECRET');
		const header = event.request.headers.get('x-worker-secret');
		if (verifySharedSecret(header, secret)) {
			const res = await resolve(event);
			for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
			return res;
		}
	}

	const token = event.cookies.get(sessionCookieName());
	const authed = verifySessionToken(token);
	event.locals.authed = !isAuthEnabled() || authed;

	if (isAuthEnabled() && isProtectedPath(path) && !PUBLIC.has(path) && !authed) {
		if (path.startsWith('/api/')) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json', ...SECURITY_HEADERS }
			});
		}
		return new Response(null, {
			status: 303,
			headers: {
				location: `/login?next=${encodeURIComponent(path)}`,
				...SECURITY_HEADERS
			}
		});
	}

	const res = await resolve(event);
	for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
	return res;
};
