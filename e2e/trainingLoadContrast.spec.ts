import Database from 'better-sqlite3';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const colorScheme of ['light', 'dark'] as const) {
	test.describe(`training load contrast in ${colorScheme}`, () => {
		test.use({ colorScheme });
		test('keeps Spike and multi-digit sidebar counts readable', async ({ page }) => {
			const db = new Database('e2e/.tmp/open.sqlite');
			const day = new Date().toISOString().slice(0, 10);
			const id = Number(
				db
					.prepare(
						`INSERT INTO routes (provider, external_id, name, gear_style, grade_raw, grade_score, grade_system, updated_at)
				VALUES ('thecrag', 'review-spike-route', 'Synthetic spike route', 'Sport', '20', 20, 'ewbank', ?)`
					)
					.run(day).lastInsertRowid
			);
			try {
				for (let n = 0; n < 30; n++)
					db.prepare(
						`INSERT INTO ascents (provider, external_id, route_id, ascent_date, is_send, tick_type, updated_at)
					VALUES ('thecrag', ?, ?, ?, 1, 'Red point', ?)`
					).run(`review-spike-${n}`, id, day, day);
				await page.goto('/');
				const card = page
					.locator('article')
					.filter({ has: page.getByRole('heading', { name: 'Training load', exact: true }) });
				await expect(card.locator('.pill')).toHaveText('Spike');
				await expect(page.locator('.side nav a[href="/logbook"] .count')).toHaveText(/\d{2,}/);
				const axe = await new AxeBuilder({ page }).analyze();
				expect(
					axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
				).toEqual([]);
			} finally {
				db.prepare('DELETE FROM ascents WHERE route_id = ?').run(id);
				db.prepare('DELETE FROM routes WHERE id = ?').run(id);
				db.close();
			}
		});
	});
}
