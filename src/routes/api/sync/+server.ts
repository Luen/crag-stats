import { json } from '@sveltejs/kit';
import { env } from '#lib/server/env';
import { runTheCragSync } from '#lib/server/sync';
import type { RequestHandler } from './$types';

function authorized(request: Request) {
	const secret = env('SESSION_SECRET');
	if (!secret) return false;
	return request.headers.get('x-worker-secret') === secret;
}

export const POST: RequestHandler = async ({ request, url }) => {
	// Allow form-triggered sync from settings via same-origin cookie auth (hooks),
	// or worker via shared secret header.
	const fromWorker = authorized(request);
	if (!fromWorker && request.headers.get('sec-fetch-site') === null) {
		// still allow when hooks already authenticated the session
	}

	const full = url.searchParams.get('full') === '1';
	try {
		const result = await runTheCragSync({ full });
		return json({ ok: true, result });
	} catch (err) {
		return json(
			{ ok: false, error: err instanceof Error ? err.message : String(err) },
			{ status: 400 }
		);
	}
};
