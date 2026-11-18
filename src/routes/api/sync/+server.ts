import { json } from '@sveltejs/kit';
import { canTriggerSync } from '#lib/server/auth';
import { runTheCragSync } from '#lib/server/sync';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, url, locals }) => {
	// The Docker worker sends x-worker-secret; a signed-in owner may also use it on a
	// password-protected install. Without APP_PASSWORD, `locals.authed` is true for every
	// visitor, so it cannot authorise anything: anonymous installs fail closed (#505).
	if (!canTriggerSync(request.headers.get('x-worker-secret'), locals.authed)) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
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
