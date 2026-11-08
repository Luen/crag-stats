import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

test('repeats vs new routes card lists the most repeated route and filters by style', async ({
	page
}) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const routeIds: number[] = [];
	try {
		const insertRoute = db.prepare(
			`INSERT INTO routes (provider,external_id,name,crag_name,gear_style,updated_at)
			VALUES ('thecrag',?,?,'Repeat Test Crag',?,'2026-10-28')`
		);
		const ascent = db.prepare(
			`INSERT INTO ascents (provider,external_id,route_id,ascent_date,is_send,is_attempt,tick_type,updated_at)
			VALUES ('thecrag',?,?,?,1,0,'Red point','2026-10-28')`
		);

		const favourite = Number(
			insertRoute.run('repeats-favourite', 'Repeat Test Favourite', 'Boulder').lastInsertRowid
		);
		routeIds.push(favourite);
		for (let i = 0; i < 6; i++) {
			ascent.run(`repeats-fav-${i}`, favourite, `2026-0${i + 1}-15`);
		}
		for (let i = 0; i < 20; i++) {
			const id = Number(
				insertRoute.run(`repeats-new-${i}`, `Repeat Test New ${i}`, 'Sport').lastInsertRowid
			);
			routeIds.push(id);
			ascent.run(`repeats-new-${i}`, id, `2026-07-${String(i + 1).padStart(2, '0')}`);
		}

		await page.goto('/');
		const card = page.locator('article.route-repeats');
		await expect(card.getByRole('heading', { name: 'Repeats vs new routes' })).toBeVisible();
		await expect(
			card.getByRole('link', { name: 'How repeats vs new routes works' })
		).toHaveAttribute('href', '/docs/repeats');
		const link = card.locator(`a[href="/logbook?route=${favourite}"]`);
		await expect(link).toHaveText('Repeat Test Favourite');
		await expect(card.locator('.top li').first()).toContainText('6 days');
		await expectAxeClean(page, { include: ['article.route-repeats'] });

		await card.getByRole('button', { name: 'Boulder' }).click();
		await expect(card.getByRole('button', { name: 'Boulder' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect(link).toBeVisible();
		await expect(card.getByText('Repeat Test New 0')).toHaveCount(0);

		await link.click();
		await expect(page).toHaveURL(new RegExp(`route=${favourite}`));
		await expect(page.locator('tbody')).toContainText('Repeat Test Favourite');
	} finally {
		for (const id of routeIds) {
			db.prepare('DELETE FROM ascents WHERE route_id = ?').run(id);
			db.prepare('DELETE FROM routes WHERE id = ?').run(id);
		}
		db.close();
	}
});
