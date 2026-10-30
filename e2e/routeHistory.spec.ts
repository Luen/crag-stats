import { expect, test } from '@playwright/test';
import Database from 'better-sqlite3';
import AxeBuilder from '@axe-core/playwright';
import { PORTS, TEST_PASSWORD } from '../playwright.config';

// The open server doesn't set ROUTE_HISTORY_IMPORT, so the import must be off: an explanation,
// no button that would contact theCrag, and the action refuses.
test('route history import is off by default', async ({ page, request }) => {
	await page.goto('/settings');
	await expect(page.getByText('ROUTE_HISTORY_IMPORT=true')).toBeVisible();
	await expect(page.getByRole('button', { name: /Check next/ })).toHaveCount(0);

	const res = await request.post('/settings?/fetchRouteHistory', {
		headers: { origin: new URL(page.url()).origin, accept: 'application/json' },
		form: {}
	});
	expect(await res.text()).toContain('ROUTE_HISTORY_IMPORT=true');
});

for (const colorScheme of ['light', 'dark'] as const) {
	test.describe(`${colorScheme} route-history cooldown`, () => {
		test.use({ colorScheme });
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
			// No click or POST may ever reach theCrag during this test.
			try {
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
				const results = await new AxeBuilder({ page }).analyze();
				expect(
					results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
				).toEqual([]);
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
	});
}
