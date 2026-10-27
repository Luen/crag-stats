import { building } from '$app/env';
import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import {
	isAuthEnabled,
	isProtectedPath,
	sessionCookieName,
	verifySessionToken,
	verifySharedSecret
} from '#lib/server/auth';
import { getSearchIndexing } from '#lib/server/appSettings';
import { ensureSchema } from '#lib/server/db';
import { env } from '#lib/server/env';
import { startScheduler } from '#lib/server/scheduler';
import { isNoindexPath } from '#lib/server/seo';

ensureSchema();

// Runs once when the Node server boots (not per request): daily cron + an
// immediate first sync on a fresh install. No-op without THECRAG_API_KEY.
export const init: ServerInit = () => {
	if (!building) startScheduler();
};

const PUBLIC = new Set(['/login', '/logout', '/health', '/robots.txt']);

const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

function finish(res: Response, path: string): Response {
	for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
	// Search-engine visibility (Settings toggle; always off behind AUTH_SCOPE=all and on admin paths).
	if (isNoindexPath(path) || !getSearchIndexing().allowed) {
		res.headers.set('X-Robots-Tag', 'noindex, nofollow');
	}
	return res;
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	if (path === '/health' || path.startsWith('/health/')) {
		return finish(await resolve(event), path);
	}

	// Worker can trigger sync with shared secret even when password gate is on
	if (path === '/api/sync') {
		const secret = env('SESSION_SECRET');
		const header = event.request.headers.get('x-worker-secret');
		if (verifySharedSecret(header, secret)) {
			return finish(await resolve(event), path);
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
		return finish(
			new Response(null, {
				status: 303,
				headers: { location: `/login?next=${encodeURIComponent(path)}` }
			}),
			path
		);
	}

	return finish(await resolve(event), path);
};
