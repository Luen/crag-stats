/// <reference lib="webworker" />
import { networkOnlyResponse } from '../lib/offlineFetch';
import { version } from '$app/env';
import { immutable, assets as staticAssets } from '$app/manifest';
import {
	OFFLINE_MAX_BYTES,
	OFFLINE_SYNC_TAG,
	offlineRefreshDue,
	snapshotIsFresh,
	type OfflineRefreshState,
	type OfflineSnapshot
} from '../lib/offline';

const worker = self as unknown as ServiceWorkerGlobalScope;
const PREFIX = 'crag-offline-';
const SHELL = `${PREFIX}shell-${version}`;
const DATA = `${PREFIX}data-${version}`;
// Preserve a user's pause choice across worker upgrades, even though snapshots are versioned.
const PREFERENCES = `${PREFIX}preferences`;
const REFRESH_STATE = new URL('/__offline_refresh', worker.location.origin).href;
const SNAPSHOT = new URL('/__offline_snapshot', worker.location.origin).href;
const assets = [
	...immutable.map((asset) => '/' + asset.path),
	...staticAssets
		.map((asset) => '/' + asset.path)
		.filter((f) => /\/(icon[^/]*\.png|apple-touch-icon\.png|manifest.webmanifest)$/.test(f))
];
/** Proxy/tunnel answers when the homeserver behind it is down. */
const UNREACHABLE = new Set([502, 503, 504]);
let generation = 0;
let pending = Promise.resolve();
let preferenceWrites = Promise.resolve();

function writeRefreshState(state: OfflineRefreshState): Promise<void> {
	preferenceWrites = preferenceWrites
		.catch(() => {})
		.then(async () => {
			await (
				await caches.open(PREFERENCES)
			).put(REFRESH_STATE, new Response(JSON.stringify(state)));
		});
	return preferenceWrites;
}

async function refreshState(): Promise<OfflineRefreshState | null> {
	await preferenceWrites;
	const response = await (await caches.open(PREFERENCES)).match(REFRESH_STATE);
	return response ? response.json() : null;
}

async function clear(excludeClient?: string, pause = false) {
	generation++;
	if (pause) {
		await writeRefreshState({ enabled: false, lastAttempt: 0 });
		const periodic = (
			worker.registration as ServiceWorkerRegistration & {
				periodicSync?: { unregister(tag: string): Promise<void> };
			}
		).periodicSync;
		await periodic?.unregister(OFFLINE_SYNC_TAG).catch(() => {});
	}
	await caches.delete(DATA);
	for (const client of await worker.clients.matchAll()) {
		if (client.id !== excludeClient) client.postMessage({ type: 'OFFLINE_CLEARED' });
	}
}

async function network(input: RequestInfo | URL): Promise<Response> {
	// Online events can precede connectivity in the worker (for example after waking a PWA).
	// Retry one failed transport request; HTTP/auth failures are handled without retrying.
	for (let attempt = 0; ; attempt++) {
		try {
			return await fetch(input, {
				credentials: 'omit',
				cache: 'no-store',
				signal: AbortSignal.timeout(8000)
			});
		} catch (error) {
			if (attempt === 1) throw error;
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}
}

worker.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(SHELL);
			await cache.addAll(assets);
			const shell = await network('/offline');
			if (
				!shell.ok ||
				shell.redirected ||
				!shell.headers.get('content-type')?.includes('text/html')
			)
				throw new Error('Offline shell unavailable');
			await cache.put('/offline', shell);
			await worker.skipWaiting();
		})()
	);
});

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			await Promise.all(
				(await caches.keys())
					.filter((key) => key.startsWith(PREFIX) && ![SHELL, DATA, PREFERENCES].includes(key))
					.map((key) => caches.delete(key))
			);
			await worker.clients.claim();
		})()
	);
});

async function read(sourceId?: string): Promise<OfflineSnapshot | null> {
	const before = generation;
	const response = await (await caches.open(DATA)).match(SNAPSHOT);
	if (!response) return null;
	const snapshot: OfflineSnapshot = await response.json();
	if (!snapshotIsFresh(snapshot)) {
		await clear(sourceId);
		return null;
	}
	try {
		const policy = await network('/api/offline?policy');
		if (policy.status >= 500) throw new Error('Server unavailable');
		if (!policy.ok || policy.redirected || policy.headers.get('x-crag-offline') !== 'public') {
			await clear(sourceId);
			return null;
		}
		if ((await policy.json()).revision !== snapshot.revision) {
			await clear(sourceId);
			return null;
		}
	} catch {
		/* Server unreachable: the public copy remains usable until expiry. */
	}
	return generation === before ? snapshot : null;
}

async function save(sourceId?: string): Promise<OfflineSnapshot> {
	const before = generation;
	const response = await network('/api/offline');
	// A temporary server outage must not destroy the last usable offline copy.
	if (response.status >= 500)
		throw new Error('Server unavailable. Keeping the saved offline copy.');
	if (
		!response.ok ||
		response.redirected ||
		response.headers.get('x-crag-offline') !== 'public' ||
		!response.headers.get('content-type')?.includes('application/json')
	) {
		await clear(sourceId);
		throw new Error('Offline downloads are unavailable. Protected sites require a connection.');
	}
	const body = await response.text();
	if (new TextEncoder().encode(body).byteLength > OFFLINE_MAX_BYTES)
		throw new Error('Offline download exceeds 10 MB.');
	const snapshot: OfflineSnapshot = JSON.parse(body);
	if (!snapshotIsFresh(snapshot) || generation !== before)
		throw new Error('Download cancelled. Try again while connected.');
	await (
		await caches.open(DATA)
	).put(SNAPSHOT, new Response(body, { headers: { 'content-type': 'application/json' } }));
	// A wipe/logout can arrive while Cache.put is pending.
	if (generation !== before) {
		await clear(sourceId);
		throw new Error('Download cancelled.');
	}
	return snapshot;
}

async function refreshAutomatically() {
	const before = generation;
	const state = await refreshState();
	if (state && !state.enabled) return { automatic: false };
	const response = await (await caches.open(DATA)).match(SNAPSHOT);
	const snapshot: OfflineSnapshot | null = response ? await response.json() : null;
	if (generation !== before) return { automatic: false };
	if (!state) {
		await writeRefreshState({ enabled: true, lastAttempt: 0 });
		if (generation !== before) return { automatic: false };
	}
	if (!offlineRefreshDue(snapshot, state)) return { automatic: true };
	await writeRefreshState({ enabled: true, lastAttempt: Date.now() });
	if (generation !== before) return { automatic: false };
	await save();
	for (const client of await worker.clients.matchAll())
		client.postMessage({ type: 'OFFLINE_SAVED' });
	return { automatic: true };
}

worker.addEventListener('message', (event) => {
	const port = event.ports[0];
	if (!port || !['READ', 'SAVE', 'CLEAR', 'AUTO_REFRESH'].includes(event.data?.type)) return;
	const sourceId = event.source && 'id' in event.source ? event.source.id : undefined;
	// Serialize downloads and reads; clear immediately invalidates any in-flight save.
	if (event.data.type === 'CLEAR') {
		event.waitUntil(clear(sourceId, true).then(() => port.postMessage({ snapshot: null })));
		return;
	}
	const queuedGeneration = generation;
	pending = pending.then(async () => {
		const before = generation;
		try {
			if (generation !== queuedGeneration) throw new Error('Download cancelled.');
			if (event.data.type === 'AUTO_REFRESH') {
				port.postMessage(await refreshAutomatically());
			} else {
				if (event.data.type === 'SAVE') {
					await writeRefreshState({ enabled: true, lastAttempt: Date.now() });
					if (generation !== before) throw new Error('Download cancelled.');
				}
				port.postMessage({
					snapshot: event.data.type === 'SAVE' ? await save(sourceId) : await read(sourceId)
				});
			}
		} catch (error) {
			port.postMessage({
				error: error instanceof Error ? error.message : 'Offline storage is unavailable.',
				cleared: generation !== before
			});
		}
	});
	event.waitUntil(pending);
});

// Unsupported browsers use the installed app's launch/reconnect/foreground timer instead.
worker.addEventListener('periodicsync', (rawEvent) => {
	const event = rawEvent as ExtendableEvent & { tag: string };
	if (event.tag !== OFFLINE_SYNC_TAG) return;
	const before = generation;
	pending = pending.then(async () => {
		try {
			if (generation !== before || !(await refreshState())?.enabled) return;
			await refreshAutomatically();
		} catch {
			// Keep a usable saved copy and retry on the next online foreground/background check.
		}
	});
	event.waitUntil(pending);
});

worker.addEventListener('fetch', (event) => {
	const request = event.request;
	const url = new URL(request.url);
	if (url.origin !== worker.location.origin) return;
	// Any mutation or logout invalidates the local download before the request runs.
	if (request.method !== 'GET' || url.pathname === '/logout') {
		event.respondWith(
			(async () => {
				await clear(undefined, true);
				return fetch(request);
			})()
		);
		return;
	}
	if (assets.includes(url.pathname)) {
		event.respondWith(
			(async () => (await (await caches.open(SHELL)).match(url.pathname)) ?? fetch(request))()
		);
		return;
	}
	// Never cache SSR pages, settings, login, notes, API responses or __data.json.
	if (request.mode === 'navigate') {
		event.respondWith(
			(async () => {
				try {
					// Generous timeout: a big dashboard on a small homeserver can take several seconds.
					const response = await fetch(request, { signal: AbortSignal.timeout(30000) });
					if (response.headers.get('x-crag-offline') === 'disabled') await clear();
					// Only gateway errors mean the homeserver is unreachable; show app errors as-is.
					if (!UNREACHABLE.has(response.status)) return response;
				} catch {
					/* Fall back to the data-free shell. */
				}
				if (url.pathname !== '/offline') return Response.redirect(new URL('/offline', url), 302);
				return (
					(await (await caches.open(SHELL)).match('/offline')) ??
					new Response('Connect once to prepare offline mode.', { status: 503 })
				);
			})()
		);
	} else {
		event.respondWith(
			(async () => {
				const response = await networkOnlyResponse(request);
				if (response.headers.get('x-crag-offline') === 'disabled') await clear();
				return response;
			})()
		);
	}
});
