<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import { onMount } from 'svelte';
	import {
		formatCalendarDate,
		formatDateTime,
		formatNumber,
		DEFAULT_DATE_DISPLAY
	} from '#lib/dates';
	import { formatHeight } from '#lib/units';
	import { snapshotIsFresh, type OfflineSnapshot } from '#lib/offline';
	import { offlineCommand } from '#lib/offlineClient';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();

	let snapshot = $state<OfflineSnapshot | null>(null);
	let message = $state(i18n.t('pages.offline.statusPreparing'));
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
			const result = await offlineCommand(type);
			if (result.error) {
				if (result.cleared) snapshot = null;
				throw new Error(result.error);
			}
			snapshot = result.snapshot ?? null;
			message =
				type === 'CLEAR'
					? i18n.t('pages.offline.statusClearedPaused')
					: snapshot
						? i18n.t('pages.offline.statusSavedCopyReady')
						: i18n.t('pages.offline.statusNoOfflineCopy');
		} catch (error) {
			message =
				error instanceof Error ? error.message : i18n.t('pages.offline.statusStorageUnavailable');
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
				message = i18n.t('pages.offline.statusClearedDownloadAgain');
			}
			if (event.data?.type === 'OFFLINE_SAVED' && ready) void command('READ');
		};
		const expiry = setInterval(() => {
			if (snapshot && !snapshotIsFresh(snapshot)) void command('READ');
		}, 30000);
		navigator.serviceWorker?.addEventListener('message', cleared);
		void (async () => {
			if (!('serviceWorker' in navigator) || !window.isSecureContext) {
				message = i18n.t('pages.offline.statusNeedsHttps');
				busy = false;
				return;
			}
			try {
				await navigator.serviceWorker.register('/service-worker.js', { type: 'module' });
				if (!navigator.serviceWorker.controller)
					await new Promise<void>((resolve, reject) => {
						const controlled = () => {
							clearTimeout(timeout);
							resolve();
						};
						const timeout = setTimeout(() => {
							navigator.serviceWorker.removeEventListener('controllerchange', controlled);
							reject(new Error(i18n.t('pages.offline.errorPreparationTimedOut')));
						}, 20000);
						navigator.serviceWorker.addEventListener('controllerchange', controlled, {
							once: true
						});
					});
				if (!alive) return;
				ready = true;
				await command('READ');
				if (online && snapshot) await command('SAVE');
			} catch {
				message = i18n.t('pages.offline.statusCouldNotPrepare');
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

<svelte:head><title>{i18n.t('pages.offline.pageTitle')}</title></svelte:head>
<h1>{i18n.t('pages.offline.titleOfflineCopy')}</h1>
<p>
	{i18n.t('pages.offline.leadDownloadCopy')}
</p>
<p>
	{i18n.t('pages.offline.leadAutomaticDownloads')}
</p>
<p>
	<a href="/" data-sveltekit-reload>{i18n.t('pages.offline.linkReturnToLiveDashboard')}</a> ·
	<a href="/docs/offline" data-sveltekit-reload>{i18n.t('pages.offline.linkHowOfflineModeWorks')}</a
	>
</p>
<div class="controls">
	<button type="button" disabled={!ready || busy || !online} onclick={() => command('SAVE')}
		>{i18n.t('pages.offline.buttonDownloadOrRefreshCopy')}</button
	>
	<button type="button" disabled={!ready || busy} onclick={() => command('CLEAR')}
		>{i18n.t('pages.offline.buttonClearOfflineCopy')}</button
	>
</div>
<p role="status">
	{online
		? i18n.t('pages.offline.statusConnectionAvailable')
		: i18n.t('pages.offline.statusOfflineShowingDownloadedData')}
	{message}
</p>
{#if snapshot}
	<p class="saved">
		{i18n.t('pages.offline.statusSavedSnapshot', {
			when: formatDateTime(snapshot.savedAt, DEFAULT_DATE_DISPLAY)
		})}
	</p>
	<section class="panel" aria-label={i18n.t('pages.offline.ariaDownloadedDashboardStats')}>
		<h2>{i18n.t('pages.offline.titleDashboardSummary')}</h2>
		<dl>
			<div>
				<dt>{i18n.t('pages.offline.labelAscents')}</dt>
				<dd>{fmt(snapshot.summary.ascents)}</dd>
			</div>
			<div>
				<dt>{i18n.t('pages.offline.labelSuccessfulAscents')}</dt>
				<dd>{fmt(snapshot.summary.sends)}</dd>
			</div>
			<div>
				<dt>{i18n.t('pages.offline.labelHeightClimbed')}</dt>
				<dd>{formatHeight(snapshot.summary.heightM, data.displayUnits.height)}</dd>
			</div>
		</dl>
	</section>
	<section class="panel" aria-label={i18n.t('pages.offline.ariaDownloadedLogbook')}>
		<h2>{i18n.t('pages.offline.titleLogbook')}</h2>
		<p>
			{i18n.t('pages.offline.leadDownloadedRows', {
				shown: fmt(snapshot.rows.length),
				total: fmt(snapshot.total)
			})}
		</p>
		<label
			>{i18n.t('pages.offline.labelSearchDownloadedClimbs')}
			<input
				type="search"
				bind:value={query}
				oninput={() => {
					limit = 100;
				}}
			/></label
		>
		<p>{i18n.t('pages.offline.matchingAscents', { count: fmt(matching.length) })}</p>
		<div class="table-wrap">
			<table>
				<caption class="sr-only">{i18n.t('pages.offline.captionDownloadedAscents')}</caption><thead
					><tr
						><th scope="col">{i18n.t('pages.offline.columnDate')}</th><th scope="col"
							>{i18n.t('pages.offline.columnClimb')}</th
						><th scope="col">{i18n.t('pages.offline.columnGrade')}</th><th scope="col"
							>{i18n.t('pages.offline.columnTick')}</th
						><th scope="col">{i18n.t('pages.offline.columnPartners')}</th></tr
					></thead
				><tbody>
					{#each matching.slice(0, limit) as row (row.id)}<tr
							><td
								>{formatCalendarDate(row.date, data.dateDisplay) ||
									i18n.t('pages.offline.unknown')}</td
							><td>{row.name}<br />{row.crag}</td><td>{row.grade ?? '—'}</td><td
								>{row.tick ?? '—'}</td
							><td>{row.partners ?? '—'}</td></tr
						>{/each}
				</tbody>
			</table>
		</div>
		{#if matching.length > limit}<button
				type="button"
				onclick={() => {
					limit += 100;
				}}>{i18n.t('pages.offline.buttonShow100More')}</button
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
