import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const colorScheme of ['light', 'dark'] as const)
	test(`owner-confirmed weather location in ${colorScheme}`, async ({ page }) => {
		await page.emulateMedia({ colorScheme });
		await page.setViewportSize({ width: 1440, height: 1000 });
		const db = new Database('e2e/.tmp/open.sqlite');
		const ids: number[] = [];
		const areaKey = JSON.stringify(['thecrag', 'area', 'fallback-area']);
		const queryKey = JSON.stringify(['reviewtown', 'AU']);
		try {
			for (const [i, name] of ['Fallback Outdoor', 'Fallback Gym'].entries()) {
				const id = Number(
					db
						.prepare(
							`INSERT INTO routes (provider,external_id,name,crag_name,area_external_id,gear_style,country,lat,lon,updated_at) VALUES ('thecrag',?,?,'Fallback area','fallback-area','Sport','Test country',10,20,'2026-10-30')`
						)
						.run(`fallback-${i}`, name).lastInsertRowid
				);
				ids.push(id);
				const raw = {
					id: `fallback-ascent-${i}`,
					date: '2025-05-01',
					route: {
						id: `fallback-${i}`,
						name,
						style: 'Sport',
						ancestors: {
							country: { id: 8, name: 'Test country', geometry: [20, 10] },
							TLC: { id: 'fallback-area', name: 'Fallback area' }
						}
					}
				};
				db.prepare(
					`INSERT INTO ascents (provider,external_id,route_id,ascent_date,tick_type,is_send,raw_json,updated_at) VALUES ('thecrag',?,?,'2025-05-01','Red point',1,?,'2026-10-30')`
				).run(`fallback-ascent-${i}`, id, JSON.stringify(raw));
			}
			db.prepare(
				`INSERT INTO weather_days (lat_key,lon_key,day,temp_max_c,temp_min_c,precip_mm,weather_code,status,fetched_at) VALUES (-44.4,133.3,'2025-05-01',38,20,6,61,'ok','2026-10-30')`
			).run();
			db.prepare(
				`INSERT INTO weather_place_searches (query_key,results_json,expires_at,next_allowed_at) VALUES (?,?,?,0)`
			).run(
				queryKey,
				JSON.stringify([
					{
						id: 123,
						name: 'Reviewtown',
						countryCode: 'AU',
						country: 'Australia',
						admin: 'Test state',
						lat: -44.4,
						lon: 133.3,
						elevation: 100
					},
					{
						id: 124,
						name: 'Reviewtown North',
						countryCode: 'AU',
						country: 'Australia',
						admin: 'Other state',
						lat: -45,
						lon: 134,
						elevation: 200
					}
				]),
				Date.now() + 86400000
			);
			await page.goto('/settings/weather-locations');
			const group = page
				.locator('details')
				.filter({ has: page.locator('summary').filter({ hasText: 'Fallback area' }) });
			await expect(group).toContainText('1/1 unresolved');
			await group.locator('summary').click();
			await group.getByLabel('Nearby place or town').fill('Reviewtown');
			await group.getByLabel('Country code').fill('AU');
			await group.getByRole('button', { name: 'Search places for Fallback area' }).click();
			await expect(page.getByRole('region', { name: 'Place search results' })).toContainText(
				'Reviewtown North'
			);
			await expect(page.getByRole('region', { name: 'Place search results' })).toContainText(
				'Test state'
			);
			await page
				.getByRole('button', {
					name: 'Use Reviewtown as an approximate weather place',
					exact: true
				})
				.click();
			await expect(page.getByRole('status')).toContainText('saved');
			await page.goto('/logbook?weather=rain&q=Fallback');
			await expect(page.locator('.head')).toContainText('1 ascent');
			await expect(page.locator('tbody')).toContainText('Fallback Outdoor');
			await expect(page.locator('tbody')).not.toContainText('Fallback Gym');
			await expect(page.locator('.weather-cell').last()).toContainText('Approximate nearby place');
			await expect(page.locator('.weather-cell').last()).toContainText('Reviewtown');
			await expect(page.locator('.weather-cell').last()).toContainText('High 38°C');
			await page.goto('/settings/weather-locations');
			await group.locator('summary').click();
			await expect(group).toContainText('Chosen fallback: Reviewtown');
			const axe = await new AxeBuilder({ page }).analyze();
			expect(
				axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
			).toEqual([]);
			await group.getByRole('button', { name: 'Remove nearby-place fallback' }).click();
			await expect(group).toContainText('1/1 unresolved');
			await page.goto('/logbook?weather=rain&q=Fallback');
			await expect(page.locator('.head')).toContainText('0 ascents');

			// Synthetic typed GeoJSON verifies the complete cached polygon → UI path.
			const stored = db.prepare('SELECT raw_json FROM ascents WHERE route_id=?').get(ids[0]) as {
				raw_json: string;
			};
			const polygonRaw = JSON.parse(stored.raw_json);
			polygonRaw.route.ancestors.TLC.geometry = {
				type: 'Polygon',
				coordinates: [
					[
						[133.29, -44.41],
						[133.31, -44.41],
						[133.31, -44.39],
						[133.29, -44.39],
						[133.29, -44.41]
					]
				]
			};
			db.prepare('UPDATE ascents SET raw_json=? WHERE route_id=?').run(
				JSON.stringify(polygonRaw),
				ids[0]
			);
			await page.goto('/settings/weather-locations');
			await expect(group).toContainText('0/1 unresolved');
			await expect(group).toContainText('polygon');
			await page.goto('/logbook?weather=rain&q=Fallback');
			await expect(page.locator('.head')).toContainText('1 ascent');
			await expect(page.locator('.weather-cell').last()).toContainText('Approximate area polygon');
			await expect(page.locator('.weather-cell').last()).toContainText('High 38°C');
			await page.setViewportSize({ width: 800, height: 1000 });
			await expect(page.locator('tbody')).toContainText('Approximate area polygon');
			await page.goto('http://localhost:4302/settings/weather-locations');
			await expect(page).toHaveURL(/\/login/);
		} finally {
			db.prepare('DELETE FROM weather_place_overrides WHERE area_key=?').run(areaKey);
			db.prepare('DELETE FROM weather_place_searches WHERE query_key=?').run(queryKey);
			for (const id of ids) {
				db.prepare('DELETE FROM weather_locations WHERE route_id=?').run(id);
				db.prepare('DELETE FROM ascents WHERE route_id=?').run(id);
				db.prepare('DELETE FROM routes WHERE id=?').run(id);
			}
			db.prepare('DELETE FROM weather_days WHERE lat_key=-44.4 AND lon_key=133.3').run();
			db.close();
		}
	});
