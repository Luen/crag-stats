import { expect, test } from '@playwright/test';
import { PORTS, TEST_PASSWORD } from '../playwright.config';

const settingsOrigin = `http://localhost:${PORTS.settings}`;

test('CSV sync settings explain saved sessions and can forget login without exposing credentials', async ({
	page
}) => {
	await page.goto(`${settingsOrigin}/login?next=/settings`);
	await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
	await page.getByRole('button', { name: 'Unlock' }).click();
	await expect(page.getByRole('heading', { name: 'theCrag logbook sync' })).toBeVisible();
	await expect(
		page.getByText('Downloads your CSV export using a saved theCrag login.', { exact: false })
	).toBeVisible();
	expect(await page.content()).not.toContain('synthetic-account');
	await page.getByRole('button', { name: 'Forget saved theCrag login' }).click();
	await expect(
		page.getByText('Saved theCrag login cleared. The next CSV sync will log in again.')
	).toBeVisible();
	await page.getByRole('link', { name: 'Setup and limitations' }).click();
	await expect(page.getByRole('heading', { name: 'Logbook sync', exact: true })).toBeVisible();
});

test('visitors cannot clear the saved upstream login', async ({ request }) => {
	const response = await request.post(`${settingsOrigin}/settings?/forgetTheCragSession`, {
		headers: { origin: settingsOrigin, accept: 'application/json' },
		form: {},
		maxRedirects: 0
	});
	expect(response.status()).toBe(303);
	expect(response.headers().location).toContain('/login');
});
