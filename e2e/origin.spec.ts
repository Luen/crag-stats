import { expect, test } from '@playwright/test';
import { PORTS, TEST_PASSWORD } from '../playwright.config';

// #47: forms must work over plain HTTP (no proxy headers) while CSRF still blocks
// cross-site posts. The test servers run scripts/server.mjs exactly like Docker.

test('plain HTTP: same-origin form POST succeeds', async ({ page }) => {
	await page.goto('/settings');
	await page.getByRole('button', { name: 'Save preferences' }).click();
	await expect(page.getByText('Preferences saved.')).toBeVisible();
});

test('CSRF still rejects a cross-site form POST', async ({ request }) => {
	const res = await request.post('/settings?/savePreferences', {
		headers: {
			origin: 'http://evil.example',
			'content-type': 'application/x-www-form-urlencoded'
		},
		data: 'system=ewbank&indexing=on'
	});
	expect(res.status()).toBe(403);
});

test('ORIGIN override: login works on the AUTH_SCOPE=all server', async ({ page }) => {
	const origin = `http://localhost:${PORTS.all}`;
	await page.goto(`${origin}/login`);
	await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
	await page.getByRole('button', { name: 'Unlock' }).click();
	// Signed in (default landing is /settings), not bounced back to /login.
	await expect(page).toHaveURL(`${origin}/settings`);
	await expect(page.locator('header').getByRole('button', { name: 'Log out' })).toBeVisible();
});
