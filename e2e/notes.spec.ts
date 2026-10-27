import { expect, test } from '@playwright/test';

// The sample CSV has one note ("Almost" on Sample Sport Route). Notes are off by default,
// so they must not reach the page or be findable through search.
test.describe('private ascent notes', () => {
	test('are hidden from the logbook and search by default', async ({ page }) => {
		await page.goto('/logbook');
		await expect(page.getByText('Sample Sport Route').first()).toBeVisible();
		expect(await page.content()).not.toContain('Almost');

		await page.goto('/logbook?q=Almost');
		await expect(page.getByText('Sample Sport Route')).toHaveCount(0);
	});

	test('have an unticked Settings toggle', async ({ page }) => {
		await page.goto('/settings');
		await expect(
			page.getByRole('checkbox', { name: /Show my private ascent notes/ })
		).not.toBeChecked();
	});
});
