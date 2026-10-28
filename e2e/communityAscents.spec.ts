import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';

test('community snapshots distinguish missing, partial, zero and positive counts (#140, #141, #144)', async ({
	page
}) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const ids: number[] = [];
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});
	try {
		for (const externalId of ['review-community-1', 'review-community-2']) {
			const id = Number(
				db
					.prepare(
						`INSERT INTO routes
				(provider, external_id, name, gear_style, grade_raw, grade_score, grade_system, ascent_count, updated_at)
				VALUES ('thecrag', ?, 'Review shared route', 'Sport', '20', 20, 'ewbank', 10, '2026-10-27')`
					)
					.run(externalId).lastInsertRowid
			);
			ids.push(id);
			db.prepare(
				`INSERT INTO ascents (provider, external_id, route_id, ascent_date, is_send, tick_type, updated_at)
				VALUES ('thecrag', ?, ?, '2026-10-27', 1, 'Red point', '2026-10-27')`
			).run(externalId, id);
			db.prepare(
				`INSERT INTO first_ascents (provider, route_external_id, kind, created_at)
				VALUES ('thecrag', ?, 'FA', '2026-10-27')`
			).run(externalId);
		}
		db.prepare(
			"UPDATE first_ascents SET kind = 'FFA' WHERE route_external_id = 'review-community-2'"
		).run();
		await page.goto('/');
		// Same name + same day must not collide on FA list (#144) or hardest sends (#148).
		await expect(page.getByRole('heading', { name: 'Hardest sends' })).toBeVisible();
		await expect(page.locator('body')).not.toContainText('Internal Error');
		// Keep the locator stable while snapshot coverage changes after reloads.
		const card = page
			.locator('article')
			.filter({ has: page.getByRole('heading', { name: 'First ascents', exact: true }) });
		await expect(card).toContainText('Community ascents unavailable: 0 of 2');
		await expect(card.locator('.list:not(.community) li')).toHaveCount(2);
		const communityRows = card.locator('.community li');
		await expect(communityRows).toHaveCount(2);
		await expect(communityRows.locator('.kind')).toHaveText(['FA', 'FFA']);
		await expect(communityRows.locator('.missing')).toHaveText(['Unavailable', 'Unavailable']);
		expect(errors).toEqual([]);

		db.prepare('UPDATE routes SET ascent_count = 1, ascent_count_own = 1 WHERE id = ?').run(ids[0]);
		await page.reload();
		const communityTile = card.locator('.tile').filter({ hasText: 'community ascents (estimate)' });
		await expect(communityTile.locator('strong')).toHaveText('0');
		await expect(card).toContainText('covers 1 of 2');
		await expect(card).toContainText('Some route counts are unavailable');
		await expect(communityRows.first().locator('.est')).toHaveText('0');
		await expect(communityRows.first()).toContainText('Fetch time unknown');
		await expect(communityRows.last()).toContainText('No paired count yet');

		db.prepare('UPDATE routes SET ascent_count = 1, ascent_count_own = 1 WHERE id = ?').run(ids[1]);
		await page.reload();
		await expect(card).toContainText('covers 2 of 2');
		await expect(communityTile.locator('strong')).toHaveText('0');
		await expect(card).not.toContainText('warming up');
		await expect(card).not.toContainText('Some route counts are unavailable');

		db.prepare('UPDATE routes SET ascent_count = 5, ascent_count_fetched_at = ? WHERE id = ?').run(
			'2026-01-02T12:00:00.000Z',
			ids[0]
		);
		await page.reload();
		await expect(communityTile.locator('strong')).toHaveText('4');
		await expect(communityRows.first().locator('.est')).toHaveText('4');
		await expect(communityRows.first()).toContainText('Count fetched');
		await expect(communityRows.first()).toContainText('2026');
		db.prepare(
			`INSERT INTO ascents (provider, external_id, route_id, ascent_date, is_send, updated_at)
				VALUES ('thecrag', 'review-community-repeat', ?, '2026-10-27', 1, '2026-10-28')`
		).run(ids[0]);
		await page.reload();
		// Owner snapshot stays paired with the fetch — live repeats must not shrink the estimate (#140).
		await expect(communityTile.locator('strong')).toHaveText('4');
		expect(errors).toEqual([]);
	} finally {
		for (const id of ids) {
			db.prepare(
				"DELETE FROM first_ascents WHERE provider = 'thecrag' AND route_external_id = (SELECT external_id FROM routes WHERE id = ?)"
			).run(id);
			db.prepare('DELETE FROM ascents WHERE route_id = ?').run(id);
			db.prepare('DELETE FROM routes WHERE id = ?').run(id);
		}
		db.close();
	}
});
