import { expect, test, type Page } from '@playwright/test';
import type { OfflineSnapshot } from '../src/lib/offline';
import { expectAxeClean } from './axe';
import { PORTS, TEST_PASSWORD } from '../playwright.config';

async function savedCopy(page: Page): Promise<OfflineSnapshot | null> {
	return page.evaluate(async () => {
		const name = (await caches.keys()).find((key) => key.startsWith('crag-offline-data-'));
		if (!name) return null;
		const response = await (await caches.open(name)).match('/__offline_snapshot');
		return response ? response.json() : null;
	});
}

async function ageCopy(page: Page) {
	await page.evaluate(async () => {
		const name = (await caches.keys()).find((key) => key.startsWith('crag-offline-data-'))!;
		const cache = await caches.open(name);
		const response = (await cache.match('/__offline_snapshot'))!;
		const snapshot = await response.json();
		snapshot.savedAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
		await cache.put('/__offline_snapshot', new Response(JSON.stringify(snapshot)));
		const preferences = await caches.open('crag-offline-preferences');
		await preferences.put(
			'/__offline_refresh',
			new Response(JSON.stringify({ enabled: true, lastAttempt: 0 }))
		);
	});
}

/**
 * Navigate while offline and wait for the worker's fallback redirect to /offline (#435).
 * `context.setOffline` reaches the service worker asynchronously, so the first navigation
 * can still be served from the network on a busy run. Retry the navigation itself; a worker
 * that never falls back still fails after the timeout.
 */
async function gotoOfflineFallback(page: Page, path: string) {
	await expect(async () => {
		await page.goto(path);
		await expect(page).toHaveURL(/\/offline$/, { timeout: 1000 });
	}).toPass({ timeout: 15000 });
}

async function standalone(page: Page) {
	await page.addInitScript(() => {
		const original = window.matchMedia.bind(window);
		window.matchMedia = (query) => {
			const result = original(query);
			if (query === '(display-mode: standalone)')
				Object.defineProperty(result, 'matches', { value: true });
			return result;
		};
	});
}

test('installing from a normal tab downloads the logbook without opening the offline viewer', async ({
	page,
	context
}) => {
	await page.goto('/logbook');
	await page.waitForFunction(() => !!navigator.serviceWorker.controller);
	expect(await savedCopy(page)).toBeNull();
	await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
	await expect.poll(async () => (await savedCopy(page))?.rows.length ?? 0).toBeGreaterThan(0);
	await context.setOffline(true);
	await gotoOfflineFallback(page, '/logbook');
	await expect(page.getByRole('heading', { name: 'Dashboard summary' })).toBeVisible();
	await expect(page.getByRole('table')).toContainText((await savedCopy(page))!.rows[0].name);
	await expectAxeClean(page, { include: ['main'] });
});

test('standalone launch, online reconnect and the foreground timer refresh automatically', async ({
	page,
	context
}) => {
	await page.clock.install();
	await standalone(page);
	await page.goto('/logbook');
	await expect.poll(async () => (await savedCopy(page))?.rows.length ?? 0).toBeGreaterThan(0);
	const initial = (await savedCopy(page))!.savedAt;
	await page.evaluate(() => window.dispatchEvent(new Event('online')));
	// A worker round trip is a barrier: a fresh copy must survive an automatic check unchanged.
	await page.evaluate(
		() =>
			new Promise<void>((resolve) => {
				const channel = new MessageChannel();
				channel.port1.onmessage = () => {
					channel.port1.close();
					resolve();
				};
				navigator.serviceWorker.controller!.postMessage({ type: 'AUTO_REFRESH' }, [channel.port2]);
			})
	);
	expect((await savedCopy(page))!.savedAt).toBe(initial);
	await ageCopy(page);
	await context.setOffline(true);
	await context.setOffline(false);
	await expect
		.poll(async () => Date.now() - Date.parse((await savedCopy(page))!.savedAt))
		.toBeLessThan(60000);
	await ageCopy(page);
	await page.clock.runFor(61000);
	await expect
		.poll(async () => Date.now() - Date.parse((await savedCopy(page))!.savedAt))
		.toBeLessThan(60000);
});

test('background refresh works without a viewer and clear stays paused after a new launch', async ({
	page,
	context
}) => {
	await standalone(page);
	await page.goto('/logbook');
	await expect.poll(async () => !!(await savedCopy(page))).toBe(true);
	await ageCopy(page);
	const worker = context.serviceWorkers()[0];
	const periodicRefresh = () =>
		worker.evaluate(async () => {
			let work: Promise<unknown> | undefined;
			self.dispatchEvent(
				Object.assign(new Event('periodicsync'), {
					tag: 'crag-offline-refresh',
					waitUntil(promise: Promise<unknown>) {
						work = promise;
					}
				})
			);
			await work;
		});
	await periodicRefresh();
	await expect
		.poll(async () => Date.now() - Date.parse((await savedCopy(page))!.savedAt))
		.toBeLessThan(60000);
	await page.goto('/offline');
	await expect(page.getByRole('heading', { name: 'Dashboard summary' })).toBeVisible();
	await page.getByRole('button', { name: 'Clear offline copy' }).click();
	await expect(page.getByRole('status')).toContainText('Automatic downloads paused');
	await page.goto('/logbook');
	await page.waitForFunction(() => !!navigator.serviceWorker.controller);
	await periodicRefresh();
	expect(await savedCopy(page)).toBeNull();
	await page.goto('/offline');
	await page.getByRole('button', { name: 'Download or refresh copy' }).click();
	await expect(page.getByRole('heading', { name: 'Dashboard summary' })).toBeVisible();
});

test('automatic refresh retains a usable copy during server outages and backs off', async ({
	page,
	context
}) => {
	await standalone(page);
	await page.goto('/logbook');
	await expect.poll(async () => !!(await savedCopy(page))).toBe(true);
	await ageCopy(page);
	const previous = (await savedCopy(page))!.savedAt;
	let attempts = 0;
	await context.route('**/api/offline', (route) => {
		attempts++;
		return route.fulfill({ status: 503, body: 'Temporarily unavailable' });
	});
	const refresh = () =>
		page.evaluate(
			() =>
				new Promise<void>((resolve) => {
					const channel = new MessageChannel();
					channel.port1.onmessage = () => {
						channel.port1.close();
						resolve();
					};
					navigator.serviceWorker.controller!.postMessage({ type: 'AUTO_REFRESH' }, [
						channel.port2
					]);
				})
		);
	await refresh();
	expect(attempts).toBe(1);
	expect((await savedCopy(page))!.savedAt).toBe(previous);
	await refresh();
	expect(attempts).toBe(1);
	await context.setOffline(true);
	await page.goto('/offline');
	await expect(page.getByRole('heading', { name: 'Dashboard summary' })).toBeVisible();
});

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
	await gotoOfflineFallback(page, '/logbook?not-downloaded=1');
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
	await standalone(page);
	await page.goto(`http://localhost:${PORTS.all}/offline`);
	await expect(page.getByRole('button', { name: 'Download or refresh copy' })).toBeEnabled({
		timeout: 30000
	});
	await page.getByRole('button', { name: 'Download or refresh copy' }).click();
	await expect(page.getByRole('status')).toContainText('Protected sites require a connection');
	expect(await savedCopy(page)).toBeNull();
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

test('clearing cancels an automatic download and queued refreshes before they can restore data', async ({
	page,
	context
}) => {
	let release!: () => void;
	const blocked = new Promise<void>((resolve) => {
		release = resolve;
	});
	let started!: () => void;
	const downloading = new Promise<void>((resolve) => {
		started = resolve;
	});
	await context.route('**/api/offline', async (route) => {
		started();
		await blocked;
		await route.continue();
	});
	await standalone(page);
	await page.goto('/logbook');
	await downloading;
	await page.evaluate(() => {
		const channel = new MessageChannel();
		channel.port1.onmessage = () => channel.port1.close();
		navigator.serviceWorker.controller!.postMessage({ type: 'AUTO_REFRESH' }, [channel.port2]);
	});
	try {
		await page.evaluate(
			() =>
				new Promise<void>((resolve) => {
					const channel = new MessageChannel();
					channel.port1.onmessage = () => {
						channel.port1.close();
						resolve();
					};
					navigator.serviceWorker.controller!.postMessage({ type: 'CLEAR' }, [channel.port2]);
				})
		);
	} finally {
		release();
	}
	// READ queues behind both cancelled refreshes, proving neither re-populated the cache.
	await page.evaluate(
		() =>
			new Promise<void>((resolve) => {
				const channel = new MessageChannel();
				channel.port1.onmessage = () => {
					channel.port1.close();
					resolve();
				};
				navigator.serviceWorker.controller!.postMessage({ type: 'READ' }, [channel.port2]);
			})
	);
	expect(await savedCopy(page)).toBeNull();
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
