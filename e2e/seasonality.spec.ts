import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

test('seasonality search and exact logbook navigation', async ({ page }) => {
	test.setTimeout(60_000);
	const db = new Database('e2e/.tmp/open.sqlite');
	const ids: number[] = [];
	try {
		for (let i = 0; i < 29; i++) {
			const curve = Array(12).fill(1);
			curve[i === 1 ? 0 : 10] = i === 0 || i === 1 ? 10 : 2;
			if (i > 1) curve[1] = 10;
			const id = Number(
				db
					.prepare(
						`INSERT INTO routes (provider,external_id,name,crag_name,area_external_id,crag_url,country,parent_name,seasonality_json,url,updated_at) VALUES ('thecrag',?,?,?,'season-test','https://www.thecrag.com/area/123','Australia','Upper season sector',?,'https://www.thecrag.com/route/123','2026-11-01')`
					)
					.run(
						`season-${i}`,
						i < 2 ? 'Season climb same name' : `Season climb ${String(i).padStart(2, '0')}`,
						'Season test crag',
						i === 28 ? null : JSON.stringify(curve)
					).lastInsertRowid
			);
			ids.push(id);
			for (let j = 0; j < (i === 0 ? 52 : 1); j++)
				db.prepare(
					`INSERT INTO ascents (provider,external_id,route_id,ascent_date,tick_type,is_send,comment,updated_at) VALUES ('thecrag',?,?,'2026-01-01','Red point',1,'Private seasonality note','2026-11-01')`
				).run(`season-${i}-${j}`, id);
		}
		await page.goto('/');
		await page.getByRole('link', { name: 'Search seasonality', exact: true }).click();
		await expect(page).toHaveURL(/\/seasonality$/);
		expect(await page.getByRole('combobox', { name: 'Month', exact: true }).inputValue()).toMatch(
			/^(?:[1-9]|1[0-2])$/
		);
		await page.getByRole('combobox', { name: 'Month', exact: true }).selectOption('11');
		await page.getByRole('searchbox', { name: 'Crag, area or climb' }).fill('Season test crag');
		await page.getByRole('button', { name: 'Search', exact: true }).click();
		await expect(page).toHaveURL(/month=11/);
		await expect(page.locator('.results')).toContainText('28 of 29 logged climbs with data');
		await page.getByRole('link', { name: 'View climbs at Season test crag', exact: true }).click();
		await expect(page.getByRole('combobox', { name: 'Show', exact: true })).toHaveValue('routes');
		await expect(page.getByRole('searchbox', { name: 'Crag, area or climb' })).toHaveValue(
			'Season test crag'
		);
		const first = page.locator('.results > li').first();
		await expect(first).toContainText('Season climb same name');
		await expect(first).toContainText('100% of annual peak');
		await expect(
			first.getByRole('link', { name: 'View Season climb same name in logbook', exact: true })
		).toHaveAttribute('href', `/logbook?route=${ids[0]}`);
		await expect(
			first.getByRole('link', { name: 'Season climb same name on theCrag ↗', exact: true })
		).toHaveAttribute('href', 'https://www.thecrag.com/route/123');
		await first
			.getByRole('link', { name: 'View Season climb same name in logbook', exact: true })
			.click();
		await expect(page.locator('tbody tr')).toHaveCount(50);
		await page.getByRole('link', { name: 'Next →', exact: true }).click();
		await expect(page).toHaveURL(new RegExp(`route=${ids[0]}.*page=2`));
		await expect(page.locator('tbody tr')).toHaveCount(2);
		await page
			.getByRole('link', { name: /^Grade/ })
			.first()
			.click();
		await expect(page).toHaveURL(new RegExp(`route=${ids[0]}`));
		await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
		await expect(page).toHaveURL(new RegExp(`route=${ids[0]}`));
		await page.goBack();
		await page.goBack();
		await page.goBack();
		await page.goBack();
		await expect(page).toHaveURL(/\/seasonality\?/);
		await page.getByRole('link', { name: 'Next →', exact: true }).click();
		await expect(page).toHaveURL(/month=11.*view=routes.*page=2/);
		await page.reload();
		await expect(page.getByRole('combobox', { name: 'Month', exact: true })).toHaveValue('11');
		await page.getByRole('combobox', { name: 'Month', exact: true }).selectOption('1');
		await page.getByRole('button', { name: 'Search', exact: true }).click();
		await expect(page).not.toHaveURL(/page=2/);
		await expect(
			page
				.locator('.results > li')
				.first()
				.getByRole('link', { name: 'View Season climb same name in logbook', exact: true })
		).toHaveAttribute('href', `/logbook?route=${ids[1]}`);
		await page.locator('.results summary').first().click();
		await expect(page.locator('.results table').first()).toContainText('Jan (selected)');
		await expect(page.locator('body')).not.toContainText('Private seasonality note');
		for (const width of [1440, 390]) {
			await page.setViewportSize({ width, height: 1000 });
			await expectAxeClean(page, { include: ['main'] });
			await page.screenshot({ path: `e2e/.tmp/seasonality-${width}.png` });
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
				true
			);
		}
		await page
			.getByRole('searchbox', { name: 'Crag, area or climb' })
			.fill('no matching season climb');
		await page.getByRole('button', { name: 'Search', exact: true }).click();
		await expect(
			page.getByRole('heading', { name: 'No seasonality results', exact: true })
		).toBeVisible();
		await page.getByRole('searchbox', { name: 'Crag, area or climb' }).fill('Season climb 28');
		await page.getByRole('button', { name: 'Search', exact: true }).click();
		await expect(
			page.getByText('No matching climbs have usable monthly data yet.', { exact: false })
		).toBeVisible();
	} finally {
		for (const id of ids) {
			db.prepare('DELETE FROM ascents WHERE route_id=?').run(id);
			db.prepare('DELETE FROM routes WHERE id=?').run(id);
		}
		db.close();
	}
});
