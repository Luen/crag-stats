import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';
import { PORTS, TEST_PASSWORD } from '../playwright.config';

test('downloaded public snapshot reopens offline, searches, reconnects and clears', async ({
	page,
	context
}) => {
	test.setTimeout(90000);
	await page.goto('/offline');
	const download = page.getByRole('button', { name: 'Download or refresh copy' });
	await expect(download).toBeEnabled({ timeout: 30000 });
	await download.click();
	await expect(page.getByRole('heading', { name: 'Dashboard summary' })).toBeVisible();
	await expectAxeClean(page, { include: ['main'] });
	// No SSR pages, Settings responses, notes or raw JSON may enter the worker caches.
	const cacheInfo = await page.evaluate(async () => {
		const entries = [];
		for (const key of await caches.keys()) {
			if (!key.startsWith('crag-offline-')) continue;
			for (const req of await (await caches.open(key)).keys())
				entries.push(new URL(req.url).pathname);
		}
		return entries;
	});
	expect(cacheInfo).not.toContain('/settings');
	expect(cacheInfo).not.toContain('/');
	expect(cacheInfo).toContain('/offline');
	await context.setOffline(true);
	await page.goto('/logbook?not-downloaded=1');
	await expect(page).toHaveURL(/\/offline$/);
	await expect(page.getByRole('heading', { name: 'Dashboard summary' })).toBeVisible();
	await expect(page.getByRole('status')).toContainText('Offline');
	await page.getByRole('searchbox').fill('no such synthetic climb xyz');
	await expect(page.getByText('0 matching ascents', { exact: true })).toBeVisible();
	await page.getByRole('searchbox').clear();
	await page.setViewportSize({ width: 390, height: 844 });
	await expectAxeClean(page, { include: ['main'] });
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Dashboard summary' })).toBeVisible();
	await context.setOffline(false);
	await expect(page.getByRole('status')).toContainText('Saved copy ready', { timeout: 30000 });
	await page.getByRole('button', { name: 'Clear offline copy' }).click();
	await expect(page.getByRole('heading', { name: 'Dashboard summary' })).toHaveCount(0);
	await context.setOffline(true);
	await page.reload();
	await expect(page.getByRole('status')).toContainText(/No offline copy|Offline copy cleared/);
});

test('protected sites expose only the empty shell and never download authenticated data', async ({
	page
}) => {
	await page.goto(`http://localhost:${PORTS.all}/offline`);
	await expect(page.getByRole('button', { name: 'Download or refresh copy' })).toBeEnabled({
		timeout: 30000
	});
	await page.getByRole('button', { name: 'Download or refresh copy' }).click();
	await expect(page.getByRole('status')).toContainText('Protected sites require a connection');
	await expect(page.getByRole('heading', { name: 'Dashboard summary' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Log out' })).toHaveCount(0);
	await page.goto(`http://localhost:${PORTS.all}/login?next=/offline`);
	await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
	await page.getByRole('button', { name: 'Unlock' }).click();
	await expect(page).toHaveURL(/\/offline$/);
	await expect(page.getByRole('button', { name: 'Download or refresh copy' })).toBeEnabled();
	await page.getByRole('button', { name: 'Download or refresh copy' }).click();
	await expect(page.getByRole('status')).toContainText('Protected sites require a connection');
	expect((await page.request.get(`http://localhost:${PORTS.all}/api/offline`)).status()).toBe(403);
});

test('expired downloads, logout and denied refreshes clear the viewer', async ({
	page,
	context
}) => {
	await page.goto('/offline');
	const download = page.getByRole('button', { name: 'Download or refresh copy' });
	await expect(download).toBeEnabled({ timeout: 30000 });
	await download.click();
	await expect(page.getByRole('heading', { name: 'Dashboard summary' })).toBeVisible();
	await page.evaluate(async () => {
		const name = (await caches.keys()).find((key) => key.startsWith('crag-offline-data-'))!;
		const cache = await caches.open(name);
		const key = (await cache.keys())[0];
		const snapshot = await (await cache.match(key))!.json();
		snapshot.savedAt = '2000-01-01T00:00:00Z';
		await cache.put(key, new Response(JSON.stringify(snapshot)));
	});
	await page.reload();
	await expect(page.getByRole('status')).toContainText(/No offline copy|Offline copy cleared/);
	await download.click();
	await expect(page.getByRole('heading', { name: 'Dashboard summary' })).toBeVisible();
	await page.evaluate(() => fetch('/logout'));
	await expect(page.getByRole('heading', { name: 'Dashboard summary' })).toHaveCount(0);
	await download.click();
	await expect(page.getByRole('heading', { name: 'Dashboard summary' })).toBeVisible();
	await context.route('**/api/offline', (route) =>
		route.fulfill({
			status: 403,
			contentType: 'application/json',
			headers: { 'x-crag-offline': 'disabled' },
			body: '{}'
		})
	);
	await download.click();
	await expect(page.getByRole('heading', { name: 'Dashboard summary' })).toHaveCount(0);
	await expect(page.getByRole('status')).toContainText('Protected sites require a connection');
});
