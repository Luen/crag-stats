import { expect, test } from '@playwright/test';
import Database from 'better-sqlite3';
import { expectAxeClean } from './axe';

const csv = `Route Name,Ascent ID,Ascent Type,Route Grade,Route Gear Style,Route ID,Ascent Date
Gap route one,cpr-gap-a,Red point,18,Sport,cpr-gap-route-1,2019-01-12
Gap route two,cpr-gap-b,Red point,19,Sport,cpr-gap-route-2,2019-05-14
Gap route three,cpr-gap-c,Onsight,20,Sport,cpr-gap-route-3,2021-08-10
Gap route four,cpr-gap-d,Red point,21,Sport,cpr-gap-route-4,2021-11-11
`;

test('CPR timelines can show empty quarters and break the curve across them', async ({
	page,
	context
}) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	try {
		await page.goto('/settings');
		await page.setInputFiles('input[name="file"]', {
			name: 'cpr-gaps.csv',
			mimeType: 'text/csv',
			buffer: Buffer.from(csv)
		});
		await page.getByRole('button', { name: 'Import CSV' }).click();
		await expect(page.getByRole('status', { name: 'Import summary' })).toContainText(
			'Processed 4 ascents.'
		);

		await page.goto('/');
		const toggle = page.getByRole('checkbox', { name: 'Show empty quarters' });
		const card = page.locator('article').filter({ has: toggle });
		await expect(toggle).toHaveCount(1);
		await expect(toggle).not.toBeChecked();
		// Compact view: the 2019 and 2021 quarters sit side by side and one curve bridges them.
		const compactColumns = await card.locator('.vcol').count();
		await expect(card.getByTitle('Gap in time').first()).toBeVisible();
		await expect(card.locator('path.line')).toHaveCount(1);

		await toggle.check();
		await expect(toggle).toBeChecked();
		// 2019-Q1/Q2 and 2021-Q3/Q4 have ascents; everything between them does not, so every
		// skipped quarter gets its own column with a volume baseline and no candles.
		await expect(card.locator('.vcol.empty[title="2019-Q3: no logged ascents"]')).toHaveCount(1);
		await expect(card.locator('.vcol.empty[title="2020-Q1: no logged ascents"]')).toHaveCount(1);
		await expect(card.locator('.vcol.empty[title="2021-Q2: no logged ascents"]')).toHaveCount(1);
		expect(await card.locator('.vcol').count()).toBeGreaterThan(compactColumns);
		// Expanded view: each unbroken stretch keeps its own segment, and nothing is drawn
		// through the empty quarters between them.
		await expect(card.locator('path.line')).toHaveCount(2);
		await expect(card.getByTitle('Gap in time')).toHaveCount(0);
		const cookie = (await context.cookies()).find((c) => c.name === 'cs_cpr_gaps');
		expect(cookie?.value).toBe('all');
		await expectAxeClean(page, { include: [card] });

		// The preference is cookie-backed, so SSR renders it checked on the next load.
		await page.reload();
		await expect(toggle).toBeChecked();
		await expect(card.locator('path.line')).toHaveCount(2);

		await toggle.uncheck();
		await expect(card.locator('path.line')).toHaveCount(1);
		expect((await context.cookies()).find((c) => c.name === 'cs_cpr_gaps')?.value).toBe('compact');
	} finally {
		db.prepare("DELETE FROM ascents WHERE external_id LIKE 'cpr-gap-%'").run();
		db.prepare(
			"DELETE FROM projects WHERE route_id IN (SELECT id FROM routes WHERE external_id LIKE 'cpr-gap-route-%')"
		).run();
		db.prepare("DELETE FROM routes WHERE external_id LIKE 'cpr-gap-route-%'").run();
		db.close();
	}
});
