import { error } from '@sveltejs/kit';
import { getSearchIndexing } from '#lib/server/appSettings';
import { sitemapXml } from '#lib/server/seo';
import type { RequestHandler } from './$types';

/** Public-page sitemap; 404 when "Show in search engines" is off (#44). */
export const GET: RequestHandler = ({ url }) => {
	if (!getSearchIndexing().allowed) error(404, 'Not found');
	return new Response(sitemapXml(url.origin), {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
