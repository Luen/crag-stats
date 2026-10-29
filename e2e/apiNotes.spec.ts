import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { PORTS, TEST_PASSWORD } from '../playwright.config';

test('API-style combined notes stay private even when display is enabled', async ({ page }) => {
	const db = new Database('e2e/.tmp/settings.sqlite');
	const saved = db
		.prepare("SELECT value, updated_at FROM app_settings WHERE key = 'show_notes'")
		.get() as { value: string; updated_at: string } | undefined;
	const origin = `http://localhost:${PORTS.settings}`;
	const publicText = 'synthetic-public-note-168';
	const privateText = 'synthetic-private-note-168';
	let routeId: number | undefined;
	try {
		db.prepare(
			"INSERT INTO app_settings (key, value, updated_at) VALUES ('show_notes', 'on', '2026-01-01') ON CONFLICT(key) DO UPDATE SET value = excluded.value"
		).run();
		routeId = Number(
			db
				.prepare(
					`INSERT INTO routes (provider, external_id, name, grade_raw, grade_score, grade_system, gear_style, updated_at)
			VALUES ('thecrag', 'review-api-notes', 'API note route', '18', 18, 'ewbank', 'Sport', '2026-01-01')`
				)
				.run().lastInsertRowid
		);
		db.prepare(
			`INSERT INTO ascents (provider, external_id, route_id, ascent_date, tick_type, is_send, comment, raw_json, updated_at)
			VALUES ('thecrag', 'review-api-notes', ?, '2026-01-01', 'Tick', 1, ?, ?, '2026-01-01')`
		).run(
			routeId,
			`${publicText}\n\n${privateText}`,
			JSON.stringify({ markdown: publicText, privateMarkdown: privateText })
		);

		await page.goto(`${origin}/logbook`);
		await expect(page.getByText('API note route', { exact: true })).toBeVisible();
		for (const note of [publicText, privateText]) {
			expect(await page.content()).not.toContain(note);
			await page.goto(`${origin}/logbook?q=${note}`);
			await expect(page.locator('tbody tr')).toHaveCount(0);
		}
		await page.goto(`${origin}/login?next=/logbook`);
		await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
		await page.getByRole('button', { name: 'Unlock' }).click();
		await expect(page).toHaveURL(`${origin}/logbook`);
		await expect(page.locator('.note')).toContainText(publicText);
		await expect(page.locator('.note')).toContainText(privateText);
		await page.goto(`${origin}/logbook?q=${privateText}`);
		await expect(page.locator('tbody tr')).toHaveCount(1);
		await expect(page.locator('tbody')).toContainText('API note route');
		await page.goto(`${origin}/`);
		for (const note of [publicText, privateText]) expect(await page.content()).not.toContain(note);

		// CSV mode must still let an owner revoke a previous API-mode opt-in.
		await page.goto(`${origin}/settings`);
		const toggle = page.getByRole('checkbox', { name: /Show my private ascent notes/ });
		await expect(toggle).toBeChecked();
		await expect(toggle).toBeEnabled();
		await toggle.uncheck();
		await page.getByRole('button', { name: 'Save preferences', exact: true }).click();
		await expect(toggle).not.toBeChecked();
		await expect(toggle).toBeDisabled();
		await page.goto(`${origin}/logbook?q=${privateText}`);
		await expect(page.locator('tbody tr')).toHaveCount(0);
		// A crafted form POST cannot enable notes while CSV is configured.
		const response = await page.request.post(`${origin}/settings?/savePreferences`, {
			headers: { origin, accept: 'application/json' },
			form: { notes: 'on', system: 'ewbank' }
		});
		expect(response.ok()).toBe(true);
		await page.goto(`${origin}/settings`);
		await expect(toggle).not.toBeChecked();
		await expect(toggle).toBeDisabled();
		await page.locator('header').getByRole('button', { name: 'Log out' }).click();
		await page.goto(`${origin}/logbook?q=${privateText}`);
		await expect(page.locator('tbody tr')).toHaveCount(0);
	} finally {
		if (routeId != null) {
			db.prepare('DELETE FROM ascents WHERE route_id = ?').run(routeId);
			db.prepare('DELETE FROM routes WHERE id = ?').run(routeId);
		}
		if (saved) {
			db.prepare("UPDATE app_settings SET value = ?, updated_at = ? WHERE key = 'show_notes'").run(
				saved.value,
				saved.updated_at
			);
		} else {
			db.prepare("DELETE FROM app_settings WHERE key = 'show_notes'").run();
		}
		db.close();
	}
});
