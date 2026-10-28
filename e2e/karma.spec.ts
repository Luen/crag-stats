import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';

test('Karma keeps account estimates separate from locally logged routes (#142)', async ({
	page
}) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const local = (
		db
			.prepare(
				`SELECT count(DISTINCT r.id) AS n FROM routes r
		JOIN ascents a ON a.route_id = r.id
		WHERE r.provider = 'thecrag' AND a.provider = 'thecrag'`
			)
			.get() as { n: number }
	).n;
	const existing = db
		.prepare("SELECT id, routes_ticked FROM profiles WHERE provider = 'thecrag'")
		.get() as { id: number; routes_ticked: number | null } | undefined;
	let id = existing?.id;
	try {
		if (id == null) {
			id = Number(
				db
					.prepare(
						"INSERT INTO profiles (provider, routes_ticked, updated_at) VALUES ('thecrag', ?, ?)"
					)
					.run(local + 40, new Date().toISOString()).lastInsertRowid
			);
		} else {
			db.prepare('UPDATE profiles SET routes_ticked = ? WHERE id = ?').run(local + 40, id);
		}
		await page.goto('/');
		const card = page
			.locator('article')
			.filter({ has: page.getByRole('heading', { name: 'Karma', exact: true }) });
		await expect(card.locator('.tile').nth(0).locator('strong')).toHaveText(String(local + 40));
		await expect(card.locator('.tile').nth(1).locator('strong')).toHaveText(String(local));
		await expect(card.locator('.tile').nth(1)).toContainText('local route');
		await expect(card).toContainText('routesTicked');
	} finally {
		if (existing)
			db.prepare('UPDATE profiles SET routes_ticked = ? WHERE id = ?').run(
				existing.routes_ticked,
				id
			);
		else if (id != null) db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
		db.close();
	}
});
