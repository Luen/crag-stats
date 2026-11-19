import { expect, test } from '@playwright/test';
import Database from 'better-sqlite3';

// E2E servers run on localhost, so /share must warn that others can't load the links.
test('share page warns when the site is on a local address', async ({ page }) => {
	await page.goto('/share');
	const note = page.getByRole('note');
	await expect(note).toContainText('Only you can see these right now');
	await expect(note).toContainText('localhost');
});

test('share pins the resolved language and SVG requests respect Auto, Settings, and overrides', async ({
	browser,
	request
}) => {
	const page = await browser.newPage({ locale: 'de-DE' });
	const db = new Database('e2e/.tmp/open.sqlite');
	const saved = db.prepare('SELECT value FROM app_settings WHERE key = ?').get('locale') as
		{ value: string } | undefined;
	const set = (value: string) =>
		db
			.prepare('INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)')
			.run('locale', value, new Date().toISOString());
	try {
		set('auto');
		await page.setExtraHTTPHeaders({ 'Accept-Language': 'de-DE,de;q=0.9' });
		await page.goto('/share');
		await expect(page.locator('img[src*="/embed/"]').first()).toHaveAttribute(
			'src',
			/\?locale=de$/
		);
		await expect(page.locator('textarea').first()).toHaveValue(/summary\.svg\?locale=de/);
		await page.locator('input[value="dark"]').check();
		await expect(page.locator('img[src*="/embed/"]').first()).toHaveAttribute(
			'src',
			/\?locale=de&theme=dark$/
		);
		await expect(page.locator('textarea').first()).toHaveValue(
			/summary\.svg\?locale=de&theme=dark/
		);
		const auto = await request.get('/embed/summary.svg', {
			headers: { 'Accept-Language': 'de-DE' }
		});
		expect(await auto.text()).toContain('Begehungen');
		expect(auto.headers()['vary']).toContain('Accept-Language');
		expect(auto.headers()['vary']).toContain('Cookie');
		set('en');
		const explicit = await request.get('/embed/summary.svg', {
			headers: { 'Accept-Language': 'de-DE' }
		});
		expect(explicit.headers()['content-language']).toBe('en');
		expect(await explicit.text()).toContain('ascents');
		for (const theme of ['light', 'dark']) {
			await page.goto(`/embed/eddington.svg?locale=de&theme=${theme}`);
			await expect(page.locator('svg')).toContainText('Routengrad-Index');
			const outside = await page.locator('svg text').evaluateAll((nodes) =>
				nodes
					.filter((node) => {
						const b = (node as SVGGraphicsElement).getBBox();
						return b.x < 0 || b.x + b.width > 480;
					})
					.map((node) => node.textContent)
			);
			expect(outside).toEqual([]);
			await page.locator('svg').screenshot({ path: `e2e/.tmp/eddington-de-${theme}.png` });
		}
	} finally {
		db.prepare('DELETE FROM app_settings WHERE key = ?').run('locale');
		if (saved) set(saved.value);
		db.close();
		await page.close();
	}
});
