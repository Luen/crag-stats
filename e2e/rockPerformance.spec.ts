import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

test('rock & performance card flags a band and drills into the logbook', async ({ page }) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const routeIds: number[] = [];
	try {
		const insertRoute = db.prepare(
			`INSERT INTO routes (provider,external_id,name,crag_name,gear_style,tags_json,updated_at)
			VALUES ('thecrag',?,?,?,'Sport',?,'2026-10-28')`
		);
		const ascent = db.prepare(
			`INSERT INTO ascents (provider,external_id,route_id,ascent_date,is_send,is_attempt,tick_type,updated_at)
			VALUES ('thecrag',?,?,?,?,?,?,'2026-10-28')`
		);
		const granite = Number(
			insertRoute.run(
				'rock-perf-granite',
				'Granite Arete',
				'Rock Perf Crag',
				JSON.stringify([{ category: 'Rock type', name: 'Granite' }])
			).lastInsertRowid
		);
		const sand = Number(
			insertRoute.run(
				'rock-perf-sand',
				'Sandstone Arete',
				'Rock Perf Crag',
				JSON.stringify([{ category: 'Rock type', name: 'Sandstone' }])
			).lastInsertRowid
		);
		routeIds.push(granite, sand);

		for (let i = 0; i < 24; i++) {
			const day = `2026-08-${String(i + 1).padStart(2, '0')}`;
			const useGranite = i % 2 === 0;
			const routeId = useGranite ? granite : sand;
			const sends = useGranite ? (i % 4 === 0 ? 1 : 0) : i % 4 === 1 ? 4 : 3;
			for (let n = 0; n < 4; n++) {
				const send = n < sends;
				ascent.run(
					`rock-perf-${i}-${n}`,
					routeId,
					day,
					send ? 1 : 0,
					send ? 0 : 1,
					send ? 'Red point' : 'Attempt'
				);
			}
		}

		await page.goto('/');
		const card = page.locator('article.rock-performance');
		await expect(card.getByRole('heading', { name: 'Rock & performance' })).toBeVisible();
		await expect(card.locator('.summary')).toContainText(/Send rate is (higher|lower) on/);
		await expect(card.locator('a[href="/logbook?rock=Granite"]')).toBeVisible();
		const sandLink = card.locator('a[href="/logbook?rock=Sandstone"]');
		await expect(sandLink).toContainText('↑ Higher');
		await card.getByText('View values').click();
		await expect(card.getByRole('table')).toContainText('Sandstone');
		await expectAxeClean(page, { include: ['article.rock-performance'] });

		await sandLink.click();
		await expect(page).toHaveURL(/rock=Sandstone/);
		await expect(page.locator('tbody')).toContainText('Sandstone Arete');
	} finally {
		for (const id of routeIds) {
			db.prepare('DELETE FROM ascents WHERE route_id = ?').run(id);
			db.prepare('DELETE FROM routes WHERE id = ?').run(id);
		}
		db.close();
	}
});
