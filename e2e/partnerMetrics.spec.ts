import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const colorScheme of ['light', 'dark'] as const)
	test(`dashboard partner metric ranks before limiting in ${colorScheme}`, async ({ page }) => {
		await page.emulateMedia({ colorScheme });
		const db = new Database('e2e/.tmp/open.sqlite');
		const ids: number[] = [];
		const route = (external: string, crag: string) => {
			const id = Number(
				db
					.prepare(
						`INSERT INTO routes (provider,external_id,name,crag_name,gear_style,updated_at) VALUES ('thecrag',?,?,?,'Sport','2026-10-28')`
					)
					.run(external, external, crag).lastInsertRowid
			);
			ids.push(id);
			return id;
		};
		const ascent = (external: string, id: number, day: string, partner: string) =>
			db
				.prepare(
					`INSERT INTO ascents (provider,external_id,route_id,ascent_date,partners,is_send,tick_type,updated_at) VALUES ('thecrag',?,?,?,?,1,'Red point','2026-10-28')`
				)
				.run(external, id, day, partner);
		try {
			for (let i = 0; i < 8; i++) {
				const id = route(`metrics-${i}`, 'Metrics home');
				for (let n = 0; n < 20 - i; n++)
					ascent(`metrics-${i}-${n}`, id, '2026-09-01', `Metrics partner ${i}`);
			}
			for (let n = 1; n <= 4; n++)
				ascent(
					`traveller-${n}`,
					route(`traveller-${n}`, `Travel crag ${n}`),
					`2026-09-0${n}`,
					'Metrics traveller'
				);
			await page.goto('/');
			const card = page
				.locator('article')
				.filter({ has: page.getByRole('heading', { name: 'Partners', exact: true }) });
			await card.getByRole('button', { name: 'Ascents', exact: true }).click();
			await expect(card.locator('.bars>li')).toHaveCount(7);
			await expect(card).not.toContainText('Metrics traveller');
			await card.getByRole('button', { name: 'Sessions', exact: true }).click();
			await expect(card.locator('.bars>li').first()).toContainText('Metrics traveller');
			await expect(card.locator('.bars>li').first()).toContainText('4 sessions');
			await card.getByRole('button', { name: 'Areas', exact: true }).click();
			await expect(card.locator('.bars>li').first()).toContainText('Metrics traveller');
			await expect(card.locator('.bars>li').first()).toContainText('4 areas');
			await card.getByRole('link', { name: 'Partners', exact: true }).click();
			await expect(page).toHaveURL(/\/partners$/);
			await expect(page.getByRole('button', { name: 'Areas', exact: true })).toHaveAttribute(
				'aria-pressed',
				'true'
			);
			await page.getByRole('button', { name: 'Sessions', exact: true }).click();
			await page.goto('/');
			await page.reload();
			await expect(card.getByRole('button', { name: 'Sessions', exact: true })).toHaveAttribute(
				'aria-pressed',
				'true'
			);
			for (const width of [1440, 900, 390]) {
				await page.setViewportSize({ width, height: 1000 });
				await expect(card.getByRole('button', { name: 'Areas', exact: true })).toBeVisible();
				expect(await card.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
			}
			const axe = await new AxeBuilder({ page }).include('article.compact').analyze();
			expect(
				axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
			).toEqual([]);
		} finally {
			for (const id of ids) {
				db.prepare('DELETE FROM ascents WHERE route_id=?').run(id);
				db.prepare('DELETE FROM routes WHERE id=?').run(id);
			}
			db.close();
		}
	});
