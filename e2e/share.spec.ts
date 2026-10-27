import { expect, test } from '@playwright/test';

// E2E servers run on localhost, so /share must warn that others can't load the links.
test('share page warns when the site is on a local address', async ({ page }) => {
	await page.goto('/share');
	const note = page.getByRole('note');
	await expect(note).toContainText('Only you can see these right now');
	await expect(note).toContainText('localhost');
});
