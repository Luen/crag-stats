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

/** robots.txt body for the current indexing state. */
export function robotsTxt(allowed: boolean): string {
	if (!allowed) return 'User-agent: *\nDisallow: /\n';
	return [
		'User-agent: *',
		'Allow: /',
		'Disallow: /settings',
		'Disallow: /login',
		'Disallow: /logout',
		'Disallow: /api/',
		''
	].join('\n');
}
