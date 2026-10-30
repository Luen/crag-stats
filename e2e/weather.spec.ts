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
						VALUES ('thecrag', ?, ?, ?, 'Sport', 12, 34, '2026-10-28')`
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
						VALUES ('thecrag', ?, ?, ?, 1, 'Red point', '2026-10-28')`
					).run(`review-weather-${index}`, id, index === 0 ? '2026-10-28' : '2026-10-29');
				}
				for (const [day, high] of [
					['2026-10-28', 20],
					['2026-10-29', 38]
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
				const calendar = page
					.locator('article')
					.filter({ has: page.getByRole('heading', { name: 'Ascent calendar', exact: true }) });
				await calendar.getByRole('button', { name: 'Weather', exact: true }).click();
				await expect(
					calendar.getByRole('button', { name: 'Weather', exact: true })
				).toHaveAttribute('aria-pressed', 'true');
				await calendar.getByText('View weather values', { exact: false }).click();
				await expect(calendar.getByRole('table')).toContainText('38°C');
				await expect(calendar.locator('a[href="/logbook?day=2026-10-29"]').first()).toHaveAttribute(
					'title',
					/Hot.*high 38°C/
				);
				const calendarAxe = await new AxeBuilder({ page }).include('.values').analyze();
				expect(
					calendarAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
				).toEqual([]);
				const recent = page
					.locator('article')
					.filter({ has: page.getByRole('heading', { name: 'Recent activities', exact: true }) });
				const hot = recent.locator('li').filter({ hasText: 'Review hot weather' });
				await expect(hot.getByRole('list', { name: 'Weather on the day' })).toContainText(
					'Hot 38°C'
				);
				const gym = recent.locator('li').filter({ hasText: 'Review Gym' });
				await expect(gym.getByRole('list', { name: 'Weather on the day' })).toHaveCount(0);
				for (const path of [
					'/',
					'/logbook?weather=heat&from=2026-10-28&to=2026-10-29&style=Sport'
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
					// Audit the changed weather surfaces; the existing a11y suite covers the whole dashboard.
					const audit = new AxeBuilder({ page });
					if (path === '/') {
						await card.evaluate((el) => el.setAttribute('data-review-weather-card', ''));
						await recent.evaluate((el) => el.setAttribute('data-review-weather-recent', ''));
						audit.include('[data-review-weather-card]').include('[data-review-weather-recent]');
					}
					const axe = await audit.analyze();
					expect(
						axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
					).toEqual([]);
				}

				await page.goto('/sectors');
				const crag = page
					.locator('li')
					.filter({ has: page.getByRole('button', { name: 'Review Outdoor Crag', exact: false }) })
					.first();
				await expect(page.locator('.climate')).toHaveCount(0);
				for (const day of ['2026-10-25', '2026-10-26', '2026-10-27']) {
					db.prepare(
						`INSERT INTO ascents (provider, external_id, route_id, ascent_date, is_send, tick_type, updated_at)
						VALUES ('thecrag', ?, ?, ?, 1, 'Red point', '2026-10-28')`
					).run(`review-climate-${day}`, ids[0], day);
					db.prepare(
						`INSERT INTO weather_days (lat_key, lon_key, day, temp_max_c, temp_min_c, precip_mm, weather_code, status, fetched_at)
						VALUES (12, 34, ?, 20, 10, 0, 0, 'ok', '2026-10-28')`
					).run(day);
				}
				await page.reload();
				await expect(page.locator('.climate')).toHaveCount(1);
				await expect(page.locator('.climate')).toContainText('On your 5 cached visit days');
				await expect(page.locator('.climate')).toContainText('not official climate normals');
				await expect(crag).toContainText('average high');
				const climateAxe = await new AxeBuilder({ page }).include('.climate').analyze();
				expect(
					climateAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
				).toEqual([]);
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
