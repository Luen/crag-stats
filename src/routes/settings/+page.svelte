<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<section class="panel head">
	<h1>Settings</h1>
	<p>Sync sources, imports, and local data control.</p>
</section>

{#if form?.message}
	<p class="banner err">{form.message}</p>
{:else if form?.ok}
	<p class="banner ok">Done.</p>
{/if}

<section class="grid">
	<article class="panel">
		<h2>theCrag API sync</h2>
		<p class="hint">
			Uses <code>THECRAG_API_KEY</code> from your environment. Keys grant read access to private notes —
			treat them like passwords.
			<a href="https://www.thecrag.com/en/article/logbookreadapi" target="_blank" rel="noreferrer"
				>API docs</a
			>
		</p>
		<p class="hint">
			<strong>Upstream is source of truth.</strong> Each sync pulls the full logbook, updates changed
			ascents (comments, grades, ticks), and deletes local rows that were removed on theCrag.
		</p>
		<p>
			Status: <strong>{data.sync.status}</strong>
			{#if data.sync.lastSuccessAt}
				· last success {new Date(data.sync.lastSuccessAt).toLocaleString()}
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
			<p class="hint">No API key configured. Set <code>THECRAG_API_KEY</code> in <code>.env</code>.</p>
		{/if}
	</article>

	<article class="panel">
		<h2>CSV import</h2>
		<p class="hint">
			For everyone without supporter API access. Export from theCrag:
			<em>Action → Export logbook as CSV</em>. CSV import upserts rows but does
			<strong>not</strong> prune deletes (API sync does).
		</p>
		<form method="POST" action="?/importCsv" enctype="multipart/form-data" class="stack">
			<input type="file" name="file" accept=".csv,text/csv" required />
			<button type="submit">Import CSV</button>
		</form>
		{#if form?.imported != null}
			<p class="ok">Parsed {form.imported} ascents.</p>
		{/if}
	</article>

	<article class="panel">
		<h2>Privacy & data control</h2>
		<p class="hint">
			Revoking a theCrag key does not delete data already synced here. Use wipe to remove the local
			copy.
		</p>
		<form method="POST" action="?/wipe" class="stack">
			<input name="confirm" placeholder="Type DELETE to confirm" required />
			<button type="submit" class="danger">Wipe all local data</button>
		</form>
	</article>
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
	button,
	input {
		font: inherit;
		padding: 0.55rem 0.8rem;
		border-radius: 0.55rem;
		border: 1px solid var(--line);
	}
	button {
		background: var(--accent);
		color: white;
		border: none;
		font-weight: 700;
		cursor: pointer;
		width: fit-content;
	}
	button.secondary {
		background: transparent;
		color: var(--ink);
		border: 1px solid var(--line);
	}
	button.danger {
		background: rgb(201, 9, 9);
	}
	.banner {
		padding: 0.7rem 1rem;
		border-radius: 0.7rem;
		margin-bottom: 0.8rem;
	}
	.ok {
		background: rgba(84, 180, 26, 0.18);
	}
	.err {
		background: rgba(201, 9, 9, 0.12);
		color: #7a1010;
	}
</style>
