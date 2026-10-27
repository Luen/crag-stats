import { mkdirSync } from 'node:fs';
import { expect, test as setup } from '@playwright/test';

// Fresh DBs are created by the servers on boot; seed the open server through the real
// Settings → CSV import form (which also exercises the import path).
setup('seed open server from the sample CSV', async ({ page }) => {
	mkdirSync('e2e/.tmp', { recursive: true });
	await page.goto('/settings');
	await page.setInputFiles('input[name="file"]', 'samples/thecrag-logbook-sample.csv');
	await page.getByRole('button', { name: 'Import CSV' }).click();
	await expect(page.getByText(/Parsed \d+ ascents/)).toBeVisible();
});
