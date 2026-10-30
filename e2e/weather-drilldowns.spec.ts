import Database from 'better-sqlite3';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const colorScheme of ['light', 'dark'] as const) {
	test.describe(`weather drill-downs in ${colorScheme}`, () => {
		test.use({ colorScheme });
		test('condition and histogram rows filter ascents and keep the range across navigation', async ({
			page
		}) => {
			const db = new Database('e2e/.tmp/open.sqlite');
			const ids: number[] = [];
			const fmt = (n: number) => n.toLocaleString(process.env.DISPLAY_LOCALE || 'en-AU');
			try {
				for (const [i, name] of [
					'Drill rain',
					'Drill boundary',
					'Drill cold',
					'Drill Gym'
				].entries()) {
					const id = Number(
						db
							.prepare(
								`INSERT INTO routes (provider,external_id,name,crag_name,gear_style,lat,lon,updated_at) VALUES ('thecrag',?,?,?,'Sport',45,67,'2026-10-28')`
							)
							.run(`drill-${i}`, name, i === 3 ? 'Drill Climbing Gym' : 'Drill Outdoor')
							.lastInsertRowid
					);
					ids.push(id);
					for (let n = 0; n < (i === 0 ? 52 : 1); n++)
						db.prepare(
							`INSERT INTO ascents (provider,external_id,route_id,ascent_date,is_send,tick_type,updated_at) VALUES ('thecrag',?,?,?,1,'Red point','2026-10-28')`
						).run(
							`drill-${i}-${n}`,
							id,
							`2026-09-${i === 3 ? '01' : String(i + 1).padStart(2, '0')}`
						);
				}
				for (const [day, high, rain] of [
					['2026-09-01', 24.9, 6],
					['2026-09-02', 25, 0],
					['2026-09-03', -1, 0]
				] as const)
					db.prepare(
						`INSERT INTO weather_days (lat_key,lon_key,day,temp_max_c,temp_min_c,precip_mm,weather_code,status,fetched_at) VALUES (45,67,?,?, -2,?,0,'ok','2026-10-28')`
					).run(day, high, rain);
				await page.setViewportSize({ width: 1440, height: 1000 });
				await page.goto('/');
				const card = page
					.locator('article')
					.filter({ has: page.getByRole('heading', { name: 'Weather conditions', exact: true }) });
				const rainy = card.locator('a[href="/logbook?weather=rain"]');
				await expect(rainy).toContainText('Rainy');
				await expect(rainy.locator('.fill')).toHaveAttribute('style', /width:\s*[\d.]+%/);
				await rainy.focus();
				await expect(rainy).toBeFocused();
				// The track itself is inside the native link, including for empty bars.
				await rainy.locator('.track').click();
				await expect(page).toHaveURL(/weather=rain/);
				await expect(page.locator('tbody')).toContainText('Drill rain');
				await expect(page.locator('tbody')).not.toContainText('Drill Gym');
				const weather = page
					.locator('tbody tr')
					.filter({ hasText: 'Drill rain' })
					.first()
					.locator('.weather-cell');
				await expect(weather).toContainText(`High ${fmt(24.9)}°C`);
				await expect(weather).toContainText('Rain 6 mm');
				await expect(
					page.getByRole('columnheader', { name: 'Weather', exact: true })
				).toBeVisible();
				for (const width of [1279, 900, 390]) {
					await page.setViewportSize({ width, height: 900 });
					await expect(
						page.getByRole('columnheader', { name: 'Weather', exact: true })
					).toHaveCount(0);
					await expect(weather).not.toBeVisible();
					await expect(
						page
							.locator('tbody tr')
							.filter({ hasText: 'Drill rain' })
							.first()
							.locator('.route-weather-chips')
					).toBeVisible();
				}
				await page.setViewportSize({ width: 1440, height: 1000 });
				await page.goto('/');
				const range = card.locator('a[href="/logbook?weatherHighMin=20&weatherHighMax=25"]');
				await range.locator('.track').click();
				await expect(page).toHaveURL(/weatherHighMin=20&weatherHighMax=25/);
				await expect(page.locator('.head')).toContainText('52 ascents');
				await expect(page.locator('tbody')).not.toContainText('Drill boundary');
				await page.getByRole('link', { name: 'Grade', exact: true }).click();
				await expect(page).toHaveURL(/weatherHighMin=20&weatherHighMax=25/);
				await page.getByRole('link', { name: /Next/ }).click();
				await expect(page).toHaveURL(/page=2/);
				await expect(page).toHaveURL(/weatherHighMax=25/);
				await expect(page.locator('tbody tr')).toHaveCount(2);
				await page.locator('input[name="q"]').fill('Drill rain');
				await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
				await expect(page).toHaveURL(/weatherHighMin=20/);
				await expect(page.locator('.head')).toContainText('52 ascents');
				const clear = page.getByRole('link', { name: 'Clear weather range' });
				await expect(clear).toHaveAttribute('href', /q=Drill\+rain/);
				await expect(clear).not.toHaveAttribute('href', /weatherHigh/);
				const axe = await new AxeBuilder({ page }).analyze();
				expect(
					axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
				).toEqual([]);
				await page.goto('/logbook?q=Drill');
				const gym = page.locator('tbody tr').filter({ hasText: 'Drill Gym' });
				await expect(gym.locator('.weather-cell')).toHaveText('—');
				const ordinary = page.locator('tbody tr').filter({ hasText: 'Drill boundary' });
				await expect(ordinary.locator('.weather-cell')).toContainText('High 25°C');
				await page.goto('/');
				const cardAxe = await new AxeBuilder({ page })
					.include('.shares')
					.include('.whole-row')
					.analyze();
				expect(
					cardAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
				).toEqual([]);
			} finally {
				for (const id of ids) {
					db.prepare('DELETE FROM ascents WHERE route_id=?').run(id);
					db.prepare('DELETE FROM routes WHERE id=?').run(id);
				}
				db.prepare('DELETE FROM weather_days WHERE lat_key=45 AND lon_key=67').run();
				db.close();
			}
		});
	});
}
