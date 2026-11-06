import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

// The sample CSV has one note ("Almost" on Sample Sport Route). Notes are off by default,
// so they must not reach the page or be findable through search.
test.describe('private ascent notes', () => {
	test('are hidden from the logbook and search by default', async ({ page }) => {
		await page.goto('/logbook');
		await expect(page.getByText('Sample Sport Route').first()).toBeVisible();
		expect(await page.content()).not.toContain('Almost');

		await page.goto('/logbook?q=Almost');
		await expect(page.getByText('Sample Sport Route')).toHaveCount(0);
	});

	test('have an unticked Settings toggle', async ({ page }) => {
		await page.goto('/settings');
		await expect(
			page.getByRole('checkbox', { name: /Show my private ascent notes/ })
		).not.toBeChecked();
	});
});

test('long notes replace their preview when expanded and collapse with the keyboard', async ({
	page
}) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const setting = db
		.prepare("SELECT value, updated_at FROM app_settings WHERE key = 'show_notes'")
		.get() as { value: string; updated_at: string } | undefined;
	const ascent = db.prepare('SELECT id, comment FROM ascents ORDER BY id LIMIT 1').get() as {
		id: number;
		comment: string | null;
	};
	const comment =
		'Synthetic note: the opening moves were steady and the middle section needed a careful rest before the final sequence. '
			.repeat(2)
			.trimEnd() + '\nA separate final line.';
	const preview = `${comment.slice(0, 120)}…`;
	try {
		db.prepare(
			"INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('show_notes', 'on', '2026-11-06')"
		).run();
		db.prepare('UPDATE ascents SET comment = ? WHERE id = ?').run(comment, ascent.id);
		await page.goto('/logbook');
		const note = page.locator('details.note').filter({ hasText: comment });
		const summary = note.locator('summary');
		await expect(summary).toBeVisible();
		expect(await summary.innerText()).toBe(preview);
		await expect(note.locator('.note-full')).toBeHidden();
		await expectAxeClean(page, { include: [note] });
		await summary.click();
		await expect(note).toHaveAttribute('open', '');
		expect(await summary.innerText()).toBe(comment);
		await expect(note.locator('.note-preview')).toBeHidden();
		await expectAxeClean(page, { include: [note] });
		await summary.focus();
		await page.keyboard.press('Enter');
		await expect(note).not.toHaveAttribute('open');
		expect(await summary.innerText()).toBe(preview);
		await page.keyboard.press('Space');
		await expect(note).toHaveAttribute('open', '');
		expect(await summary.innerText()).toBe(comment);
	} finally {
		db.prepare('UPDATE ascents SET comment = ? WHERE id = ?').run(ascent.comment, ascent.id);
		if (setting) {
			db.prepare("UPDATE app_settings SET value = ?, updated_at = ? WHERE key = 'show_notes'").run(
				setting.value,
				setting.updated_at
			);
		} else {
			db.prepare("DELETE FROM app_settings WHERE key = 'show_notes'").run();
		}
		db.close();
	}
});
