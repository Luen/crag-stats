import type { Handle } from '@sveltejs/kit/hooks';
import {
	isAuthEnabled,
	isProtectedPath,
	sessionCookieName,
	verifySessionToken
} from '#lib/server/auth';
import { ensureSchema } from '#lib/server/db';
import { env } from '#lib/server/env';

ensureSchema();

const PUBLIC = new Set(['/login', '/health']);

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	if (path === '/health' || path.startsWith('/health/')) {
		return resolve(event);
	}

	// Worker can trigger sync with shared secret even when password gate is on
	if (path === '/api/sync') {
		const secret = env('SESSION_SECRET');
		const header = event.request.headers.get('x-worker-secret');
		if (secret && header === secret) {
			return resolve(event);
		}
	}

	const token = event.cookies.get(sessionCookieName());
	const authed = verifySessionToken(token);
	event.locals.authed = !isAuthEnabled() || authed;

	if (isAuthEnabled() && isProtectedPath(path) && !PUBLIC.has(path) && !authed) {
		if (path.startsWith('/api/')) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			});
		}
		return new Response(null, {
			status: 303,
			headers: { location: `/login?next=${encodeURIComponent(path)}` }
		});
	}

	return resolve(event);
};
