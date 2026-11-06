import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';
import { PORTS } from '../playwright.config';

test('owner project pills save directly, persist, dismiss and restore automatic detection', async ({
	page
}) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const external = 'selection-pill-fixture';
	const name = 'Selection pill fixture';
	const id = Number(
		db
			.prepare(
				"INSERT INTO routes (provider,external_id,name,gear_style,grade_raw,grade_score,grade_system,updated_at) VALUES ('thecrag',?,?,'Sport','22',22,'ewbank','2026-01-01')"
			)
			.run(external, name).lastInsertRowid
	);
	db.prepare(
		"INSERT INTO ascents (provider,external_id,route_id,ascent_date,tick_type,is_send,is_attempt,updated_at) VALUES ('thecrag',?,?,'2020-01-01','Attempt',0,1,'2026-01-01')"
	).run(external, id);
	try {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto(`/logbook?route=${id}`);
		const form = page.getByRole('form', { name: `Project selection for ${name}` });
		await expect(form.getByRole('combobox')).toHaveCount(0);
		await expectAxeClean(page, { include: [form] });
		await form.getByRole('button', { name: `Mark project: ${name}`, exact: true }).click();
		await expect(page).toHaveURL(new RegExp(`/logbook\\?route=${id}$`));
		await expect(form.getByText('Project', { exact: true })).toBeVisible();
		await page.reload();
		await expect(form.getByRole('button', { name: `Unmark project: ${name}` })).toBeVisible();
		await page.goto('/projects');
		const card = page
			.locator('article.card')
			.filter({ has: page.getByRole('link', { name, exact: false }) });
		await expect(card.getByText('Selected by you')).toBeVisible();
		await expectAxeClean(page, { include: [card] });
		await card.getByRole('link', { name, exact: false }).first().click();
		await page.getByRole('button', { name: `Unmark project: ${name}` }).click();
		await expect(page).toHaveURL(/\/projects$/);
		await expect(page.getByRole('link', { name, exact: false })).toHaveCount(0);
		await page.goto(`/logbook?route=${id}`);
		await expect(form.getByText('Not a project', { exact: true })).toBeVisible();
		await expectAxeClean(page, { include: [form] });
		await form.getByRole('button', { name: `Use automatic project detection for ${name}` }).click();
		await expect(form.locator('.dismissed')).toHaveCount(0);
		await expect(
			form.getByRole('button', { name: `Mark project: ${name}`, exact: true })
		).toBeVisible();
		await page.goto('/projects');
		await expect(page.getByRole('link', { name, exact: false })).toHaveCount(0);
	} finally {
		db.prepare('DELETE FROM project_overrides WHERE provider = ? AND route_external_id = ?').run(
			'thecrag',
			external
		);
		db.prepare('DELETE FROM projects WHERE route_id = ?').run(id);
		db.prepare('DELETE FROM ascents WHERE route_id = ?').run(id);
		db.prepare('DELETE FROM routes WHERE id = ?').run(id);
		db.close();
	}
});

test('project mutations require owner access and reject invalid/cross-site choices', async ({
	page,
	request
}) => {
	const protectedOrigin = `http://localhost:${PORTS.settings}`;
	await page.goto(`${protectedOrigin}/logbook`);
	await expect(page.getByRole('button', { name: 'Mark project' })).toHaveCount(0);
	const denied = await request.post(`${protectedOrigin}/projects?/selection`, {
		headers: { origin: protectedOrigin },
		form: { provider: 'thecrag', route: 'unknown', decision: 'include' }
	});
	expect(denied.status()).toBe(403);
	const openOrigin = `http://localhost:${PORTS.open}`;
	const invalid = await request.post(`${openOrigin}/projects?/selection`, {
		headers: { origin: openOrigin },
		form: { provider: 'thecrag', route: 'unknown', decision: 'invalid' }
	});
	expect(invalid.status()).toBe(400);
	const csrf = await request.post(`${openOrigin}/projects?/selection`, {
		headers: { origin: 'https://example.invalid' },
		form: { provider: 'thecrag', route: 'unknown', decision: 'include' }
	});
	expect(csrf.status()).toBe(403);
});
