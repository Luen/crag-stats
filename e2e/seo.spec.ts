import { expect, test } from '@playwright/test';

test('search-engine toggle drives robots.txt, sitemap and noindex', async ({ page, request }) => {
	expect(await (await request.get('/robots.txt')).text()).toContain('Allow: /');
	expect((await request.get('/sitemap.xml')).status()).toBe(200);
	await page.goto('/');
	await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);

	await page.goto('/settings');
	await page.getByLabel(/Show in search engines/).uncheck();
	await page.getByRole('button', { name: 'Save preferences' }).click();
	await expect(page.getByText('Preferences saved.')).toBeVisible();

	expect(await (await request.get('/robots.txt')).text()).toBe('User-agent: *\nDisallow: /\n');
	expect((await request.get('/sitemap.xml')).status()).toBe(404);
	expect((await request.get('/')).headers()['x-robots-tag']).toBe('noindex, nofollow');

	// Restore the default for other tests.
	await page.goto('/settings');
	await page.getByLabel(/Show in search engines/).check();
	await page.getByRole('button', { name: 'Save preferences' }).click();
	await expect(page.getByText('Preferences saved.')).toBeVisible();
	expect(await (await request.get('/robots.txt')).text()).toContain('Allow: /');
});
