import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';

for (const colorScheme of ['light', 'dark'] as const) {
	test.describe(`compact hidden gems in ${colorScheme}`, () => {
		test.use({ colorScheme });
		test('keeps three normal-sized gem titles and large bucket percentages', async ({ page }) => {
			const db = new Database('e2e/.tmp/open.sqlite');
			const ids: number[] = [];
			try {
				for (let n = 1; n <= 5; n++) {
					const externalId = `review-gem-${n}`;
					const id = Number(
						db
							.prepare(
								`INSERT INTO routes
						(provider, external_id, name, gear_style, quality_score, popularity, ascent_count, updated_at)
						VALUES ('thecrag', ?, ?, 'Sport', 100, 10, ?, '2024-02-01')`
							)
							.run(externalId, `Review gem ${n}`, n).lastInsertRowid
					);
					ids.push(id);
					db.prepare(
						`INSERT INTO ascents (provider, external_id, route_id, ascent_date, is_send, tick_type, updated_at)
						VALUES ('thecrag', ?, ?, '2024-02-01', 1, 'Red point', '2024-02-01')`
					).run(externalId, id);
				}
				await page.goto('/');
				const card = page
					.locator('article')
					.filter({ has: page.getByRole('heading', { name: 'Route popularity', exact: true }) });
				await expect(card.locator('.gems li')).toHaveCount(3);
				await expect(card.locator('.gems strong')).toHaveText([
					'Review gem 1',
					'Review gem 2',
					'Review gem 3'
				]);
				const titleSize = await card
					.locator('.gems strong')
					.first()
					.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
				const bucketSize = await card
					.locator('.bucket strong')
					.first()
					.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
				expect(titleSize).toBeLessThan(bucketSize);
				expect(titleSize).toBeLessThanOrEqual(16);
			} finally {
				for (const id of ids) {
					db.prepare('DELETE FROM ascents WHERE route_id = ?').run(id);
					db.prepare('DELETE FROM routes WHERE id = ?').run(id);
				}
				db.close();
			}
		});
	});
}
