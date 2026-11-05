import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';
test('streak record and badges', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	const db = new Database('e2e/.tmp/open.sqlite');
	const route = Number(
		db
			.prepare(
				"INSERT INTO routes (provider,external_id,name,gear_style,updated_at) VALUES ('thecrag','streak-fixture','Synthetic streak','Gym','now')"
			)
			.run().lastInsertRowid
	);
	try {
		for (let i = 0; i < 30; i++) {
			const day = new Date(Date.UTC(2024, 1, 1 + i)).toISOString().slice(0, 10);
			db.prepare(
				"INSERT INTO ascents (provider,external_id,route_id,ascent_date,tick_type,is_send,is_attempt,updated_at) VALUES ('thecrag',?, ?,?,'Attempt',0,1,'now')"
			).run(`streak-fixture-${i}`, route, day);
		}
		await page.goto('/');
		const card = page
			.locator('article')
			.filter({ has: page.getByRole('heading', { name: 'Streaks', exact: true }) });
		await expect(card.locator('.card').filter({ hasText: 'longest' })).toContainText('30');
		await expect(card.locator('time').first()).toHaveAttribute('datetime', '2024-02-01');
		await expect(card.locator('time').last()).toHaveAttribute('datetime', '2024-03-01');
		await expect(card).toContainText('active days');
		await expect(card.getByRole('link', { name: 'How it works' })).toHaveAttribute(
			'href',
			'/docs/activity'
		);
		await expect(card).not.toContainText('2024-02-01');
		await expectAxeClean(page, { include: [card] });
		expect(await card.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
		await page.goto('/badges');
		for (const n of [7, 10, 30])
			await expect(page.getByText(`${n}-Day Streak`, { exact: true })).toBeVisible();
	} finally {
		db.prepare('DELETE FROM ascents WHERE route_id=?').run(route);
		db.prepare('DELETE FROM routes WHERE id=?').run(route);
		db.close();
	}
});
