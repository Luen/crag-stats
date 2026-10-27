import { DOC_PAGES } from '#lib/docs';

/** Pure search-engine visibility rules (no DB) — see appSettings.ts and robots.txt. */

export type SearchIndexing = {
	/** Search engines may index public pages. */
	allowed: boolean;
	/** The whole UI is behind the app password, so indexing is always off. */
	forcedOff: boolean;
};

/**
 * Indexing defaults to allowed, except when AUTH_SCOPE=all gates the whole site
 * (crawlers would only ever see the login page).
 */
export function resolveSearchIndexing(input: {
	authEnabled: boolean;
	scope: 'settings' | 'all';
	stored: string | null;
}): SearchIndexing {
	if (input.authEnabled && input.scope === 'all') return { allowed: false, forcedOff: true };
	return { allowed: input.stored !== 'off', forcedOff: false };
}

/** Admin-only surfaces that should never be indexed, whatever the setting. */
export function isNoindexPath(pathname: string): boolean {
	return (
		pathname === '/login' ||
		pathname === '/logout' ||
		pathname === '/settings' ||
		pathname.startsWith('/settings/') ||
		pathname.startsWith('/api/')
	);
}

/** Public pages listed in sitemap.xml (admin/auth paths are never listed). */
export const SITEMAP_PATHS = [
	'/',
	'/logbook',
	'/projects',
	'/sectors',
	'/goals',
	'/rewind',
	'/docs',
	...DOC_PAGES.map((d) => `/docs/${d.slug}`)
];

/** robots.txt body for the current indexing state. */
export function robotsTxt(allowed: boolean, origin?: string): string {
	if (!allowed) return 'User-agent: *\nDisallow: /\n';
	return [
		'User-agent: *',
		'Allow: /',
		'Disallow: /settings',
		'Disallow: /login',
		'Disallow: /logout',
		'Disallow: /api/',
		...(origin ? ['', `Sitemap: ${origin}/sitemap.xml`] : []),
		''
	].join('\n');
}

function xmlEscape(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** sitemap.xml for the public pages. */
export function sitemapXml(origin: string, paths: readonly string[] = SITEMAP_PATHS): string {
	const urls = paths.map((p) => `  <url><loc>${xmlEscape(origin + p)}</loc></url>`).join('\n');
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		urls,
		'</urlset>',
		''
	].join('\n');
}
