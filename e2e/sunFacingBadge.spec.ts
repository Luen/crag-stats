import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const evidence of ['aspect', 'all-day-sun'] as const)
	for (const colorScheme of ['light', 'dark'] as const)
		test(`direct ${evidence} summer badge in ${colorScheme}`, async ({ page }) => {
			await page.emulateMedia({ colorScheme });
			const db = new Database('e2e/.tmp/open.sqlite');
			let routeId: number | undefined;
			try {
				routeId = Number(
					db
						.prepare(
							`INSERT INTO routes (provider,external_id,name,crag_name,gear_style,lat,lon,tags_json,updated_at) VALUES ('thecrag','sun-face-test','Synthetic Sun Face','Synthetic sun crag','Sport',-34,151,?,'2026-10-30')`
						)
						.run(
							JSON.stringify([
								{
									category: evidence === 'aspect' ? 'Aspect' : 'Weather',
									name: evidence === 'aspect' ? 'N' : 'All day sun',
									source: 'route'
								}
							])
						).lastInsertRowid
				);
				const raw = {
					id: 987654321,
					date: '2025-01-01',
					privateMarkdown: 'Private note remains private',
					route: {
						id: 'sun-face-test',
						name: 'View climb',
						style: 'Sport',
						lat: -34,
						lon: 151,
						tags:
							evidence === 'aspect'
								? { Aspect: { N: { name: 'N', id: 1 } } }
								: { Weather: { sun: { name: 'All day sun', id: 1 } } }
					}
				};
				db.prepare(
					`INSERT INTO ascents (provider,external_id,route_id,ascent_date,tick_type,is_send,ascent_url,comment,raw_json,updated_at) VALUES ('thecrag','sun-face-test',?,'2025-01-01','Attempt',0,'https://www.thecrag.com/ascent/987654321','Private note remains private',?,'2026-10-30')`
				).run(routeId, JSON.stringify(raw));
				await page.goto('/badges');
				const card = page
					.locator('article.card')
					.filter({ has: page.getByRole('heading', { name: 'Summer Sun Face', exact: true }) });
				await expect(card).not.toHaveClass(/locked/);
				await expect(card).toContainText('aspect heuristic');
				await expect(card.getByRole('link', { name: 'View climb' })).toHaveAttribute(
					'href',
					'https://www.thecrag.com/ascent/987654321'
				);
				await expect(page.locator('body')).not.toContainText('Private note remains private');
				const axe = await new AxeBuilder({ page }).analyze();
				expect(
					axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
				).toEqual([]);
			} finally {
				if (routeId) {
					db.prepare('DELETE FROM weather_locations WHERE route_id=?').run(routeId);
					db.prepare('DELETE FROM ascents WHERE route_id=?').run(routeId);
					db.prepare('DELETE FROM routes WHERE id=?').run(routeId);
				}
				db.close();
			}
		});
