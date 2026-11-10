import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

test.use({ hasTouch: true });

for (const mobile of [false, true]) {
	test(`cached logbook controls: ${mobile ? 'mobile touch' : 'desktop keyboard'}`, async ({
		page
	}) => {
		if (mobile) await page.setViewportSize({ width: 390, height: 844 });
		const db = new Database('e2e/.tmp/open.sqlite');
		const ids: number[] = [];
		const crag = `Filter controls ${mobile ? 'mobile' : 'desktop'}`;
		try {
			for (let i = 0; i < 53; i++) {
				const external = `controls-${mobile}-${i}`;
				const id = Number(
					db
						.prepare(
							`INSERT INTO routes (provider,external_id,name,gear_style,crag_name,area_external_id,parent_name,parent_external_id,tags_json,updated_at)
					VALUES ('thecrag',?,?,?,?,?,?,?,?, '2026-01-01')`
						)
						.run(
							external,
							i < 2 ? 'Repeated filter route' : `Filter route ${i}`,
							i < 51 ? (i % 2 ? null : '  ') : 'Sport',
							crag,
							`controls-${mobile}`,
							'Filter sector',
							`sector-${mobile}`,
							JSON.stringify([
								{
									category: 'Rock type',
									name: i < 51 ? (i % 2 ? 'granite' : ' Granite ') : 'Red   Granite'
								}
							])
						).lastInsertRowid
				);
				ids.push(id);
				db.prepare('UPDATE routes SET url = ? WHERE id = ?').run(
					'https://www.thecrag.com/route/99999',
					id
				);
				db.prepare(
					`INSERT INTO ascents (provider,external_id,route_id,ascent_date,ascent_gear_style,partners,comment,is_send,updated_at)
					VALUES ('thecrag',?,?,?,'Trad','@jodierummer','Private filter secret',1,'2026-01-01')`
				).run(external, id, i < 51 ? '2024-02-29T23:00:00-10:00' : '2025-01-01');
			}
			await page.goto(`/logbook?crag=${encodeURIComponent(crag)}&year=2024&rock=GRANITE`);
			const filters = page.locator('.filters');
			const from = page.getByLabel('From (inclusive)');
			const to = page.getByLabel('To (inclusive)');
			await expect(from).toHaveValue('2024-01-01');
			await expect(to).toHaveValue('2024-12-31');
			await expect(filters.locator('[name="year"]')).toHaveCount(0);
			await expect(page.getByLabel('Rock type', { exact: true })).toHaveValue('granite');
			await page.getByLabel('Unknown', { exact: true }).check();
			const partner = page.getByRole('combobox', { name: 'With (partner name)', exact: true });
			await partner.fill('Jodie');
			const suggestion = page.getByRole('option', { name: '@jodierummer', exact: true });
			await expect(suggestion).toBeVisible();
			if (mobile)
				expect(
					await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
				).toBe(true);
			await expectAxeClean(page, { include: [filters] });
			if (mobile) await suggestion.tap();
			else {
				await partner.press('ArrowDown');
				await partner.press('Enter');
			}
			await expect(partner).toHaveValue('@jodierummer');
			await page
				.getByRole('combobox', { name: 'Partner match', exact: true })
				.selectOption('exact');
			await page.getByRole('button', { name: 'Apply filters' }).click();
			await expect(page.locator('.head p')).toContainText('51 ascents');
			await expect(page).toHaveURL(
				(url) =>
					url.searchParams.get('style') === 'Unknown' &&
					url.searchParams.get('with') === '@jodierummer' &&
					!url.searchParams.has('year')
			);
			await page
				.locator('thead')
				.getByRole('link', { name: /^Grade/ })
				.click();
			await page.getByRole('link', { name: 'Next →' }).click();
			await expect(page.locator('tbody tr')).toHaveCount(1);
			await expect(from).toHaveValue('2024-01-01');
			await expect(page.getByLabel('Unknown', { exact: true })).toBeChecked();
			await expect(partner).toHaveValue('@jodierummer');
			await expect(page.getByLabel('Rock type', { exact: true })).toHaveValue('granite');
			await expect(page.locator('tbody a[href*="thecrag.com"]')).not.toHaveCount(0);
			const route = page.getByRole('combobox', { name: 'Route', exact: true });
			await route.fill('Repeated filter route');
			await expect(
				page.getByRole('listbox', { name: 'Route suggestions' }).getByRole('option')
			).toHaveCount(2);
			await route.press('ArrowDown');
			await route.press('ArrowDown');
			await route.press('Enter');
			await page.getByRole('button', { name: 'Apply filters' }).click();
			await expect(page.locator('tbody tr')).toHaveCount(1);
			await expect(page).toHaveURL((url) => url.searchParams.get('route') === String(ids[1]));
			await route.fill('Filter route 2');
			await route.press('Escape');
			await page.getByRole('button', { name: 'Apply filters' }).click();
			await expect(page).toHaveURL(
				(url) =>
					!url.searchParams.get('route') && url.searchParams.get('routeName') === 'Filter route 2'
			);
			await expect(page.locator('.head p')).toContainText('11 ascents');
			await route.fill('');
			const cragInput = page.getByRole('combobox', { name: 'Crag', exact: true });
			await cragInput.fill(crag);
			await cragInput.press('ArrowDown');
			await cragInput.press('Enter');
			const sector = page.getByRole('combobox', { name: 'Sector / parent', exact: true });
			await sector.fill('Filter sector');
			await page
				.getByRole('listbox', { name: 'Sector / parent suggestions' })
				.getByRole('option', { name: new RegExp(crag) })
				.click();
			await page.getByRole('button', { name: 'Apply filters' }).click();
			await expect(page.locator('.head p')).toContainText('51 ascents');
			await expect(page).toHaveURL(
				(url) =>
					Boolean(url.searchParams.get('cragKey')) && Boolean(url.searchParams.get('sectorKey'))
			);
			await route.fill('No such cached climb');
			await expect(page.getByRole('status').filter({ hasText: 'No cached matches' })).toBeVisible();
			await route.press('Escape');
			await expect(route).toHaveAttribute('aria-expanded', 'false');
			await page.goto(`/logbook?crag=${encodeURIComponent(crag)}&from=2024-02-29&to=2024-02-29`);
			await expect(page.locator('.head p')).toContainText('51 ascents');
			await page.getByLabel('Fill date range', { exact: true }).selectOption('2024');
			await expect(from).toHaveValue('2024-01-01');
			await expect(to).toHaveValue('2024-12-31');
			await page.getByLabel('Fill date range', { exact: true }).selectOption('all');
			await expect(from).toHaveValue('');
			await expect(to).toHaveValue('');
			await expectAxeClean(page, { include: [filters] });
			await page.goto('/logbook?from=2024-02-30');
			await expect(page.getByRole('alert')).toHaveText(
				'Enter valid calendar dates in From and To.'
			);
			await expect(page.locator('.head p')).toContainText('0 ascents');
			await page.goto('/logbook?from=2024-03-01&to=2024-02-29&rock=Old%20rock');
			await expect(page.getByRole('alert')).toHaveText('From must be on or before To.');
			await expect(page.getByLabel('Rock type', { exact: true })).toHaveValue('old rock');
			await expect(
				page.getByRole('option', { name: 'old rock (not in cached logbook)' })
			).toHaveCount(1);
		} finally {
			for (const id of ids) {
				db.prepare('DELETE FROM ascents WHERE route_id = ?').run(id);
				db.prepare('DELETE FROM routes WHERE id = ?').run(id);
			}
			db.close();
		}
	});
}
