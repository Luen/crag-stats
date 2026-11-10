import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

test('top summary shows hardest send and first-go grades in the chosen systems', async ({
	page
}) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const ids: number[] = [];
	try {
		for (const [name, grade, effective, tick, send] of [
			['Summary redpoint', 20, 20, 'Red point', 1],
			['Summary flash', 19, 19, 'Flash', 1],
			['Summary partial pitch', 30, 17, 'Onsight', 1],
			['Summary attempt', 35, 35, 'Attempt', 0]
		] as const) {
			const id = Number(
				db
					.prepare(
						`INSERT INTO routes (provider, external_id, name, gear_style, grade_raw, grade_score, grade_system, updated_at) VALUES ('thecrag', ?, ?, 'Sport', ?, ?, 'ewbank', '2026-11-10')`
					)
					.run(name, name, String(grade), grade).lastInsertRowid
			);
			ids.push(id);
			db.prepare(
				`INSERT INTO ascents (provider, external_id, route_id, ascent_date, tick_type, is_send, is_attempt, effective_grade_score, ascent_url, updated_at) VALUES ('thecrag', ?, ?, '2026-11-01', ?, ?, ?, ?, 'https://www.thecrag.com/ascent/12345', '2026-11-10')`
			).run(name, id, tick, send, send ? 0 : 1, effective);
		}
		await page.goto('/?system=french&boulderSystem=font');
		const send = page.getByRole('article', { name: 'Hardest send', exact: true });
		const firstGo = page.getByRole('article', { name: 'Hardest onsight / flash', exact: true });
		await expect(page.locator('.metrics > :first-child')).toHaveAttribute(
			'aria-label',
			'Hardest send'
		);
		await expect(page.locator('.metrics > :nth-child(2)')).toHaveAttribute(
			'aria-label',
			'Hardest onsight / flash'
		);
		await expect(send.getByRole('link', { name: /Summary redpoint/ })).toHaveText('6b');
		await expect(firstGo.getByRole('link', { name: /Summary flash/ })).toHaveText('6a+');
		await expect(firstGo).toContainText('Routes · Flashed');
		await expect(send).toContainText('6A');
		await expect(firstGo).toContainText('Boulders · Flashed');
		await expect(send.getByRole('link', { name: /Summary redpoint/ })).toHaveAttribute(
			'href',
			'https://www.thecrag.com/ascent/12345'
		);
		for (const width of [1440, 390]) {
			await page.setViewportSize({ width, height: 1000 });
			await expect(send).toBeVisible();
			await expect(firstGo).toBeVisible();
			await expectAxeClean(page, { include: ['.metrics'] });
			expect(
				await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
			).toBe(true);
		}
	} finally {
		for (const id of ids) {
			db.prepare('DELETE FROM ascents WHERE route_id=?').run(id);
			db.prepare('DELETE FROM routes WHERE id=?').run(id);
		}
		db.close();
	}
});
