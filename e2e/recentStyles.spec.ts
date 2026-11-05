import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

test('recent activities show discipline, ascent protection and explicit solo styles', async ({
	page
}) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const ids: number[] = [];
	try {
		for (const [name, style, ascentStyle, tick] of [
			['Recent sport', 'Sport', null, 'Red point'],
			['Recent trad', 'Trad', null, 'Red point'],
			['Recent solo', 'Trad', null, 'Lead solo'],
			['Recent different gear', 'Sport', 'Trad', 'Red point']
		]) {
			const id = Number(
				db
					.prepare(
						`INSERT INTO routes (provider,external_id,name,gear_style,updated_at)
				VALUES ('thecrag',?,?,?,'2026-11-05')`
					)
					.run(`styles-${name}`, name, style).lastInsertRowid
			);
			ids.push(id);
			db.prepare(
				`INSERT INTO ascents (provider,external_id,route_id,ascent_date,is_send,tick_type,ascent_gear_style,updated_at)
				VALUES ('thecrag',?,?,'2026-11-05',1,?,?,'2026-11-05')`
			).run(`styles-${name}`, id, tick, ascentStyle);
		}
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		const card = page
			.locator('article')
			.filter({ has: page.getByRole('heading', { name: 'Recent activities', exact: true }) });
		const row = (name: string) =>
			card
				.locator('.list > li')
				.filter({ hasText: name })
				.getByRole('group', { name: 'Climb styles' });
		await expect(row('Recent sport').locator('.badge')).toHaveText(['Sport']);
		await expect(row('Recent trad').locator('.badge')).toHaveText(['Trad']);
		await expect(row('Recent solo').locator('.badge')).toHaveText(['Trad', 'Lead solo']);
		await expect(row('Recent different gear').locator('.badge')).toHaveText(['Sport', 'Trad']);
		await expectAxeClean(page, { include: [card] });
		expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
	} finally {
		for (const id of ids) {
			db.prepare('DELETE FROM ascents WHERE route_id = ?').run(id);
			db.prepare('DELETE FROM routes WHERE id = ?').run(id);
		}
		db.close();
	}
});
