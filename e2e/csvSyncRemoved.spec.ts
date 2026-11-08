import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';
import { PORTS, TEST_PASSWORD } from '../playwright.config';

const settingsOrigin = `http://localhost:${PORTS.settings}`;

test('a leftover THECRAG_SYNC_MODE=csv explains the removal and offers manual upload', async ({
	page
}) => {
	await page.goto(`${settingsOrigin}/login?next=/settings`);
	await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
	await page.getByRole('button', { name: 'Unlock' }).click();
	const panel = page.locator('article', {
		has: page.getByRole('heading', { name: 'theCrag logbook sync' })
	});
	await expect(panel.getByRole('note')).toContainText(
		'THECRAG_SYNC_MODE=csv is no longer supported'
	);
	await expect(page.getByRole('button', { name: 'Forget saved theCrag login' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Import CSV' })).toBeVisible();
	await expectAxeClean(page, { include: [panel] });
});
