import { error } from '@sveltejs/kit';
import { applyDisplaySystemOverrides } from '#lib/grades';
import { getDashboardStats } from '#lib/server/analytics';
import { getDisplayGradeSystems } from '#lib/server/appSettings';
import { isEmbedCard, parseEmbedTheme, renderEmbedCard } from '#lib/server/embedCards';
import type { RequestHandler } from './$types';

/** Dynamic SVG stat card for `<img>` embeds (see /share). */
export const GET: RequestHandler = ({ params, url }) => {
	if (!isEmbedCard(params.card)) error(404, 'Unknown card');
	const stats = getDashboardStats(
		applyDisplaySystemOverrides(getDisplayGradeSystems(), url.searchParams)
	);
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
