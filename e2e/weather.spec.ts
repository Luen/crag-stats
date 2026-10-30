import Database from 'better-sqlite3';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const colorScheme of ['light', 'dark'] as const) {
	test.describe(`cached weather in ${colorScheme}`, () => {
		test.use({ colorScheme });
		test('outdoor cache drives the card and logbook; indoor rows stay excluded', async ({
			page
		}) => {
			const db = new Database('e2e/.tmp/open.sqlite');
			const ids: number[] = [];
			try {
				for (const [index, name] of [
					'Review fair weather',
					'Review hot weather',
					'Review Gym'
				].entries()) {
					const id = Number(
						db
							.prepare(
								`INSERT INTO routes
						(provider, external_id, name, crag_name, gear_style, lat, lon, updated_at)
						VALUES ('thecrag', ?, ?, ?, 'Sport', 12, 34, '2024-02-01')`
							)
							.run(
								`review-weather-${index}`,
								name,
								index === 2 ? 'Review Climbing Gym' : 'Review Outdoor Crag'
							).lastInsertRowid
					);
					ids.push(id);
					db.prepare(
						`INSERT INTO ascents (provider, external_id, route_id, ascent_date, is_send, tick_type, updated_at)
						VALUES ('thecrag', ?, ?, ?, 1, 'Red point', '2024-02-01')`
					).run(`review-weather-${index}`, id, index === 0 ? '2024-02-01' : '2024-02-02');
				}
				for (const [day, high] of [
					['2024-02-01', 20],
					['2024-02-02', 38]
				] as const) {
					db.prepare(
						`INSERT INTO weather_days (lat_key, lon_key, day, temp_max_c, temp_min_c, precip_mm, weather_code, status, fetched_at)
						VALUES (12, 34, ?, ?, 10, 0, 0, 'ok', '2024-02-10')`
					).run(day, high);
				}
				await page.goto('/');
				const card = page
					.locator('article')
					.filter({ has: page.getByRole('heading', { name: 'Weather conditions', exact: true }) });
				await expect(card).toContainText('38°C');
				await expect(card).toContainText('Review hot weather');
				await expect(card).not.toContainText('Review Gym');
				for (const path of [
					'/',
					'/logbook?weather=heat&from=2024-02-01&to=2024-02-02&style=Sport'
				]) {
					await page.goto(path);
					if (path.startsWith('/logbook')) {
						await expect(page.locator('tbody')).toContainText('Review hot weather');
						await expect(page.locator('tbody')).not.toContainText('Review Gym');
						await expect(page.locator('tbody')).not.toContainText('Review fair weather');
						await expect(page.getByRole('list', { name: 'Weather on the day' })).toContainText(
							'Hot 38°C'
						);
					}
					const axe = await new AxeBuilder({ page }).analyze();
					expect(
						axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
					).toEqual([]);
				}
				await page.goto('/logbook?weather=fair');
				await expect(page.locator('tbody')).toContainText('Review fair weather');
				await expect(page.locator('tbody')).not.toContainText('Review Gym');
				await page.goto('http://localhost:4302/logbook?missing=weather');
				await expect(page.getByRole('checkbox', { name: 'No weather cached' })).not.toBeVisible();
			} finally {
				for (const id of ids) {
					db.prepare('DELETE FROM ascents WHERE route_id = ?').run(id);
					db.prepare('DELETE FROM routes WHERE id = ?').run(id);
				}
				db.prepare('DELETE FROM weather_days WHERE lat_key = 12 AND lon_key = 34').run();
				db.close();
			}
		});
	});
}
