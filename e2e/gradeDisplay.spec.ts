import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

const keys = ['grade_system', 'route_grade_system', 'boulder_grade_system'];

test('selected grade systems follow projects, project history, logbook, and offline rows', async ({
	page,
	request
}) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const saved = db
		.prepare(
			`SELECT key, value, updated_at FROM app_settings WHERE key IN (${keys.map(() => '?').join(',')})`
		)
		.all(...keys) as { key: string; value: string; updated_at: string }[];
	const ids: number[] = [];
	try {
		for (const [name, raw, score, system, style] of [
			['Display sport project', '20', 20, 'ewbank', 'Sport'],
			['Display boulder project', 'V3', 3, 'v_scale', 'Boulder'],
			['Display DWS project', 'V3', 3, 'v_scale', 'DWS']
		] as const) {
			const id = Number(
				db
					.prepare(
						`INSERT INTO routes (provider, external_id, name, grade_raw, grade_score, grade_system, gear_style, updated_at) VALUES ('thecrag', ?, ?, ?, ?, ?, ?, '2026-11-10')`
					)
					.run(name, name, raw, score, system, style).lastInsertRowid
			);
			ids.push(id);
			for (const day of ['2026-11-07', '2026-11-08'])
				db.prepare(
					`INSERT INTO ascents (provider, external_id, route_id, ascent_date, tick_type, is_send, is_attempt, updated_at) VALUES ('thecrag', ?, ?, ?, 'Attempt', 0, 1, '2026-11-10')`
				).run(`${name}-${day}`, id, day);
		}
		// Sync normally refreshes the project cache; this page derives it for our direct DB fixtures.
		await page.goto('/projects');
		await page.goto('/settings');
		const display = page
			.locator('article.panel')
			.filter({ has: page.getByRole('heading', { name: 'Display & visibility' }) });
		await display.getByRole('combobox', { name: 'Route grades' }).selectOption('french');
		await display.getByRole('combobox', { name: 'Boulder grades' }).selectOption('font');
		await display.getByRole('button', { name: 'Save preferences' }).click();
		await expect(page.getByText('Preferences saved.')).toBeVisible();
		await page.goto('/');
		const projects = page
			.locator('article.panel')
			.filter({ has: page.getByRole('heading', { name: 'Projects', exact: true }) });
		await expect(projects).toContainText('6b (20)');
		await expect(projects).toContainText('6A (V3)');
		await expectAxeClean(page, { include: [projects] });
		await projects.getByRole('link', { name: 'All projects' }).click();
		await expect(
			page.locator('article.card').filter({ hasText: 'Display sport project' })
		).toContainText('6b (20)');
		await expect(
			page.locator('article.card').filter({ hasText: 'Display DWS project' })
		).toContainText('6A (V3)');
		await page.getByRole('link', { name: /Display sport project/ }).click();
		await expect(page.getByRole('heading', { level: 1 })).toContainText('6b (20)');
		await expect(page.getByText('6b (20)', { exact: true })).toHaveCount(2);
		await expectAxeClean(page, { include: ['main'] });
		await page.goto(`/logbook?route=${ids[0]}`);
		await expect(page.locator('tbody tr')).toHaveCount(2);
		await expect(page.locator('tbody .grade-chip').first()).toHaveText('6b (20)');
		await page.getByRole('button', { name: 'Apply filters' }).click();
		await expect(page.locator('tbody .grade-chip').first()).toHaveText('6b (20)');
		await expectAxeClean(page, { include: ['table', '.filters'] });
		await page.goto(`/logbook?route=${ids[2]}`);
		await expect(page.locator('tbody .grade-chip').first()).toHaveText('6A (V3)');
		const snapshot = await (await request.get('/api/offline')).json();
		expect(
			snapshot.rows.find((r: { name: string }) => r.name === 'Display sport project').grade
		).toBe('6b (20)');
		expect(
			snapshot.rows.find((r: { name: string }) => r.name === 'Display DWS project').grade
		).toBe('6A (V3)');
		await page.goto('/settings');
		await display.getByRole('combobox', { name: 'Route grades' }).selectOption('ewbank');
		await display.getByRole('combobox', { name: 'Boulder grades' }).selectOption('v_scale');
		await display.getByRole('button', { name: 'Save preferences' }).click();
		await expect(page.getByText('Preferences saved.')).toBeVisible();
		await page.goto(`/logbook?route=${ids[0]}`);
		await expect(page.locator('tbody .grade-chip').first()).toHaveText('20');
		await page.goto(`/logbook?route=${ids[1]}`);
		await expect(page.locator('tbody .grade-chip').first()).toHaveText('V3');
	} finally {
		for (const id of ids) {
			db.prepare('DELETE FROM projects WHERE route_id=?').run(id);
			db.prepare('DELETE FROM ascents WHERE route_id=?').run(id);
			db.prepare('DELETE FROM routes WHERE id=?').run(id);
		}
		db.prepare(`DELETE FROM app_settings WHERE key IN (${keys.map(() => '?').join(',')})`).run(
			...keys
		);
		for (const row of saved)
			db.prepare('INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)').run(
				row.key,
				row.value,
				row.updated_at
			);
		db.close();
	}
});
