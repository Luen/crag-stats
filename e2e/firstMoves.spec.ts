import { expect, test } from '@playwright/test';

test('First Moves is dated by the seed import with no climb link and survives reimports', async ({
	page
}) => {
	await page.goto('/');
	const card = page
		.locator('article.card')
		.filter({ has: page.getByRole('heading', { name: 'First Moves', exact: true }) });
	await expect(card).toBeVisible();
	await expect(card).toContainText(/Imported \d+ climbs · /);
	await expect(card).not.toContainText('Import date unknown');
	await expect(card.getByRole('link', { name: 'View climb' })).toHaveCount(0);
	const original = await card.innerText();
	await page.goto('/settings');
	await expect(page.getByRole('heading', { name: 'First Moves badge' })).toHaveCount(0);
	await page.setInputFiles('input[name="file"]', 'samples/thecrag-logbook-sample.csv');
	await page.getByRole('button', { name: 'Import CSV' }).click();
	await page.goto('/');
	await expect(card).toHaveText(original);
});
