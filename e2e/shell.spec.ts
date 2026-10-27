import { expect, test } from '@playwright/test';

test.describe('app shell', () => {
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

	test('theme cycles System → Light → Dark → System', async ({ page }) => {
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

	test('pages render with seeded data and a CSP header', async ({ page }) => {
		const res = await page.goto('/logbook');
		expect(res?.headers()['content-security-policy']).toContain("default-src 'self'");
		await expect(page.getByText('Sample Sport Route').first()).toBeVisible();
		for (const path of ['/', '/projects', '/sectors', '/goals', '/rewind']) {
			const r = await page.goto(path);
			expect(r?.status(), path).toBe(200);
		}
	});
});
