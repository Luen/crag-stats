import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';
import { convertFromVScale } from '../src/lib/grades/conversions';

const KEYS = ['grade_system', 'route_grade_system', 'boulder_grade_system'];

// #447: route and boulder display systems are chosen independently.
test('Settings picks route and boulder grade systems independently', async ({ page }) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const saved = db
		.prepare(
			`SELECT key, value, updated_at FROM app_settings WHERE key IN (${KEYS.map(() => '?').join(',')})`
		)
		.all(...KEYS) as { key: string; value: string; updated_at: string }[];
	try {
		await page.goto('/settings');
		const card = page.locator('article.panel').filter({
			has: page.getByRole('heading', { name: 'Display & visibility' })
		});
		const route = card.getByRole('combobox', { name: 'Route grades' });
		const boulder = card.getByRole('combobox', { name: 'Boulder grades' });
		await expect(route).toHaveValue('ewbank');
		await expect(boulder).toHaveValue('v_scale');
		await expectAxeClean(page, { include: [card] });

		await route.selectOption('french');
		await boulder.selectOption('font');
		await card.getByRole('button', { name: 'Save preferences' }).click();
		await expect(page.getByText('Preferences saved.')).toBeVisible();
		await expect(route).toHaveValue('french');
		await expect(boulder).toHaveValue('font');

		// Sample CSV: a V3 flash on "Boulder Problem" lands in the Boulder pyramid.
		await page.goto('/');
		await expect(page.getByText('French routes, Fontainebleau (Font) boulders')).toBeVisible();
		const boulderPyramid = page
			.locator('article.panel')
			.filter({ has: page.getByRole('heading', { name: 'Boulder', exact: true, level: 3 }) })
			.filter({ has: page.locator('.pyramid') });
		await expect(boulderPyramid).toContainText(convertFromVScale(3, 'font'));
	} finally {
		db.prepare(`DELETE FROM app_settings WHERE key IN (${KEYS.map(() => '?').join(',')})`).run(
			...KEYS
		);
		const restore = db.prepare(
			'INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)'
		);
		for (const row of saved) restore.run(row.key, row.value, row.updated_at);
		db.close();
	}
});
