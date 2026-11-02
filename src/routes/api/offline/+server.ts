import { json } from '@sveltejs/kit';
import { buildOfflineSnapshot, offlineAllowed, offlineRevision } from '#lib/server/offline';
import { OFFLINE_MAX_BYTES } from '#lib/offline';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const headers = { 'cache-control': 'no-store', 'x-crag-offline': 'public' };
	if (!offlineAllowed())
		return json(
			{ error: 'Offline downloads are disabled for protected sites.' },
			{ status: 403, headers }
		);
	if (url.searchParams.has('policy')) return json({ revision: offlineRevision() }, { headers });
	const body = JSON.stringify(buildOfflineSnapshot());
	if (Buffer.byteLength(body) > OFFLINE_MAX_BYTES)
		return json(
			{ error: 'This logbook exceeds the offline download size limit.' },
			{ status: 413, headers }
		);
	return new Response(body, { headers: { ...headers, 'content-type': 'application/json' } });
};
