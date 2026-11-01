<script lang="ts">
	import { onMount } from 'svelte';
	import { formatDateTime, formatNumber, DEFAULT_DATE_DISPLAY } from '#lib/dates';
	import { snapshotIsFresh, type OfflineSnapshot } from '#lib/offline';

	let snapshot = $state<OfflineSnapshot | null>(null);
	let message = $state('Preparing offline storage…');
	let busy = $state(true);
	let ready = $state(false);
	let online = $state(true);
	let query = $state('');
	let limit = $state(100);
	const matching = $derived(
		(snapshot?.rows ?? []).filter((r) =>
			[r.name, r.crag, r.partners, r.grade, r.tick].some((value) =>
				value?.toLowerCase().includes(query.toLowerCase())
			)
		)
	);
	const fmt = (value: number) => formatNumber(value, DEFAULT_DATE_DISPLAY);

	async function command(type: 'READ' | 'SAVE' | 'CLEAR'): Promise<void> {
		busy = true;
		try {
			const controller = navigator.serviceWorker.controller;
			if (!controller)
				throw new Error('Offline mode is still preparing. Reload this page while connected.');
			const result = await new Promise<{ snapshot?: OfflineSnapshot | null; error?: string }>(
				(resolve, reject) => {
					const channel = new MessageChannel();
					const timeout = setTimeout(() => {
						channel.port1.close();
						reject(new Error('The server or offline storage did not respond. Try again.'));
					}, 20000);
					channel.port1.onmessage = (event) => {
						clearTimeout(timeout);
						channel.port1.close();
						resolve(event.data);
					};
					controller.postMessage({ type }, [channel.port2]);
				}
			);
			if (result.error) {
				throw new Error(result.error);
			}
			snapshot = result.snapshot ?? null;
			message =
				type === 'CLEAR'
					? 'Offline copy cleared.'
					: snapshot
						? 'Saved copy ready. Sync and editing require a connection.'
						: 'No offline copy. Download while connected; expired copies are removed after seven days.';
		} catch (error) {
			message = error instanceof Error ? error.message : 'Offline storage is unavailable.';
		} finally {
			busy = false;
		}
	}

	onMount(() => {
		let alive = true;
		online = navigator.onLine;
		const reconnect = async () => {
			online = true;
			if (ready) {
				await command('READ');
				if (snapshot) await command('SAVE');
			}
		};
		const disconnect = () => {
			online = false;
		};
		window.addEventListener('online', reconnect);
		window.addEventListener('offline', disconnect);
		const cleared = (event: MessageEvent) => {
			if (event.data?.type === 'OFFLINE_CLEARED') {
				snapshot = null;
				message = 'Offline copy cleared. Download again while connected.';
			}
		};
		const expiry = setInterval(() => {
			if (snapshot && !snapshotIsFresh(snapshot)) void command('CLEAR');
		}, 30000);
		navigator.serviceWorker?.addEventListener('message', cleared);
		void (async () => {
			if (!('serviceWorker' in navigator) || !window.isSecureContext) {
				message =
					'Offline mode needs HTTPS (or localhost) and a browser with service worker support.';
				busy = false;
				return;
			}
			try {
				await navigator.serviceWorker.register('/service-worker.js', { type: 'module' });
				await navigator.serviceWorker.ready;
				if (!alive) return;
				if (!navigator.serviceWorker.controller)
					await new Promise<void>((resolve) =>
						navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
							once: true
						})
					);
				if (!alive) return;
				ready = true;
				await command('READ');
				if (online && snapshot) await command('SAVE');
			} catch {
				message =
					'Could not prepare offline mode. Check your connection and browser storage permissions.';
				busy = false;
			}
		})();
		return () => {
			alive = false;
			clearInterval(expiry);
			navigator.serviceWorker?.removeEventListener('message', cleared);
			window.removeEventListener('online', reconnect);
			window.removeEventListener('offline', disconnect);
		};
	});
</script>

<svelte:head><title>Offline copy · Crag Stats</title></svelte:head>
<h1>Offline copy</h1>
<p>
	Download public climbing stats and your latest logbook rows for this browser. Private notes are
	excluded. Sites protected by a whole-app password stay online-only.
</p>
<p>
	<a href="/" data-sveltekit-reload>Return to live dashboard</a> ·
	<a href="/docs/offline" data-sveltekit-reload>How offline mode works</a>
</p>
<div class="controls">
	<button type="button" disabled={!ready || busy || !online} onclick={() => command('SAVE')}
		>Download or refresh copy</button
	>
	<button type="button" disabled={!ready || busy} onclick={() => command('CLEAR')}
		>Clear offline copy</button
	>
</div>
<p role="status">
	{online
		? 'Connection available; the server may still be unreachable.'
		: 'Offline — showing downloaded data only.'}
	{message}
</p>
{#if snapshot}
	<p class="saved">
		Saved {formatDateTime(snapshot.savedAt, DEFAULT_DATE_DISPLAY)} (UTC). Expires after seven days. This
		is a snapshot, not live data.
	</p>
	<section class="panel" aria-label="Downloaded dashboard stats">
		<h2>Dashboard summary</h2>
		<dl>
			<div>
				<dt>Ascents</dt>
				<dd>{fmt(snapshot.summary.ascents)}</dd>
			</div>
			<div>
				<dt>Successful ascents</dt>
				<dd>{fmt(snapshot.summary.sends)}</dd>
			</div>
			<div>
				<dt>Metres climbed</dt>
				<dd>{fmt(snapshot.summary.heightM)}</dd>
			</div>
		</dl>
	</section>
	<section class="panel" aria-label="Downloaded logbook">
		<h2>Logbook</h2>
		<p>
			Downloaded {fmt(snapshot.rows.length)} of {fmt(snapshot.total)} ascents, newest first. Up to 5,000
			rows / 10 MB; other pages and charts need a connection.
		</p>
		<label
			>Search downloaded climbs <input
				type="search"
				bind:value={query}
				oninput={() => {
					limit = 100;
				}}
			/></label
		>
		<p>{fmt(matching.length)} matching ascents</p>
		<div class="table-wrap">
			<table>
				<caption class="sr-only">Downloaded ascents</caption><thead
					><tr
						><th scope="col">Date</th><th scope="col">Climb</th><th scope="col">Grade</th><th
							scope="col">Tick</th
						><th scope="col">Partners</th></tr
					></thead
				><tbody>
					{#each matching.slice(0, limit) as row (row.id)}<tr
							><td>{row.date?.slice(0, 10) ?? 'Unknown'}</td><td>{row.name}<br />{row.crag}</td><td
								>{row.grade ?? '—'}</td
							><td>{row.tick ?? '—'}</td><td>{row.partners ?? '—'}</td></tr
						>{/each}
				</tbody>
			</table>
		</div>
		{#if matching.length > limit}<button
				type="button"
				onclick={() => {
					limit += 100;
				}}>Show 100 more</button
			>{/if}
	</section>
{/if}

<style>
	p {
		max-width: 75ch;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	button,
	input {
		font: inherit;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		padding: 0.6rem 0.8rem;
		color: var(--ink);
		background: var(--paper);
	}
	button:disabled {
		opacity: 0.6;
	}
	.saved {
		color: var(--ink-muted);
	}
	.panel {
		padding: 1rem;
		margin-block: 1rem;
	}
	dl {
		display: flex;
		flex-wrap: wrap;
		gap: 2rem;
	}
	dd {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
	}
	label {
		display: grid;
		gap: 0.5rem;
		max-width: 30rem;
	}
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		text-align: left;
		padding: 0.6rem;
		border-bottom: 1px solid var(--line);
		overflow-wrap: anywhere;
	}
</style>
