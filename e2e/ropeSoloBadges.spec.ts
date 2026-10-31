import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const colorScheme of ['light', 'dark'] as const)
	test(`separate first rope-solo badges in ${colorScheme}`, async ({ page }) => {
		await page.emulateMedia({ colorScheme });
		const db = new Database('e2e/.tmp/open.sqlite');
		const ids: number[] = [];
		try {
			for (const [i, tick] of ['Lead solo', 'Roped Solo'].entries()) {
				const routeId = Number(
					db
						.prepare(
							`INSERT INTO routes (provider,external_id,name,gear_style,updated_at) VALUES ('thecrag',?,?,'Sport','2026-10-31')`
						)
						.run(`rope-badge-${i}`, `Synthetic rope solo ${i}`).lastInsertRowid
				);
				ids.push(routeId);
				db.prepare(
					`INSERT INTO ascents (provider,external_id,route_id,ascent_date,tick_type,ascent_gear_style,is_send,ascent_url,comment,updated_at) VALUES ('thecrag',?,?,'2025-01-01',?,?,1,?,'Private solo note','2026-10-31')`
				).run(
					`rope-badge-${i}`,
					routeId,
					tick,
					i === 0 ? 'Trad' : 'Top rope',
					`https://www.thecrag.com/ascent/${12340 + i}`
				);
			}
			await page.goto('/badges');
			for (const [i, title] of ['First Lead Rope Solo', 'First Top-Rope Solo'].entries()) {
				const card = page
					.locator('article.card')
					.filter({ has: page.getByRole('heading', { name: title, exact: true }) });
				await expect(card).not.toHaveClass(/locked/);
				await expect(card.getByRole('link', { name: 'View climb' })).toHaveAttribute(
					'href',
					`https://www.thecrag.com/ascent/${12340 + i}`
				);
			}
			await expect(page.locator('body')).not.toContainText('Private solo note');
			for (const width of [1440, 390]) {
				await page.setViewportSize({ width, height: 1000 });
				const axe = await new AxeBuilder({ page }).include('main').analyze();
				expect(
					axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
				).toEqual([]);
			}
		} finally {
			for (const id of ids) {
				db.prepare('DELETE FROM ascents WHERE route_id=?').run(id);
				db.prepare('DELETE FROM routes WHERE id=?').run(id);
			}
			db.close();
		}
	});
