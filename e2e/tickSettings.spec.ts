import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

// #470: counted tick types keep projecting burns out of dashboard totals while the
// logbook still lists every logged ascent.
test('Settings presets decide which tick types count in dashboard totals', async ({ page }) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const KEY = 'counted_tick_types';
	const saved = db
		.prepare(`SELECT key, value, updated_at FROM app_settings WHERE key = ?`)
		.all(KEY) as { key: string; value: string; updated_at: string }[];
	try {
		await page.goto('/settings');
		const card = page.locator('article.panel').filter({
			has: page.getByRole('heading', { name: 'Display & visibility' })
		});
		const matrix = card.getByRole('table');
		await expect(matrix.getByRole('rowheader', { name: /^Attempt/ })).toBeVisible();
		await expect(matrix.getByText('(1)').first()).toBeVisible();
		await expectAxeClean(page, { include: [card] });

		// Sample CSV: Red point, Onsight and Flash are sends; Attempt and Hang dog are not.
		const sendsOnly = card.getByRole('button', { name: 'Sends only' });
		await sendsOnly.click();
		await expect(sendsOnly).toHaveAttribute('aria-pressed', 'true');
		await expect(
			card.getByRole('radio', { name: 'Attempt: Projects and goals only (out of totals)' })
		).toBeChecked();
		await card.getByRole('button', { name: 'Save preferences' }).click();
		await expect(page.getByText('Preferences saved.')).toBeVisible();
		await expect(
			card.getByRole('radio', { name: 'Attempt: Projects and goals only (out of totals)' })
		).toBeChecked();

		await page.goto('/');
		const counted = page.locator('.metric.panel').filter({ hasText: 'counted ascents' });
		await expect(counted.locator('strong')).toHaveText('3');
		await expect(counted).toContainText('5 total logged');

		// The logbook keeps every logged ascent, so project burns are still reviewable.
		await page.goto('/logbook');
		await expect(page.locator('.head p')).toContainText('5 ascents');

		// "All logged ticks" has to clear the stored presets, not merge under them.
		await page.goto('/settings');
		const allTicks = card.getByRole('button', { name: 'All logged ticks' });
		await allTicks.click();
		await expect(allTicks).toHaveAttribute('aria-pressed', 'true');
		await expect(
			card.getByRole('radio', { name: 'Attempt: Enable (count everywhere)' })
		).toBeChecked();
		await card.getByRole('button', { name: 'Save preferences' }).click();
		await expect(page.getByText('Preferences saved.')).toBeVisible();

		await page.goto('/');
		await expect(
			page.locator('.metric.panel').filter({ hasText: 'total logged' }).locator('strong')
		).toHaveText('5');
	} finally {
		db.prepare(`DELETE FROM app_settings WHERE key = ?`).run(KEY);
		const restore = db.prepare(
			'INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)'
		);
		for (const row of saved) restore.run(row.key, row.value, row.updated_at);
		db.close();
	}
});
