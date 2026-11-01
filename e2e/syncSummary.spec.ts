import { expect, test } from '@playwright/test';
import Database from 'better-sqlite3';
import { expectAxeClean } from './axe';
test('import summary', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	const csv =
		'Route Name,Ascent ID,Ascent Type,Route Grade,Route Gear Style,Route ID,Ascent Date\nSynthetic summary route,summary-a,Red point,18,Sport,summary-route,2026-01-01\nSynthetic summary route,summary-b,Attempt,18,Sport,summary-route,2026-01-02\n';
	const db = new Database('e2e/.tmp/open.sqlite');
	try {
		await page.goto('/settings');
		const upload = async () => {
			await page.setInputFiles('input[name="file"]', {
				name: 'summary.csv',
				mimeType: 'text/csv',
				buffer: Buffer.from(csv)
			});
			await page.getByRole('button', { name: 'Import CSV' }).click();
		};
		await upload();
		const summary = page.getByRole('status', { name: 'Import summary' });
		await expect(summary).toContainText('CSV import complete.');
		await expect(summary).toContainText('Processed 2 ascents.');
		await expect(summary).toContainText('1 new route');
		await expect(summary).toContainText('2 new ascents');
		await expect(summary).toContainText('0 existing ascents refreshed');
		await expect(summary).toContainText('Manual CSV uploads do not remove missing entries.');
		await upload();
		await expect(summary).toContainText('0 new routes');
		await expect(summary).toContainText('0 new ascents');
		await expect(summary).toContainText('2 existing ascents refreshed');
		// Component coverage for the new summary; existing full-page scans remain unchanged.
		await expectAxeClean(page, { include: ['[aria-label="Import summary"]'] });
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
	} finally {
		db.prepare("DELETE FROM ascents WHERE external_id IN ('summary-a','summary-b')").run();
		db.prepare(
			"DELETE FROM projects WHERE route_id IN (SELECT id FROM routes WHERE external_id='summary-route')"
		).run();
		db.prepare("DELETE FROM routes WHERE external_id='summary-route'").run();
		db.close();
	}
});
