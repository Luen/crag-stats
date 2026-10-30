import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const colorScheme of ['light', 'dark'] as const)
	test(`world map and exact logbook links in ${colorScheme}`, async ({ page }) => {
		await page.emulateMedia({ colorScheme });
		const db = new Database('e2e/.tmp/open.sqlite');
		const ids: number[] = [];
		const remote: string[] = [];
		page.on('request', (r) => {
			if (!new URL(r.url()).hostname.match(/^(localhost|127\.0\.0\.1)$/)) remote.push(r.url());
		});
		try {
			for (const [i, lon] of [179, -179, 10].entries()) {
				const id = Number(
					db
						.prepare(
							`INSERT INTO routes (provider,external_id,name,crag_name,area_external_id,gear_style,country,lat,lon,updated_at) VALUES ('thecrag',?,?,?,?,'Sport','Test',10,?,'2026-10-30')`
						)
						.run(`world-${i}`, `World route ${i}`, 'World same name', `world-area-${i}`, lon)
						.lastInsertRowid
				);
				ids.push(id);
				for (let n = 0; n < (i === 0 ? 52 : 1); n++)
					db.prepare(
						`INSERT INTO ascents (provider,external_id,route_id,ascent_date,is_send,updated_at) VALUES ('thecrag',?,?, '2026-09-01',1,'2026-10-30')`
					).run(`world-${i}-${n}`, id);
			}
			await page.goto('/map?from=2026-09-01&to=2026-09-01');
			await expect(page.getByRole('heading', { name: 'Climbing around the world' })).toBeVisible();
			await expect(page.getByRole('table')).toContainText('World same name');
			await expect(page.getByRole('group', { name: 'Worldwide climbing places' })).toBeVisible();
			await page.getByRole('button', { name: 'Glow', exact: true }).click();
			await expect(page.locator('.marker.glow').first()).toBeVisible();
			await page.locator('.marker').first().focus();
			await expect(page.locator('.marker').first()).toBeFocused();
			await page.keyboard.press('Enter');
			await expect(page.getByRole('region', { name: 'Selected map places' })).toBeVisible();
			await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
			await page.getByRole('button', { name: 'Pan east' }).click();
			await page.getByRole('button', { name: 'Fit places' }).click();
			for (const width of [1440, 390]) {
				await page.setViewportSize({ width, height: 1000 });
				expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
					true
				);
				const axe = await new AxeBuilder({ page }).include('main').analyze();
				expect(
					axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
				).toEqual([]);
			}
			const row = page.getByRole('row').filter({ hasText: '52' });
			await row.getByRole('link').click();
			await expect(page).toHaveURL(/place=/);
			await expect(page.locator('.head')).toContainText('52 ascents');
			await page.getByRole('link', { name: 'Grade', exact: true }).click();
			await expect(page).toHaveURL(/place=/);
			await page.getByRole('link', { name: /Next/ }).click();
			await expect(page.locator('tbody tr')).toHaveCount(2);
			await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
			await expect(page).toHaveURL(/place=/);
			expect(remote).toEqual([]);
		} finally {
			for (const id of ids) {
				db.prepare('DELETE FROM ascents WHERE route_id=?').run(id);
				db.prepare('DELETE FROM routes WHERE id=?').run(id);
			}
			db.close();
		}
	});
