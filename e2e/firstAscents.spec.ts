import Database from 'better-sqlite3';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Open server (no APP_PASSWORD), so the visitor is the owner and can mark FAs.
test('mark a first ascent from the logbook and see it on the dashboard', async ({ page }) => {
	await page.goto('/logbook?q=Hard%20Project');
	const row = page.getByRole('row').filter({ hasText: 'Hard Project' }).first();
	await row.hover();
	await row.getByRole('button', { name: /first ascent$/ }).click();
	await expect(row.locator('.chip.fa')).toHaveText('FA');

	await page.goto('/');
	const card = page.locator('article.panel').filter({
		has: page.getByRole('heading', { name: 'First ascents', exact: true })
	});
	await expect(card).toContainText('1');
	await expect(card).toContainText('Hard Project');

	// Leave shared e2e state as it was.
	await page.goto('/logbook?q=Hard%20Project');
	await row.hover();
	await row.getByRole('button', { name: 'Unmark FA' }).click();
	await expect(row.locator('.chip.fa')).toHaveCount(0);
});

test('setter-only First ascents card omits empty style chart (#150)', async ({ page }) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const savedFas = db
		.prepare('SELECT provider, route_external_id, kind, created_at FROM first_ascents')
		.all() as {
		provider: string;
		route_external_id: string;
		kind: string;
		created_at: string;
	}[];
	const prevProfile = db
		.prepare('SELECT login, name, updated_at FROM profiles WHERE provider = ?')
		.get('thecrag') as
		{ login: string | null; name: string | null; updated_at: string } | undefined;
	try {
		db.prepare('DELETE FROM first_ascents').run();
		if (prevProfile) {
			db.prepare(
				"UPDATE profiles SET login = 'setter-only', name = 'Setter' WHERE provider = 'thecrag'"
			).run();
		} else {
			db.prepare(
				`INSERT INTO profiles (provider, login, name, updated_at)
				 VALUES ('thecrag', 'setter-only', 'Setter', '2026-10-27')`
			).run();
		}
		db.prepare(
			`INSERT INTO routes (provider, external_id, name, gear_style, updated_at)
			 VALUES ('thecrag', 'setter-only-route', 'Bolted by me', 'Sport', '2026-10-27')`
		).run();
		db.prepare(
			`INSERT INTO route_history
			 (provider, route_external_id, history_external_id, type, climbers, history_date, updated_at)
			 VALUES ('thecrag', 'setter-only-route', 'setter-h1', 'Route Setter', '@setter-only', '2020-01-01', '2026-10-27')`
		).run();

		await page.goto('/');
		const card = page.locator('article.panel').filter({
			has: page.getByRole('heading', { name: 'First ascents', exact: true })
		});
		await expect(card).toContainText('route set');
		await expect(card.locator('[role="img"]')).toHaveCount(0);
		await expect(card.getByRole('heading', { name: 'Latest' })).toHaveCount(0);
		for (const colorScheme of ['light', 'dark'] as const) {
			await page.emulateMedia({ colorScheme });
			// Reload so axe never samples the nav's 0.15s colour transition mid-fade (#167).
			await page.reload();
			const results = await new AxeBuilder({ page }).analyze();
			expect(
				results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
			).toEqual([]);
		}
	} finally {
		db.prepare(
			"DELETE FROM route_history WHERE provider = 'thecrag' AND route_external_id = 'setter-only-route'"
		).run();
		db.prepare(
			"DELETE FROM routes WHERE provider = 'thecrag' AND external_id = 'setter-only-route'"
		).run();
		db.prepare('DELETE FROM first_ascents').run();
		const restore = db.prepare(
			`INSERT INTO first_ascents (provider, route_external_id, kind, created_at) VALUES (?, ?, ?, ?)`
		);
		for (const row of savedFas) {
			restore.run(row.provider, row.route_external_id, row.kind, row.created_at);
		}
		if (prevProfile) {
			db.prepare(
				`UPDATE profiles SET login = ?, name = ?, updated_at = ? WHERE provider = 'thecrag'`
			).run(prevProfile.login, prevProfile.name, prevProfile.updated_at);
		} else {
			db.prepare("DELETE FROM profiles WHERE provider = 'thecrag'").run();
		}
		db.close();
	}
});
