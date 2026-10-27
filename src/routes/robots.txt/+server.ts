import { getSearchIndexing } from '#lib/server/appSettings';
import { robotsTxt } from '#lib/server/seo';
import type { RequestHandler } from './$types';

/** Dynamic robots.txt — follows the "Search engines" toggle in Settings. */
export const GET: RequestHandler = () =>
	new Response(robotsTxt(getSearchIndexing().allowed), {
		headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300' }
	});
