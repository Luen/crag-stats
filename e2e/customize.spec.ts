import { expect, test } from '@playwright/test';

// Open server: the visitor is the owner, so the dashboard links to the editor in Settings.
test('customize the dashboard from Settings', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Customize dashboard' }).click();
	await expect(page).toHaveURL(/\/settings#dashboard$/);
	const section = page.locator('#dashboard');
	await expect(section.getByRole('heading', { name: 'Dashboard layout' })).toBeVisible();

	// Hide "Recent activities" and save: Settings confirms, the dashboard drops the card.
	await section.getByRole('checkbox', { name: /^Recent/ }).uncheck();
	await section.getByRole('button', { name: 'Save layout' }).click();
	await expect(page.getByText('Dashboard layout saved.')).toBeVisible();
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Recent activities', exact: true })).toHaveCount(
		0
	);

	// Leave shared e2e state as it was.
	await page.goto('/settings#dashboard');
	await page.getByRole('button', { name: 'Clear saved layout' }).click();
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Recent activities', exact: true })).toHaveCount(
		1
	);
});
