import { expect, test } from '@playwright/test';

// Open server (no APP_PASSWORD), so the visitor is the owner and can mark FAs.
test('mark a first ascent from the logbook and see it on the dashboard', async ({ page }) => {
	await page.goto('/logbook?q=Hard%20Project');
	const row = page.getByRole('row').filter({ hasText: 'Hard Project' }).first();
	await row.hover();
	await row.getByRole('button', { name: /first ascent$/ }).click();
	await expect(row.locator('.chip.fa')).toHaveText('FA');

	await page.goto('/');
	const card = page.locator('article', {
		has: page.getByRole('heading', { name: 'First ascents' })
	});
	await expect(card).toContainText('1');
	await expect(card).toContainText('Hard Project');

	// Leave shared e2e state as it was.
	await page.goto('/logbook?q=Hard%20Project');
	await row.hover();
	await row.getByRole('button', { name: 'Unmark FA' }).click();
	await expect(row.locator('.chip.fa')).toHaveCount(0);
});
