import { expect, test } from '@playwright/test';
import { PORTS } from '../playwright.config';

test('First Moves uses a corrected import date with no climb link and survives reimports', async ({
	page
}) => {
	await page.goto('/settings#first-import');
	await page.getByLabel('First import date', { exact: true }).fill('2026-10-27');
	await page.getByRole('button', { name: 'Save first import date' }).click();
	await expect(page.getByText('First import date saved.', { exact: false })).toBeVisible();
	await page.goto('/');
	const card = page
		.locator('article.card')
		.filter({ has: page.getByRole('heading', { name: 'First Moves', exact: true }) });
	await expect(card).toContainText('27 Oct 2026');
	await expect(card.getByRole('link', { name: 'View climb' })).toHaveCount(0);
	const original = await card.innerText();
	await page.goto('/settings');
	await page.setInputFiles('input[name="file"]', 'samples/thecrag-logbook-sample.csv');
	await page.getByRole('button', { name: 'Import CSV' }).click();
	await page.goto('/');
	await expect(card).toHaveText(original);
});

test('visitors cannot change the first import date', async ({ request }) => {
	const origin = `http://localhost:${PORTS.settings}`;
	const response = await request.post(`${origin}/settings?/saveFirstImportDate`, {
		headers: { origin },
		form: { date: '2026-10-27' },
		maxRedirects: 0
	});
	expect(response.status()).toBe(303);
});
