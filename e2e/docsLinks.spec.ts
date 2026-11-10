import { expect, test } from '@playwright/test';

test('docs links keep their shared colours and underline in both themes', async ({ page }) => {
	for (const theme of ['light', 'dark']) {
		await page.addInitScript((value) => localStorage.setItem('cs_theme', value), theme);
		for (const path of ['/', '/map', '/activity', '/eddington', '/training-load']) {
			await page.goto(path);
			await page.locator('html').evaluate((html, value) => {
				html.setAttribute('data-theme', value);
			}, theme);
			const links = page.locator('a.how');
			expect(await links.count()).toBeGreaterThan(0);
			const colours = await page.locator('html').evaluate((html) => {
				const probe = document.createElement('span');
				html.append(probe);
				probe.style.color = 'var(--accent)';
				const accent = getComputedStyle(probe).color;
				probe.style.color = 'var(--accent-strong)';
				const hover = getComputedStyle(probe).color;
				probe.remove();
				return { accent, hover };
			});
			for (const link of await links.all()) {
				await page.mouse.move(0, 0);
				await expect(link).toHaveCSS('color', colours.accent);
				await expect(link).toHaveCSS('text-decoration-line', 'underline');
				await link.hover();
				await expect(link).toHaveCSS('color', colours.hover);
			}
		}
	}
});
