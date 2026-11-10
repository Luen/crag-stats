import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

const keys = ['grade_system', 'route_grade_system', 'boulder_grade_system'];

test('goals retain their scale across settings changes and legacy goals require an owner choice', async ({
	page,
	request
}) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const saved = db
		.prepare(
			`SELECT key,value,updated_at FROM app_settings WHERE key IN (${keys.map(() => '?').join(',')})`
		)
		.all(...keys) as { key: string; value: string; updated_at: string }[];
	const routeIds: number[] = [];
	const goalIds: number[] = [];
	try {
		for (const [style, score, system] of [
			['Sport', 22, 'ewbank'],
			['DWS', 5, 'v_scale']
		] as const) {
			const id = Number(
				db
					.prepare(
						`INSERT INTO routes(provider,external_id,name,grade_raw,grade_score,grade_system,gear_style,updated_at) VALUES('thecrag',?,?,?,?,?,?,'2026-11-10')`
					)
					.run(
						`goal-scale-${style}`,
						`Goal scale ${style}`,
						style === 'Sport' ? '22' : 'V5',
						score,
						system,
						style
					).lastInsertRowid
			);
			routeIds.push(id);
			db.prepare(
				`INSERT INTO ascents(provider,external_id,route_id,ascent_date,tick_type,is_send,effective_grade_score,updated_at) VALUES('thecrag',?,?,'2026-11-01','Red point',1,?,'2026-11-10')`
			).run(`goal-scale-${style}`, id, score);
		}
		for (const [key, value] of [
			['route_grade_system', 'yds'],
			['boulder_grade_system', 'v_scale']
		])
			db.prepare(
				`INSERT INTO app_settings(key,value,updated_at) VALUES(?,?,'2026-11-10') ON CONFLICT(key) DO UPDATE SET value=excluded.value`
			).run(key, value);
		await page.goto('/goals');
		for (let i = 0; i < 2; i++) {
			const suggestion = page.locator('.suggest').nth(i);
			await suggestion.getByRole('button', { name: 'Add goal', exact: true }).click();
			goalIds.push(
				...(db.prepare('SELECT id FROM goals').all() as { id: number }[]).map((g) => g.id)
			);
			await expect(suggestion.getByText('Already tracking')).toBeVisible();
		}
		const created = db
			.prepare('SELECT id,grade_scale,target_grade_score,title FROM goals')
			.all() as { id: number; grade_scale: string; target_grade_score: number; title: string }[];
		goalIds.push(...created.map((g) => g.id));
		expect(created.map((g) => g.grade_scale).sort()).toEqual(['boulder', 'route']);
		const route = created.find((g) => g.grade_scale === 'route')!;
		expect(route.title).toContain('5.');
		const boulder = created.find((g) => g.grade_scale === 'boulder')!;
		expect(db.prepare('SELECT completed FROM goals WHERE id=?').get(boulder.id)).toEqual({
			completed: 0
		});
		const legacyId = Number(
			db
				.prepare(
					`INSERT INTO goals(kind,title,target_grade_score,year,venue_scope,completed,created_at,updated_at) VALUES('grade','Keep my custom 5.11c title',5,2026,'outdoor',1,'2026-11-10','2026-11-10')`
				)
				.run().lastInsertRowid
		);
		goalIds.push(legacyId);
		await page.reload();
		const legacy = page
			.locator('article.goal')
			.filter({ has: page.getByText('Keep my custom 5.11c title', { exact: true }) });
		await expect(legacy).toContainText('Grade scale needed');
		await legacy.getByText('Choose grade scale', { exact: true }).click();
		await legacy.getByRole('combobox', { name: 'Grade scale' }).selectOption('boulder');
		await legacy.getByRole('button', { name: 'Save grade preferences' }).click();
		await expect(legacy).toContainText('Send ≥ V5');
		await expect(legacy).toContainText('100%');
		await page.goto('/settings');
		const display = page
			.locator('article.panel')
			.filter({ has: page.getByRole('heading', { name: 'Display & visibility' }) });
		await display.getByRole('combobox', { name: 'Route grades' }).selectOption('ewbank');
		await display.getByRole('combobox', { name: 'Boulder grades' }).selectOption('font');
		await display.getByRole('button', { name: 'Save preferences' }).click();
		await expect(page.getByText('Preferences saved.')).toBeVisible();
		await page.goto('/goals');
		await expect(
			page
				.locator('article.goal')
				.filter({ hasText: `Send outdoor ${route.target_grade_score} in 2026` })
		).toContainText(`Send ≥ ${route.target_grade_score}`);
		await expect(legacy).toContainText('Keep my custom 5.11c title');
		await expect(legacy).toContainText('Send ≥ 6C');
		await expectAxeClean(page, { include: ['main'] });
		// Visitors may not resolve or change a goal's scale.
		const denied = await request.post('http://localhost:4302/goals?/scale', {
			headers: { origin: 'http://localhost:4302' },
			multipart: { id: String(legacyId), gradeScale: 'route' }
		});
		expect(denied.status()).toBe(403);
	} finally {
		for (const id of goalIds) db.prepare('DELETE FROM goals WHERE id=?').run(id);
		for (const id of routeIds) {
			db.prepare('DELETE FROM ascents WHERE route_id=?').run(id);
			db.prepare('DELETE FROM routes WHERE id=?').run(id);
		}
		db.prepare(`DELETE FROM app_settings WHERE key IN (${keys.map(() => '?').join(',')})`).run(
			...keys
		);
		for (const row of saved)
			db.prepare('INSERT INTO app_settings(key,value,updated_at) VALUES(?,?,?)').run(
				row.key,
				row.value,
				row.updated_at
			);
		db.close();
	}
});
