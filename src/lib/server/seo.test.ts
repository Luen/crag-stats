import { describe, expect, it } from 'vitest';
import { isNoindexPath, resolveSearchIndexing, robotsTxt, sitemapXml } from './seo';

describe('resolveSearchIndexing', () => {
	it('defaults to allowed', () => {
		expect(resolveSearchIndexing({ authEnabled: false, scope: 'settings', stored: null })).toEqual({
			allowed: true,
			forcedOff: false
		});
		expect(
			resolveSearchIndexing({ authEnabled: true, scope: 'settings', stored: null }).allowed
		).toBe(true);
	});

	it('respects the stored opt-out', () => {
		expect(
			resolveSearchIndexing({ authEnabled: false, scope: 'settings', stored: 'off' }).allowed
		).toBe(false);
		expect(
			resolveSearchIndexing({ authEnabled: false, scope: 'settings', stored: 'on' }).allowed
		).toBe(true);
	});

	it('is forced off when the whole site is password protected', () => {
		expect(resolveSearchIndexing({ authEnabled: true, scope: 'all', stored: 'on' })).toEqual({
			allowed: false,
			forcedOff: true
		});
		// AUTH_SCOPE=all without APP_PASSWORD gates nothing, so the setting applies.
		expect(resolveSearchIndexing({ authEnabled: false, scope: 'all', stored: null }).allowed).toBe(
			true
		);
	});
});

describe('isNoindexPath', () => {
	it('flags admin surfaces only', () => {
		for (const p of ['/login', '/logout', '/settings', '/settings/export', '/api/sync']) {
			expect(isNoindexPath(p)).toBe(true);
		}
		for (const p of ['/', '/logbook', '/settingsfoo']) expect(isNoindexPath(p)).toBe(false);
	});
});

describe('robotsTxt', () => {
	it('blocks everything when indexing is off', () => {
		expect(robotsTxt(false)).toBe('User-agent: *\nDisallow: /\n');
	});

	it('allows public pages but not admin paths when on', () => {
		const txt = robotsTxt(true);
		expect(txt).toContain('Allow: /');
		expect(txt).toContain('Disallow: /settings');
		expect(txt).not.toMatch(/^Disallow: \/$/m);
	});
});

describe('sitemap', () => {
	it('robots.txt links the sitemap only when indexing is on', () => {
		expect(robotsTxt(true, 'https://crag.example')).toContain(
			'Sitemap: https://crag.example/sitemap.xml'
		);
		expect(robotsTxt(false, 'https://crag.example')).not.toContain('Sitemap');
	});

	it('lists public pages with absolute URLs and no admin paths', () => {
		const xml = sitemapXml('https://crag.example');
		expect(xml).toContain('<loc>https://crag.example/logbook</loc>');
		expect(xml).not.toContain('/settings');
		expect(xml).not.toContain('/login');
	});
});
