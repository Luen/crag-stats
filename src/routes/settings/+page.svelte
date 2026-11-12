<script lang="ts">
	import { onMount } from 'svelte';
	import DashboardLayoutEditor from '#lib/components/DashboardLayoutEditor.svelte';
	import { formatDateTime, formatNumber } from '#lib/dates';
	import { BOULDER_GRADE_SYSTEMS, ROUTE_GRADE_SYSTEMS } from '#lib/grades';
	import {
		freshestSnapshot,
		IMPORT_PROGRESS_POLL_MS,
		importsRunning,
		type ImportProgressSnapshot
	} from '#lib/importProgress';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const importResult = $derived(
		form?.result?.skipped === false
			? form.result
			: form?.imported != null
				? { count: form.imported, created: form.created, pruned: null }
				: null
	);
	function countLabel(n: number, singular: string, plural = `${singular}s`): string {
		return `${formatNumber(n, data.dateDisplay)} ${n === 1 ? singular : plural}`;
	}
	type ImportSnapshot = ImportProgressSnapshot<
		PageProps['data']['routeHistory'],
		PageProps['data']['weatherImport']
	>;
	let polled = $state<ImportSnapshot | null>(null);
	const progress = $derived(
		freshestSnapshot(
			{
				serverNow: data.serverNow,
				routeHistory: data.routeHistory,
				weatherImport: data.weatherImport
			},
			polled
		)
	);
	const rh = $derived(progress.routeHistory);
	const wx = $derived(progress.weatherImport);
	const polling = $derived(importsRunning(progress));
	let elapsed = $state(0);
	const retrySeconds = $derived(
		Math.max(0, Math.ceil((rh.retryAt - progress.serverNow - elapsed) / 1000))
	);
	const weatherRetrySeconds = $derived(
		Math.max(0, Math.ceil((wx.retryAt - progress.serverNow - elapsed) / 1000))
	);

	// While a run is active, re-read the local counts so they climb as each item is saved.
	$effect(() => {
		if (!polling) return;
		let stopped = false;
		const timer = setInterval(async () => {
			if (document.hidden) return;
			try {
				const res = await fetch('/settings/import-status', {
					headers: { accept: 'application/json' }
				});
				if (!res.ok || stopped) return;
				const next = (await res.json()) as ImportSnapshot;
				if (!stopped) polled = next;
			} catch {
				// Keep the last counts; the next tick tries again.
			}
		}, IMPORT_PROGRESS_POLL_MS);
		return () => {
			stopped = true;
			clearInterval(timer);
		};
	});
	function formatRetry(seconds: number): string {
		if (seconds >= 3600)
			return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`;
		if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
		return `${seconds}s`;
	}
	const retryLabel = $derived(formatRetry(retrySeconds));
	const weatherRetryLabel = $derived(formatRetry(weatherRetrySeconds));

	onMount(() => {
		// Anchor to the server's clock so a skewed device clock cannot skip the cooldown.
		// Tick once per second so the accessible name does not chatter.
		let serverNow = progress.serverNow;
		let started = performance.now();
		const timer = setInterval(() => {
			if (serverNow !== progress.serverNow) {
				serverNow = progress.serverNow;
				started = performance.now();
			}
			elapsed = performance.now() - started;
		}, 1000);
		return () => clearInterval(timer);
	});
</script>

<section class="panel head">
	<h1>Settings</h1>
	<p>Sync, display preferences, search visibility, imports and local data control.</p>
</section>

{#if form?.routeHistoryWaiting}
	<p class="banner hint">
		{retrySeconds > 0
			? `Route data can be checked again in ${retryLabel}.`
			: 'Route data is ready to check again.'}
	</p>
{:else if form?.weatherWaiting}
	<p class="banner hint">
		{weatherRetrySeconds > 0
			? `Weather import can run again in ${weatherRetryLabel}.`
			: 'Weather import is ready to run again.'}
	</p>
{:else if form?.message}
	<p class="banner err">{form.message}</p>
{:else if form?.layoutSaved}
	<p class="banner ok">Dashboard layout saved. <a href="/">View dashboard</a></p>
{:else if form?.saved}
	<p class="banner ok">Preferences saved.</p>
{:else if form?.routeHistoryMessage}
	<p class="banner ok">{form.routeHistoryMessage}</p>
{:else if form?.weatherMessage}
	<p class="banner ok">{form.weatherMessage}</p>
{:else if form?.result?.skipped}
	<p class="banner hint" role="status">{form.result.reason}</p>
{:else if importResult}
	<div class="banner ok" role="status" aria-label="Import summary">
		<strong>{importResult.pruned ? 'Logbook sync complete.' : 'CSV import complete.'}</strong>
		<p>Processed {countLabel(importResult.count, 'ascent')}.</p>
		<ul>
			<li>{countLabel(importResult.created.routes, 'new route')}</li>
			<li>{countLabel(importResult.created.ascents, 'new ascent')}</li>
			<li>
				{countLabel(
					importResult.count - importResult.created.ascents,
					'existing ascent refreshed',
					'existing ascents refreshed'
				)}
			</li>
			{#if importResult.pruned}
				<li>
					{countLabel(importResult.pruned.deletedAscents, 'ascent removed', 'ascents removed')}
				</li>
				<li>{countLabel(importResult.pruned.deletedRoutes, 'route removed', 'routes removed')}</li>
			{/if}
		</ul>
		<p class="summary-note">
			{importResult.pruned
				? 'Route data and weather imports run separately when enabled.'
				: 'Manual CSV uploads do not remove missing entries.'}
		</p>
	</div>
{:else if form?.ok}
	<p class="banner ok">Done.</p>
{/if}

<section class="grid">
	<article class="panel">
		<h2>Display & visibility</h2>
		<form method="POST" action="?/savePreferences" class="prefs">
			<label class="field">
				<span>Language</span>
				<select name="locale">
					{#each data.supportedLocales as loc (loc)}
						<option value={loc} selected={data.locale === loc}>
							{data.localeMetadata[loc].nativeName} ({data.localeMetadata[loc].name})
						</option>
					{/each}
				</select>
				<small class="hint">
					Display language for the interface. Community translations are contributed on
					<a class="how" href="https://crowdin.com" target="_blank" rel="noreferrer">Crowdin</a>.
				</small>
			</label>
			<label class="field">
				<span>Route grades</span>
				<select name="routeSystem">
					{#each ROUTE_GRADE_SYSTEMS as opt (opt.id)}
						<option value={opt.id} selected={data.gradeSystems.route === opt.id}>{opt.label}</option
						>
					{/each}
				</select>
				<small class="hint">Sport, trad, top rope, and other roped climbing.</small>
			</label>
			<label class="field">
				<span>Boulder grades</span>
				<select name="boulderSystem">
					{#each BOULDER_GRADE_SYSTEMS as opt (opt.id)}
						<option value={opt.id} selected={data.gradeSystems.boulder === opt.id}
							>{opt.label}</option
						>
					{/each}
				</select>
				<small class="hint"
					>Boulders and V-graded highballs. Both choices apply for every visitor.</small
				>
			</label>
			<label class="check">
				<input
					type="checkbox"
					name="indexing"
					checked={data.searchIndexing.allowed}
					disabled={data.searchIndexing.forcedOff}
				/>
				<span>
					<strong>Show in search engines</strong>
					<small class="hint">
						{#if data.searchIndexing.forcedOff}
							Off — the whole site is password protected (<code>AUTH_SCOPE=all</code>).
						{:else}
							Untick to ask Google &amp; co. not to index this site (<code>robots.txt</code>,
							<code>noindex</code> meta tag and <code>X-Robots-Tag</code> header). Settings and login
							are never indexed.
						{/if}
					</small>
				</span>
			</label>
			<label class="check">
				<input type="checkbox" name="notes" checked={data.showNotes.enabled} />
				<span>
					<strong>Show my private ascent notes</strong>
					<small class="hint">
						Shows the notes from your theCrag ticks in the logbook, and lets logbook search match
						them.
						{#if data.authEnabled}
							Only shown while you're logged in. Visitors never see them.
						{:else}
							<strong
								>No <code>APP_PASSWORD</code> is set, so anyone who can open this site will see them.</strong
							> Best for offline or home-network installs.
						{/if}
					</small>
				</span>
			</label>
			<button type="submit">Save preferences</button>
		</form>
	</article>

	<article class="panel" id="dashboard">
		<h2>Dashboard layout</h2>
		<DashboardLayoutEditor layout={data.dashLayout} />
	</article>

	<article class="panel">
		<h2>CSV import</h2>
		<p class="hint">
			For everyone without supporter API access. Export from theCrag:
			<em>Action → Export logbook as CSV</em>, then upload the file here whenever you want to
			refresh. CSV import upserts rows but does <strong>not</strong> remove missing entries. API
			sync reconciles deletions. <a href="/docs/logbook-sync">Logbook sync options</a>
		</p>
		<form method="POST" action="?/importCsv" enctype="multipart/form-data" class="csv-import">
			<input
				type="file"
				name="file"
				accept=".csv,text/csv"
				aria-label="theCrag logbook CSV export"
				required
			/>
			<button type="submit">Import CSV</button>
		</form>
	</article>

	<article class="panel">
		<h2>theCrag logbook sync</h2>
		<p class="hint">
			Uses <code>THECRAG_API_KEY</code> from your environment. Keys grant read access to private
			notes — treat them like passwords.
			<a href="https://www.thecrag.com/en/article/logbookreadapi" target="_blank" rel="noreferrer"
				>API docs</a
			>
		</p>
		<p class="hint">
			<strong>Upstream is source of truth.</strong> Each sync pulls the full logbook, updates changed
			ascents (comments, grades, ticks), and deletes local rows that were removed on theCrag.
		</p>
		<p class="status">
			<span class={['pill', { ok: data.sync.status === 'idle', err: data.sync.status === 'error' }]}
				>{data.sync.status}</span
			>
			{#if data.sync.lastSuccessAt}
				<span>Last sync {formatDateTime(data.sync.lastSuccessAt, data.dateDisplay)}</span>
			{:else}
				<span>No logbook sync yet</span>
			{/if}
		</p>
		{#if data.sync.lastError}
			<p class="err">{data.sync.lastError}</p>
		{/if}
		{#if data.syncConfiguration.configured}
			<div class="actions">
				<form method="POST" action="?/sync">
					<button type="submit">Sync now</button>
				</form>
				<form method="POST" action="?/fullSync">
					<button type="submit" class="secondary">Sync again</button>
				</form>
			</div>
		{:else}
			<p class="hint">
				No API key configured. Set <code>THECRAG_API_KEY</code> in <code>.env</code>, or use
				<strong>CSV import</strong> above to upload your logbook export by hand.
			</p>
		{/if}
	</article>

	<article class="panel">
		<h2>Import route data</h2>
		<p class="hint">
			Caches route details for routes in your logbook from theCrag (popularity, ascent counts,
			quality, seasonality, beta, location, pitches and flags) along with their public history. FA /
			FFA entries that name your <code>@login</code> are marked as yours.
			{#if rh.refreshDays}
				Route data is queued for refresh after {rh.refreshDays} days.
			{:else}
				Each route is checked once unless you request a refresh.
			{/if}
			Up to {rh.perRun} routes per run, at most one request a second, after each logbook sync. When weather
			import is on, remaining requests also check crag/sector locations, including for CSV imports.
			<a href="/docs/first-ascents">How first ascents work</a>
		</p>
		{#if !rh.enabled}
			<p class="hint">
				Off. To turn it on, set <code>ROUTE_DATA_IMPORT=true</code> in <code>.env</code> and
				restart. theCrag blocks plain server requests to its route API, so this uses browser
				impersonation (<code>impers</code>). It's at your own risk under theCrag's terms; manual FA
				marks always work. Renamed from <code>ROUTE_HISTORY_IMPORT</code>, which no longer has any
				effect.
			</p>
		{:else if !rh.hasApiKey}
			<p class="hint">Needs <code>THECRAG_API_KEY</code> (the same key as API sync).</p>
		{:else}
			<p class="status">
				<span
					class={[
						'pill',
						{
							ok: rh.status === 'idle' || rh.status === 'running',
							err: rh.status === 'error' || rh.status === 'blocked'
						}
					]}
					aria-live="polite">{rh.status}</span
				>
				<span>
					{rh.fetchedRoutes} of {rh.totalRoutes} routes checked · {rh.importedMarks} FA/FFA imported
					{#if rh.pendingAreas > 0}
						· {rh.pendingAreas} weather areas pending{/if}
					{#if rh.lastRunAt}
						· last run {formatDateTime(rh.lastRunAt, data.dateDisplay)} ({rh.lastFetched} checked)
					{/if}
				</span>
			</p>
			{#if rh.nextAllowedAt && (rh.status === 'blocked' || rh.status === 'error')}
				<p class="err">
					{rh.lastError} Paused until {formatDateTime(rh.nextAllowedAt, data.dateDisplay)}.
				</p>
			{/if}
			<div class="actions">
				<form method="POST" action="?/fetchRouteHistory">
					<button
						type="submit"
						disabled={rh.running ||
							(rh.pendingRoutes === 0 && rh.pendingAreas === 0) ||
							retrySeconds > 0}
					>
						{rh.pendingRoutes === 0 && rh.pendingAreas === 0
							? 'All routes checked'
							: rh.running
								? 'Checking routes…'
								: retrySeconds > 0
									? `Check again in ${retryLabel}`
									: rh.pendingRoutes === 0
										? 'Check weather locations now'
										: `Check next ${rh.perRun} routes now`}
					</button>
				</form>
			</div>
			<noscript>
				<p class="hint">Reload this page to update route data availability.</p>
			</noscript>
			<details>
				<summary>Re-apply or refresh</summary>
				<form method="POST" action="?/reapplyRouteHistory" class="stack">
					<p class="hint">
						Re-applies marks from history already saved here. No requests to theCrag.
					</p>
					<label class="check">
						<input type="checkbox" name="replaceExisting" />
						<span>
							<strong>Replace existing FA / FFA marks</strong>
							<small class="hint">Off by default: marks you set stay as they are.</small>
						</span>
					</label>
					<label class="check">
						<input type="checkbox" name="reapplyUnmarked" />
						<span>
							<strong>Re-apply routes I unmarked</strong>
							<small class="hint">Off by default: routes you unmarked stay unmarked.</small>
						</span>
					</label>
					<button type="submit" class="secondary">Re-apply from saved history</button>
				</form>
				<form method="POST" action="?/refreshRouteHistory" class="stack">
					<p class="hint">
						Check every route again, still {data.routeHistory.perRun} per run. Only useful if theCrag's
						history was corrected. After re-fetching, use
						<strong>Re-apply from saved history</strong>
						(tick
						<strong>Replace existing</strong> if you want corrected history to overwrite current marks).
					</p>
					<label class="field">
						<span>Type <code>REFRESH</code> to confirm</span>
						<input name="confirm" autocomplete="off" />
					</label>
					<button type="submit" class="secondary">Refresh all routes</button>
				</form>
			</details>
		{/if}
	</article>

	<article class="panel">
		<h2>Import weather</h2>
		<p>
			<a href="/settings/weather-locations"
				>Review weather locations and choose a nearby place for missing locations</a
			>
		</p>
		<p class="hint">
			Caches daily outdoor weather (Open-Meteo) for logbook days that have a usable route/crag
			weather location. Powers heat, freeze, rain, snow and wind badges. Up to {wx.perRun} days per run,
			at most one request a second, after each logbook sync.
			<a href="/docs/weather">How weather works</a>
		</p>
		{#if !wx.enabled}
			<p class="hint">
				Off. To turn it on, set <code>WEATHER_IMPORT=true</code> in <code>.env</code> and restart. Uses
				Open-Meteo's free non-commercial archive API — fine for personal self-hosted installs.
			</p>
		{:else}
			<p class="status">
				<span
					class={[
						'pill',
						{
							ok: wx.status === 'idle' || wx.status === 'running',
							err: wx.status === 'error' || wx.status === 'blocked'
						}
					]}
					aria-live="polite">{wx.status}</span
				>
				<span>
					{wx.cachedOk} days cached · {wx.totalPending} pending
					{#if wx.unresolvedRoutes > 0}
						· {wx.unresolvedRoutes} outdoor routes without locations{/if}
					{#if wx.lastRunAt}
						· last run {formatDateTime(wx.lastRunAt, data.dateDisplay)} ({wx.lastFetched} fetched)
					{/if}
				</span>
			</p>
			{#if wx.nextAllowedAt && (wx.status === 'blocked' || wx.status === 'error')}
				<p class="err">
					{wx.lastError} Paused until {formatDateTime(wx.nextAllowedAt, data.dateDisplay)}.
				</p>
			{/if}
			{#if wx.totalPending === 0 && wx.cachedOk === 0}
				<p class="hint">
					No weather days ready to fetch. Weather needs a usable route/crag location and a valid
					past climbing date.
					{#if wx.unresolvedRoutes > 0}
						Check pending route data and weather locations above, then <a
							href="/settings/weather-locations">review missing locations</a
						>. CSV imports can use the configured supporter key for crag/sector lookups when route
						data import is enabled.
					{/if}
				</p>
			{/if}
			<div class="actions">
				<form method="POST" action="?/fetchWeather">
					<button
						type="submit"
						disabled={wx.running || wx.totalPending === 0 || weatherRetrySeconds > 0}
					>
						{wx.totalPending === 0
							? wx.cachedOk === 0
								? 'No eligible days pending'
								: 'All outdoor days cached'
							: wx.running
								? 'Fetching weather…'
								: weatherRetrySeconds > 0
									? `Fetch again in ${weatherRetryLabel}`
									: `Fetch next ${wx.perRun} days now`}
					</button>
				</form>
			</div>
		{/if}
	</article>

	<article class="panel">
		<h2>Privacy & data control</h2>
		<p class="hint">
			Revoking a theCrag key does not delete data already synced here. Wipe only removes the
			<strong>local</strong> SQLite copy on this machine — it never deletes your theCrag logbook.
			See <a href="https://github.com/Luen/crag-stats/blob/main/docs/PRIVACY.md">PRIVACY.md</a>.
		</p>
		<div class="backup">
			<a class="btn secondary" href="/settings/export" download>
				<svg
					viewBox="0 0 24 24"
					width="17"
					height="17"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					><path
						d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
					/></svg
				>
				Download logbook CSV
			</a>
			<small class="hint">Backup / re-import</small>
		</div>
		<form method="POST" action="?/wipe" class="stack">
			<input name="confirm" placeholder="Type DELETE to confirm" required />
			<button type="submit" class="danger">Wipe all local data</button>
		</form>
	</article>

	{#if data.authEnabled && data.authed}
		<article class="panel">
			<h2>Admin session</h2>
			<p class="hint">
				End your signed-in session on this device. You will need the app password to return.
			</p>
			<form method="POST" action="/logout">
				<button type="submit" class="secondary">Log out</button>
			</form>
		</article>
	{/if}
</section>

<style>
	.head,
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.head {
		margin-bottom: 0.9rem;
	}
	h1,
	h2 {
		margin: 0 0 0.5rem;
	}
	.head p,
	.hint {
		color: var(--ink-muted);
		margin: 0.35rem 0 0.85rem;
	}
	.grid {
		display: grid;
		gap: 0.9rem;
	}
	.prefs {
		display: grid;
		gap: 1rem;
		max-width: 36rem;
	}
	.field {
		display: grid;
		gap: 0.3rem;
	}
	.field > span {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ink-muted);
	}
	.field select {
		font: inherit;
		padding: 0.5rem 0.6rem;
		border-radius: 0.55rem;
		border: 1px solid var(--line);
		max-width: 18rem;
	}
	.prefs .hint {
		margin: 0;
		font-size: 0.85rem;
	}
	.check {
		display: flex;
		gap: 0.65rem;
		align-items: flex-start;
	}
	.check input {
		margin-top: 0.3rem;
		width: 1.05rem;
		height: 1.05rem;
		accent-color: var(--accent);
	}
	.check span {
		display: grid;
		gap: 0.15rem;
	}
	.status {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
		color: var(--ink-muted);
	}
	.pill {
		padding: 0.2rem 0.65rem;
		border-radius: 999px;
		background: var(--surface-3);
		color: var(--ink);
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
	}
	/* Ink text on tinted pills (#300–#302): the generic .ok/.err rules below must not recolour them (#429). */
	.pill.ok {
		background: color-mix(in srgb, var(--band-beginner) 20%, var(--paper));
		color: var(--ink);
	}
	.pill.err {
		background: color-mix(in srgb, var(--band-expert) 16%, var(--paper));
		color: var(--ink);
	}
	.actions,
	.stack {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}
	.stack {
		flex-direction: column;
		align-items: stretch;
	}
	.csv-import {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		align-items: flex-start;
	}
	.csv-import input[type='file'] {
		width: 100%;
		max-width: 32rem;
		min-width: 0;
		padding: 0.35rem;
		background: var(--paper);
		color: var(--ink-muted);
	}
	.csv-import input::file-selector-button {
		margin-right: 0.75rem;
		padding: 0.45rem 0.7rem;
		border: 1px solid var(--line);
		border-radius: 0.35rem;
		background: var(--surface-2);
		color: var(--ink);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	.csv-import input::file-selector-button:hover {
		background: var(--surface-3);
	}
	button,
	.btn,
	input {
		font: inherit;
		padding: 0.55rem 0.8rem;
		border-radius: 0.55rem;
		border: 1px solid var(--line);
	}
	button,
	.btn {
		background: var(--accent);
		color: var(--on-accent);
		border: none;
		font-weight: 700;
		cursor: pointer;
		width: fit-content;
	}
	button:hover,
	.btn:hover {
		background: var(--accent-strong);
	}
	button:disabled,
	button:disabled:hover {
		background: var(--surface-3);
		color: var(--ink-muted);
		cursor: not-allowed;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}
	button.secondary,
	.btn.secondary {
		background: var(--paper);
		color: var(--ink);
		border: 1px solid var(--line);
	}
	button.secondary:hover,
	.btn.secondary:hover {
		background: var(--surface-2);
	}
	button.danger {
		background: var(--band-expert);
		color: #fff;
	}
	button.danger:hover {
		background: var(--band-expert);
		filter: brightness(0.9);
	}
	.backup {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.65rem;
		margin-bottom: 1.1rem;
	}
	.backup .hint {
		margin: 0;
	}
	.summary-note {
		font-size: 0.85rem;
	}
	.banner {
		padding: 0.7rem 1rem;
		border-radius: 0.7rem;
		margin-bottom: 0.8rem;
	}
	.ok {
		background: color-mix(in srgb, var(--band-beginner) 18%, var(--paper));
	}
	.err {
		background: color-mix(in srgb, var(--band-expert) 12%, var(--paper));
		/* Pure --band-expert is 2.78:1 on the dark tint; mixing with ink keeps it red and AA in both themes (#429). */
		color: color-mix(in srgb, var(--band-expert) 45%, var(--ink));
	}
	.banner.hint {
		background: var(--accent-soft);
		color: var(--ink);
	}
</style>
