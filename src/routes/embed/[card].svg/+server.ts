import { error } from '@sveltejs/kit';
import { getDashboardStats, parseGradeSystem } from '#lib/server/analytics';
import { getPreferredGradeSystem } from '#lib/server/appSettings';
import { isEmbedCard, parseEmbedTheme, renderEmbedCard } from '#lib/server/embedCards';
import type { RequestHandler } from './$types';

/** Dynamic SVG stat card for `<img>` embeds (see /share). */
export const GET: RequestHandler = ({ params, url }) => {
	if (!isEmbedCard(params.card)) error(404, 'Unknown card');
	const system = url.searchParams.get('system');
	const stats = getDashboardStats(system ? parseGradeSystem(system) : getPreferredGradeSystem());
	const svg = renderEmbedCard(params.card, stats, parseEmbedTheme(url.searchParams.get('theme')));
	return new Response(svg, {
		headers: {
			'content-type': 'image/svg+xml; charset=utf-8',
			// Blogs hot-link these; an hour keeps them fresh after the daily sync.
			'cache-control': 'public, max-age=3600',
			'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'",
			'cross-origin-resource-policy': 'cross-origin'
		}
	});
};
