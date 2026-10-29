<script lang="ts">
	import DashboardLayoutEditor from '#lib/components/DashboardLayoutEditor.svelte';
	import { formatDateTime } from '#lib/dates';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const rh = $derived(data.routeHistory);

	const systems = [
		{ id: 'ewbank', label: 'Ewbanks (AU/NZ)' },
		{ id: 'french', label: 'French' },
		{ id: 'yds', label: 'YDS' },
		{ id: 'v_scale', label: 'V-Scale' },
		{ id: 'font', label: 'Fontainebleau' }
	] as const;
</script>

<section class="panel head">
	<h1>Settings</h1>
	<p>Sync, display preferences, search visibility, imports and local data control.</p>
</section>

{#if form?.message}
	<p class="banner err">{form.message}</p>
{:else if form?.firstImportSaved}
	<p class="banner ok">First import date saved. <a href="/">View badges</a></p>
{:else if form?.layoutSaved}
	<p class="banner ok">Dashboard layout saved. <a href="/">View dashboard</a></p>
{:else if form?.saved}
	<p class="banner ok">Preferences saved.</p>
{:else if form?.routeHistoryMessage}
	<p class="banner ok">{form.routeHistoryMessage}</p>
{:else if form?.ok}
	<p class="banner ok">Done.</p>
{/if}

<section class="grid">
	<article class="panel">
		<h2>Display & visibility</h2>
		<form method="POST" action="?/savePreferences" class="prefs">
			<label class="field">
				<span>Grade system</span>
				<select name="system">
					{#each systems as opt (opt.id)}
						<option value={opt.id} selected={data.gradeSystem === opt.id}>{opt.label}</option>
					{/each}
				</select>
				<small class="hint"
					>Used for the dashboard for every visitor. Boulders always show V-scale or Font.</small
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
			<em>Action → Export logbook as CSV</em>. CSV import upserts rows but does
			<strong>not</strong> prune deletes (API sync does).
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
		{#if form?.imported != null}
			<p class="ok">Parsed {form.imported} ascents.</p>
		{/if}
	</article>

	<article class="panel">
		<h2>theCrag API sync</h2>
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
				<span>No API sync yet</span>
			{/if}
		</p>
		{#if data.sync.lastError}
			<p class="err">{data.sync.lastError}</p>
		{/if}
		{#if data.hasApiKey}
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
				No API key configured. Set <code>THECRAG_API_KEY</code> in <code>.env</code>.
			</p>
		{/if}
	</article>

	<article class="panel" id="first-import">
		<h2>First Moves badge</h2>
		<p class="hint">
			This badge dates your first successful logbook import into Crag Stats. Older installs did not
			save that date; enter it here if you know it. <a href="/docs/badges">How badges work</a>
		</p>
		<form method="POST" action="?/saveFirstImportDate" class="prefs">
			<label class="field">
				<span>First import date</span>
				<input type="date" name="date" value={data.firstImportDate} required />
			</label>
			<button type="submit">Save first import date</button>
		</form>
	</article>

	<article class="panel">
		<h2>Import route history</h2>
		<p class="hint">
			Reads the public FA / FFA history of routes in your logbook from theCrag and marks the ones
			that name your <code>@login</code>.
			{#if rh.refreshDays}
				Route data is queued for refresh after {rh.refreshDays} days.
			{:else}
				Each route is checked once unless you request a refresh.
			{/if}
			Up to {rh.perRun} routes per run, at most one request a second, after each logbook sync.
			<a href="/docs/first-ascents">How first ascents work</a>
		</p>
		{#if !rh.enabled}
			<p class="hint">
				Off. To turn it on, set <code>ROUTE_HISTORY_IMPORT=true</code> in <code>.env</code> and
				restart. theCrag blocks plain server requests to its route API, so this uses browser
				impersonation (<code>impers</code>). It's at your own risk under theCrag's terms; manual FA
				marks always work.
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
					]}>{rh.status}</span
				>
				<span>
					{rh.fetchedRoutes} of {rh.totalRoutes} routes checked · {rh.importedMarks} FA/FFA imported
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
					<button type="submit" disabled={rh.running || rh.pendingRoutes === 0}>
						{rh.pendingRoutes === 0 ? 'All routes checked' : `Check next ${rh.perRun} routes now`}
					</button>
				</form>
			</div>
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
	.pill.ok {
		background: color-mix(in srgb, var(--band-beginner) 20%, var(--paper));
	}
	.pill.err {
		background: color-mix(in srgb, var(--band-expert) 16%, var(--paper));
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
	/* File + compact primary control (not a full-width accent bar). */
	.csv-import {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		align-items: center;
	}
	.csv-import input[type='file'] {
		flex: 1 1 14rem;
		min-width: 0;
		background: var(--paper);
	}
	.csv-import button {
		flex: 0 0 auto;
		align-self: center;
		padding: 0.55rem 1.15rem;
		border: 1px solid color-mix(in srgb, var(--accent) 55%, var(--ink));
		box-shadow: var(--shadow);
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
	.csv-import button:hover {
		border-color: var(--accent-strong);
		box-shadow: var(--shadow);
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
		color: var(--band-expert);
	}
</style>
