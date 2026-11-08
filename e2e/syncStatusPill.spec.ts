import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

type SyncRow = {
	provider: string;
	cursor: string | null;
	last_sync_at: string | null;
	last_success_at: string | null;
	last_error: string | null;
	status: string;
};

// #429: the error status pill must keep ink text on its tint, not the generic .err red.
test('sync error status pill passes contrast in both themes', async ({ page }) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const saved = db.prepare("SELECT * FROM sync_state WHERE provider = 'thecrag'").get() as
		SyncRow | undefined;
	try {
		db.prepare(
			`INSERT INTO sync_state (provider, status, last_error, last_sync_at)
			VALUES ('thecrag', 'error', 'Synthetic sync failure', '2026-01-01T00:00:00.000Z')
			ON CONFLICT(provider) DO UPDATE SET status = excluded.status, last_error = excluded.last_error`
		).run();
		await page.goto('/settings');
		const panel = page.locator('article', {
			has: page.getByRole('heading', { name: 'theCrag logbook sync' })
		});
		await expect(panel.locator('.pill')).toHaveText('error');
		await expect(panel.getByText('Synthetic sync failure')).toBeVisible();
		await expectAxeClean(page, { include: [panel] });
	} finally {
		if (saved) {
			db.prepare(
				`UPDATE sync_state SET cursor = ?, last_sync_at = ?, last_success_at = ?, last_error = ?, status = ?
				WHERE provider = 'thecrag'`
			).run(
				saved.cursor,
				saved.last_sync_at,
				saved.last_success_at,
				saved.last_error,
				saved.status
			);
		} else {
			db.prepare("DELETE FROM sync_state WHERE provider = 'thecrag'").run();
		}
		db.close();
	}
});
