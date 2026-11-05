import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

test('weather summary opens shareable performance views and logbook drill-downs', async ({
	page
}) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	let routeId = 0;
	try {
		routeId = Number(
			db
				.prepare(
					`INSERT INTO routes (provider,external_id,name,crag_name,gear_style,lat,lon,updated_at)
					VALUES ('thecrag','perf-route','Perf Arete','Perf Outdoor','Sport',56,78,'2026-10-28')`
				)
				.run().lastInsertRowid
		);
		const ascent = db.prepare(
			`INSERT INTO ascents (provider,external_id,route_id,ascent_date,is_send,is_attempt,tick_type,updated_at)
			VALUES ('thecrag',?,?,?,?,?,?,'2026-10-28')`
		);
		const weather = db.prepare(
			`INSERT INTO weather_days (lat_key,lon_key,day,temp_max_c,temp_min_c,precip_mm,weather_code,status,fetched_at)
			VALUES (56,78,?,?,2,0,0,'ok','2026-10-28')`
		);
		// 24 location-days: cold days send 0–1 of 4, mild days 3–4 of 4.
		for (let i = 0; i < 24; i++) {
			const day = `2026-08-${String(i + 1).padStart(2, '0')}`;
			const cold = i % 2 === 0;
			weather.run(day, cold ? 5 : 20);
			const sends = cold ? (i % 4 === 0 ? 1 : 0) : i % 4 === 1 ? 4 : 3;
			for (let n = 0; n < 4; n++) {
				const send = n < sends;
				ascent.run(
					`perf-${i}-${n}`,
					routeId,
					day,
					send ? 1 : 0,
					send ? 0 : 1,
					send ? 'Red point' : 'Attempt'
				);
			}
		}

		await page.goto('/');
		const card = page.locator('article.weather-performance');
		await expect(card.getByRole('heading', { name: 'Weather & performance' })).toBeVisible();
		await expect(card.locator('.summary')).toContainText('Send rate is lower on days under 10°');
		await expect(card.getByRole('button')).toHaveCount(0);
		await expectAxeClean(page, { include: [card] });
		await card.getByRole('link', { name: 'Weather & performance', exact: true }).click();
		await expect(page).toHaveURL(/\/weather#performance/);
		const cold = card.locator('a[href="/logbook?weatherHighMax=10"]');
		await expect(cold).toContainText('12.5%');
		await expect(cold).toContainText('↓ Lower');
		await expect(
			card.locator('a[href="/logbook?weatherHighMin=18&weatherHighMax=25"]')
		).toContainText('↑ Higher');

		await card.getByRole('button', { name: 'Conditions', exact: true }).click();
		await expect(card.getByRole('button', { name: 'Conditions', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect(card.locator('a[href="/logbook?weather=freeze"]')).toBeVisible();
		await card.getByRole('button', { name: 'Onsight/flash', exact: true }).click();
		await expect(card.locator('.summary')).toContainText('No weather band stands out');
		await expect(page).toHaveURL(/group=conditions.*measure=onsightFlash/);
		await page.reload();
		await expect(card.getByRole('button', { name: 'Conditions', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect(card.getByRole('button', { name: 'Onsight/flash', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await page.goBack();
		await expect(card.getByRole('button', { name: 'Send rate', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await page.goForward();
		await card.getByText('View values').click();
		await expect(card.getByRole('table')).toContainText('Freezing');
		await page.setViewportSize({ width: 390, height: 844 });
		await expectAxeClean(page, { include: ['main'] });
		await expect(page.locator('html')).toHaveJSProperty('scrollWidth', 390);

		await card.getByRole('button', { name: 'Daily high', exact: true }).click();
		await card.locator('a[href="/logbook?weatherHighMax=10"]').click();
		await expect(page).toHaveURL(/weatherHighMax=10/);
		await expect(page.locator('tbody')).toContainText('Perf Arete');
	} finally {
		db.prepare('DELETE FROM ascents WHERE route_id = ?').run(routeId);
		db.prepare('DELETE FROM routes WHERE id = ?').run(routeId);
		db.prepare('DELETE FROM weather_days WHERE lat_key = 56 AND lon_key = 78').run();
		db.close();
	}
});
