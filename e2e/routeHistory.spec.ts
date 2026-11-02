import { expect, test } from '@playwright/test';
import Database from 'better-sqlite3';
import { expectAxeClean } from './axe';
import { PORTS, TEST_PASSWORD } from '../playwright.config';
import areaFixture from '../src/lib/server/providers/thecrag/fixtures/area-ancestors.synthetic.json' with { type: 'json' };

// The open server doesn't set ROUTE_DATA_IMPORT, so the import must be off: an explanation,
// no button that would contact theCrag, and the action refuses.
test('route history import is off by default', async ({ page, request }) => {
	await page.goto('/settings');
	await expect(page.getByRole('heading', { name: 'Import route data' })).toBeVisible();
	await expect(page.getByText('ROUTE_DATA_IMPORT=true')).toBeVisible();
	await expect(page.getByRole('button', { name: /Check next/ })).toHaveCount(0);

	const res = await request.post('/settings?/fetchRouteHistory', {
		headers: { origin: new URL(page.url()).origin, accept: 'application/json' },
		form: {}
	});
	expect(await res.text()).toContain('ROUTE_DATA_IMPORT=true');
});

test('completed CSV route history still offers pending weather area checks', async ({ page }) => {
	const db = new Database('e2e/.tmp/settings.sqlite');
	const origin = `http://localhost:${PORTS.settings}`;
	const externalId = 'area-weather-regression';
	try {
		const id = db
			.prepare(
				`INSERT INTO routes (provider,external_id,name,gear_style,route_api_json,updated_at) VALUES ('thecrag',?,'Synthetic weather area route','Sport',?,'now')`
			)
			.run(externalId, JSON.stringify(areaFixture)).lastInsertRowid;
		db.prepare(
			`INSERT INTO ascents (provider,external_id,route_id,ascent_date,is_send,updated_at) VALUES ('thecrag',?,?,'2025-01-01',1,'now')`
		).run(externalId, id);
		db.prepare(
			`INSERT INTO route_history_fetches (provider,route_external_id,status,fetched_at) VALUES ('thecrag',?,'ok','2026-01-01')`
		).run(externalId);
		await page.goto(`${origin}/login`);
		await page.getByLabel('Password').fill(TEST_PASSWORD);
		await page.getByRole('button', { name: 'Unlock' }).click();
		await page.goto(`${origin}/settings`);
		await expect(page.getByText('2 weather areas pending')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Check weather locations now' })).toBeEnabled();
		await expect(page.getByText('1 outdoor routes without locations')).toBeVisible();
		await expect(page.getByRole('button', { name: 'No eligible days pending' })).toBeDisabled();
		// Do not click: live provider requests are never part of browser regressions.
		await expectAxeClean(page, { include: ['main'] });
	} finally {
		db.prepare('DELETE FROM ascents WHERE external_id = ?').run(externalId);
		db.prepare('DELETE FROM route_history_fetches WHERE route_external_id = ?').run(externalId);
		db.prepare('DELETE FROM routes WHERE external_id = ?').run(externalId);
		db.close();
	}
});

test('counts down, survives reload, respects back-off and enables without a refresh', async ({
	page
}) => {
	const db = new Database('e2e/.tmp/settings.sqlite');
	const origin = `http://localhost:${PORTS.settings}`;
	const now = Date.now();
	const writeState = (nextAllowedAt: string | null) => {
		db.prepare(
			`INSERT OR REPLACE INTO route_history_import_state
			(provider, status, last_run_at, next_allowed_at, updated_at)
			VALUES ('thecrag', 'idle', ?, ?, ?)`
		).run(new Date(now - 30_000).toISOString(), nextAllowedAt, new Date(now).toISOString());
	};
	// Enforce no upstream: abort theCrag hosts and keep login mismatched for CSV mode.
	try {
		await page.route(/thecrag\.com/i, (route) => route.abort());
		const profileLogin = db
			.prepare("SELECT login FROM profiles WHERE provider = 'thecrag'")
			.get() as { login: string | null } | undefined;
		expect(profileLogin?.login?.toLowerCase() ?? '').not.toBe('synthetic-account');
		db.prepare(
			`INSERT INTO routes (provider, external_id, name, updated_at)
			VALUES ('thecrag', 'cooldown-test-route', 'Cooldown test route', ?)`
		).run(new Date(now).toISOString());
		writeState(null);
		await page.goto(`${origin}/login`);
		await page.getByLabel('Password').fill(TEST_PASSWORD);
		await page.getByRole('button', { name: 'Unlock' }).click();
		// A device clock far ahead must not bypass the server's cooldown.
		await page.clock.install({ time: new Date('2040-01-01T00:00:00Z') });
		await page.goto(`${origin}/settings`);
		const button = page.locator('form[action="?/fetchRouteHistory"] button');
		await expect(button).toBeDisabled();
		await expect(button).toHaveText(/Check again in \d+s/);
		await page.reload();
		await expect(button).toBeDisabled();
		// A direct POST still hits the server guard, and its response shows a live countdown.
		await page
			.locator('form[action="?/fetchRouteHistory"]')
			.evaluate((form) => (form as HTMLFormElement).submit());
		await expect(page.getByText(/Route history can be checked again in/)).toBeVisible();
		await expect(button).toBeDisabled();
		const label = await button.textContent();
		await page.clock.fastForward(2000);
		await expect(button).not.toHaveText(label!);
		await expectAxeClean(page, { include: ['main'] });
		await page.clock.fastForward(60_000);
		await expect(button).toBeEnabled();
		await expect(button).toHaveText('Check next 100 routes now');
		await expect(page.getByText('Route history is ready to check again.')).toBeVisible();
		writeState(new Date(Date.now() + 120_000).toISOString());
		await page.reload();
		await expect(button).toBeDisabled();
		await page.clock.fastForward(60_000);
		await expect(button).toBeDisabled();
		await page.clock.fastForward(61_000);
		await expect(button).toBeEnabled();
	} finally {
		db.prepare("DELETE FROM route_history_import_state WHERE provider = 'thecrag'").run();
		db.prepare("DELETE FROM routes WHERE external_id = 'cooldown-test-route'").run();
		db.close();
	}
});
