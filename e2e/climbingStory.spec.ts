import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

test('popular put-up story shows the community estimate and links its escaped route name', async ({
	page
}) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const externalId = '987654321012345';
	const name = 'Insight <test> & friends';
	const href = `https://www.thecrag.com/en/climbing/test-area/route/${externalId}`;
	let routeId: number | undefined;
	try {
		routeId = Number(
			db
				.prepare(
					`INSERT INTO routes
			(provider, external_id, name, url, gear_style, ascent_count, ascent_count_own, updated_at)
			VALUES ('thecrag', ?, ?, ?, 'Sport', 1236, 2, '2026-11-05')`
				)
				.run(externalId, name, href).lastInsertRowid
		);
		db.prepare(
			`INSERT INTO ascents (provider, external_id, route_id, ascent_date, is_send, tick_type, updated_at)
			VALUES ('thecrag', 'story-put-up-ascent', ?, '2026-01-01', 1, 'Red point', '2026-11-05')`
		).run(routeId);
		db.prepare(
			`INSERT INTO first_ascents (provider, route_external_id, kind, created_at)
			VALUES ('thecrag', ?, 'FA', '2026-11-05')`
		).run(externalId);
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		const card = page
			.locator('article')
			.filter({ has: page.getByRole('heading', { name: 'Climbing story', exact: true }) });
		await expect(card).toContainText(
			`The most popular route I've put up is ${name}, and it's a mega classic with over 1,234 ascents!`
		);
		const link = card.getByRole('link', { name, exact: true });
		await expect(link).toHaveAttribute('href', href);
		await expect(link).toHaveAttribute('target', '_blank');
		await expect(link).toHaveAttribute('rel', 'noreferrer');
		await expect(link.locator('test')).toHaveCount(0);
		await link.focus();
		await expect(link).toBeFocused();
		await expectAxeClean(page, { include: [card] });
		expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
		db.prepare('UPDATE routes SET url = NULL WHERE id = ?').run(routeId);
		await page.reload();
		await expect(link).toHaveAttribute('href', `https://www.thecrag.com/en/route/${externalId}`);
		await expect(card).toContainText('with over 1,234 ascents!');
	} finally {
		db.prepare(
			"DELETE FROM first_ascents WHERE provider = 'thecrag' AND route_external_id = ?"
		).run(externalId);
		if (routeId != null) {
			db.prepare('DELETE FROM ascents WHERE route_id = ?').run(routeId);
			db.prepare('DELETE FROM routes WHERE id = ?').run(routeId);
		}
		db.close();
	}
});
