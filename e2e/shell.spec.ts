import { expect, test } from '@playwright/test';
import { DOC_PAGES } from '../src/lib/docs';
import { expectAxeClean } from './axe';

test.describe('app shell', () => {
	test('Settings remains in the header without a duplicate sidebar entry', async ({ page }) => {
		await page.goto('/');
		await expect(
			page.locator('#side-nav').getByRole('link', { name: 'Settings', exact: true })
		).toHaveCount(0);
		const settings = page.getByRole('link', { name: 'Settings & sync', exact: true });
		await expect(settings).toBeVisible();
		await settings.click();
		await expect(page).toHaveURL(/\/settings$/);
		await expect(page).toHaveTitle('Settings · Crag Stats');
		await page.setViewportSize({ width: 390, height: 844 });
		await expect(settings).toBeVisible();
		await page.locator('button[aria-controls="side-nav"]').click();
		await expect(
			page.locator('#side-nav').getByRole('link', { name: 'Settings', exact: true })
		).toHaveCount(0);
		await page.keyboard.press('Escape');
		await expect(settings).toBeVisible();
	});

	test('sidebar collapses to the mini rail and persists across reloads', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: 'Collapse sidebar' }).click();
		await expect(page.locator('html')).toHaveAttribute('data-sidebar', 'mini');
		await page.reload();
		await expect(page.locator('html')).toHaveAttribute('data-sidebar', 'mini');
		await page.getByRole('button', { name: 'Expand sidebar' }).click();
		await expect(page.locator('html')).not.toHaveAttribute('data-sidebar', 'mini');
	});

	test('mobile drawer opens, takes focus and closes with Escape', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		const side = page.locator('#side-nav');
		await expect(side).toHaveAttribute('inert', '');
		const toggle = page.locator('button[aria-controls="side-nav"]');
		await toggle.click();
		await expect(page.locator('.app')).toHaveClass(/drawer-open/);
		await expect(side.getByRole('link', { name: 'Dashboard' })).toBeFocused();
		await page.keyboard.press('Escape');
		await expect(page.locator('.app')).not.toHaveClass(/drawer-open/);
		await expect(toggle).toBeFocused();
	});

	test('theme cycles System ? Light ? Dark ? System', async ({ page }) => {
		await page.goto('/');
		const btn = page.getByRole('button', { name: /^Theme:/ });
		await expect(btn).toHaveAccessibleName(/Theme: System/);
		await btn.click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
		await btn.click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
		await page.reload();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
		await page.getByRole('button', { name: /^Theme:/ }).click();
		await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
	});

	test('language menu lists every enabled locale and switches in one interaction', async ({
		page
	}) => {
		await page.goto('/');
		// The button is named in the active language, so select it by class.
		const trigger = page.locator('.top-actions .locale');
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');

		await trigger.click();
		const menu = page.getByRole('menu');
		await expect(menu).toBeVisible();
		// Every enabled locale is one interaction away (#494); Italian remains disabled.
		await expect(menu.getByRole('menuitemradio')).toHaveCount(4);
		await expect(menu.getByRole('menuitemradio', { name: 'Deutsch', exact: true })).toBeVisible();
		await expect(menu.getByRole('menuitemradio', { name: 'Français', exact: true })).toBeVisible();
		await expect(menu.getByRole('menuitemradio', { name: 'Español', exact: true })).toBeVisible();
		await expect(menu.getByRole('menuitemradio', { name: 'Italiano', exact: true })).toHaveCount(0);
		await expect(menu.getByRole('menuitemradio', { name: 'English', exact: true })).toHaveAttribute(
			'aria-checked',
			'true'
		);
		await expect(menu.getByRole('menuitemradio', { name: 'English', exact: true })).toBeFocused();
		await expectAxeClean(page, { include: ['.topbar'] });

		// Escape closes the menu and hands focus back to the trigger.
		await page.keyboard.press('Escape');
		await expect(menu).toHaveCount(0);
		await expect(trigger).toBeFocused();

		// ArrowDown opens on the current locale; the next ArrowDown moves into the list.
		await trigger.press('ArrowDown');
		await expect(menu.getByRole('menuitemradio', { name: 'English', exact: true })).toBeFocused();
		await page.keyboard.press('ArrowDown');
		await expect(menu.getByRole('menuitemradio', { name: 'Deutsch', exact: true })).toBeFocused();
		await page.keyboard.press('Enter');

		// German: shell copy and the server-rendered <html lang> follow immediately.
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		await expect(page.locator('#side-nav').getByRole('link', { name: 'Übersicht' })).toBeVisible();
		await expect(page.getByRole('contentinfo')).toContainText('Selbst gehostete Kletteranalyse');

		// Reload preserves the language via the cookie.
		await page.reload();
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		await expect(page.locator('#side-nav').getByRole('link', { name: 'Übersicht' })).toBeVisible();

		for (const locale of ['fr', 'es']) {
			await page.goto(`/?locale=${locale}`);
			await expect(page.locator('html')).toHaveAttribute('lang', locale);
			await page.reload();
			await expect(page.locator('html')).toHaveAttribute('lang', locale);
			await page.goto('/settings');
			await expect(page.locator('select[name="locale"] option[value="fr"]')).toHaveCount(1);
			await expect(page.locator('select[name="locale"] option[value="es"]')).toHaveCount(1);
		}

		// Reset to English, then confirm Italian remains unavailable.
		await page.goto('/?locale=en');
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await page.goto('/?locale=it');
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page.locator('#side-nav').getByRole('link', { name: 'Dashboard' })).toBeVisible();

		// The choice persists across reload.
		await page.goto('/');
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page.locator('#side-nav').getByRole('link', { name: 'Dashboard' })).toBeVisible();
	});

	test('German pages render translated headings without unresolved message syntax', async ({
		page
	}) => {
		try {
			for (const [path, heading] of [
				['/logbook', 'Tourenbuch'],
				['/weather', 'Wetter'],
				['/settings', 'Einstellungen']
			]) {
				await page.goto(`${path}?locale=de`);
				await expect(page.locator('html')).toHaveAttribute('lang', 'de');
				await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
				expect(await page.locator('main').innerText()).not.toMatch(
					/\{(?:count|days|total|name|range|percent)[,}]/
				);
			}
		} finally {
			await page.goto('/?locale=en');
		}
	});

	test('saving a language applies to the immediate native form response', async ({
		request,
		baseURL
	}) => {
		try {
			const saved = await request.post('/settings?/savePreferences', {
				form: { locale: 'de' },
				headers: {
					accept: 'text/html',
					'accept-language': 'en-AU',
					origin: new URL(baseURL!).origin
				}
			});
			expect(saved.status()).toBe(200);
			expect(await saved.text()).toMatch(/<html[^>]*lang="de"/);
		} finally {
			const reset = await request.post('/settings?/savePreferences', {
				form: { locale: 'auto' },
				headers: {
					accept: 'text/html',
					'accept-language': 'en-AU',
					origin: new URL(baseURL!).origin
				}
			});
			expect(reset.status()).toBe(200);
			expect(await reset.text()).toMatch(/<html[^>]*lang="en"/);
		}
	});

	test('docs: every page renders and the dashboard links into them', async ({ page }) => {
		await page.goto('/docs');
		const links = page.locator('.toc a');
		await expect(links).toHaveCount(DOC_PAGES.length + 1); // Overview + pages
		for (const { slug } of DOC_PAGES) {
			const r = await page.goto(`/docs/${slug}`);
			expect(r?.status(), slug).toBe(200);
			await expect(page.locator('.prose h1')).toBeVisible();
		}
		await expect(page.locator('.prose table').first()).toBeVisible();
		expect((await page.goto('/docs/nope'))?.status()).toBe(404);
		await page.goto('/docs?locale=de');
		await expect(page.locator('.toc a.active')).toHaveText('Übersicht');
		await page.goto('/docs/climber-type?locale=de');
		await expect(page.locator('.prose h1')).toHaveText('Klettertyp');
		await page.goto('/?locale=en');
		await page.getByRole('link', { name: 'How is this decided?' }).click();
		await expect(page).toHaveURL(/\/docs\/climber-type$/);
	});

	test('documentation follows header language changes from an explicit locale link', async ({
		page
	}) => {
		await page.goto('/docs/climber-type?locale=en');
		await expect(page.locator('.prose h1')).toHaveText('Climber type');
		await page.locator('.top-actions .locale').click();
		await page.getByRole('menuitemradio', { name: 'Deutsch', exact: true }).click();
		await expect(page.locator('.prose h1')).toHaveText('Klettertyp');
		await expect(page).toHaveURL(/\/docs\/climber-type$/);
		await page.locator('.top-actions .locale').click();
		await page.getByRole('menuitemradio', { name: 'English', exact: true }).click();
		await expect(page.locator('.prose h1')).toHaveText('Climber type');
	});

	test('pages render with seeded data and a CSP header', async ({ page }) => {
		const res = await page.goto('/logbook');
		expect(res?.headers()['content-security-policy']).toContain("default-src 'self'");
		await expect(page.getByText('Sample Sport Route').first()).toBeVisible();
		for (const path of [
			'/',
			'/projects',
			'/sectors',
			'/goals',
			'/eddington',
			'/activity',
			'/badges',
			'/rewind',
			'/share'
		]) {
			const r = await page.goto(path);
			expect(r?.status(), path).toBe(200);
		}
	});

	test('embed cards are SVG and unknown cards 404', async ({ request }) => {
		for (const card of ['summary', 'eddington', 'hardest']) {
			const res = await request.get(`/embed/${card}.svg?theme=dark`);
			expect(res.status(), card).toBe(200);
			expect(res.headers()['content-type']).toContain('image/svg+xml');
			expect(await res.text()).toMatch(/^<svg /);
		}
		expect((await request.get('/embed/notes.svg')).status()).toBe(404);
	});
});
