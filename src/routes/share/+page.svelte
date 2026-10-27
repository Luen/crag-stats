<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let theme = $state<'light' | 'dark'>('light');
	let format = $state<'html' | 'markdown'>('html');
	let linkBack = $state(true);
	let copied = $state<string | null>(null);

	const dashboardUrl = $derived(`${data.origin}/`);

	function imageUrl(id: string) {
		return `${data.origin}/embed/${id}.svg${theme === 'dark' ? '?theme=dark' : ''}`;
	}

	function snippet(card: (typeof data.cards)[number]) {
		const src = imageUrl(card.id);
		if (format === 'markdown') {
			const img = `![${card.alt}](${src})`;
			return linkBack ? `[${img}](${dashboardUrl})` : img;
		}
		const img = `<img src="${src}" alt="${card.alt}" width="480" loading="lazy" />`;
		return linkBack ? `<a href="${dashboardUrl}">${img}</a>` : img;
	}

	async function copy(id: string, text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = id;
			setTimeout(() => {
				if (copied === id) copied = null;
			}, 1800);
		} catch {
			copied = null;
		}
	}

	const canShare = $derived(typeof navigator !== 'undefined' && 'share' in navigator);

	async function shareDashboard() {
		try {
			await navigator.share({ title: 'My climbing stats', url: dashboardUrl });
		} catch {
			// Dismissed, or not allowed here.
		}
	}
</script>

<section class="panel head">
	<h1>Share & embed</h1>
	<p>
		Live cards for a blog, forum signature or profile page. They're plain images, so they work
		anywhere that accepts an <code>&lt;img&gt;</code> or Markdown, and they update after each sync. Cards
		only show totals, grades and route names, never ascent notes or partners.
	</p>
	<div class="share-row">
		<button type="button" class="primary" onclick={() => copy('link', dashboardUrl)}>
			{copied === 'link' ? 'Link copied' : 'Copy dashboard link'}
		</button>
		{#if canShare}
			<button type="button" class="secondary" onclick={shareDashboard}>Share…</button>
		{/if}
	</div>
</section>

<section class="panel options" aria-label="Embed options">
	<fieldset>
		<legend>Theme</legend>
		<label><input type="radio" bind:group={theme} value="light" /> Light</label>
		<label><input type="radio" bind:group={theme} value="dark" /> Dark</label>
	</fieldset>
	<fieldset>
		<legend>Code</legend>
		<label><input type="radio" bind:group={format} value="html" /> HTML</label>
		<label><input type="radio" bind:group={format} value="markdown" /> Markdown</label>
	</fieldset>
	<label class="check"><input type="checkbox" bind:checked={linkBack} /> Link to my dashboard</label
	>
</section>

<div class="cards">
	{#each data.cards as card (card.id)}
		{@const code = snippet(card)}
		<section class="panel card">
			<h2>{card.title}</h2>
			<div class="preview" class:dark={theme === 'dark'}>
				<img src="/embed/{card.id}.svg{theme === 'dark' ? '?theme=dark' : ''}" alt={card.alt} />
			</div>
			<label class="code-label" for="code-{card.id}">Embed code</label>
			<textarea id="code-{card.id}" readonly rows="3" value={code}></textarea>
			<div class="card-actions">
				<button type="button" class="primary" onclick={() => copy(card.id, code)}>
					{copied === card.id ? 'Copied' : 'Copy code'}
				</button>
				<a class="secondary" href={imageUrl(card.id)} target="_blank" rel="noreferrer">Open image</a
				>
			</div>
		</section>
	{/each}
</div>

<style>
	.head,
	.options,
	.card {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.head h1 {
		margin: 0 0 0.4rem;
	}
	.head p {
		margin: 0;
		color: var(--ink-muted);
		max-width: 62ch;
	}
	.share-row,
	.card-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.85rem;
	}
	.options {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1.5rem;
		margin-top: 1rem;
	}
	fieldset {
		display: flex;
		gap: 0.9rem;
		border: 0;
		margin: 0;
		padding: 0;
	}
	legend {
		float: left;
		margin-right: 0.6rem;
		font-weight: 600;
	}
	label {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 32rem), 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}
	.card h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
	}
	.preview {
		display: grid;
		place-items: center;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--surface-3);
	}
	.preview.dark {
		background: #0f1218;
	}
	.preview img {
		max-width: 100%;
		height: auto;
	}
	.code-label {
		display: block;
		margin: 0.85rem 0 0.3rem;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--ink-muted);
	}
	textarea {
		width: 100%;
		box-sizing: border-box;
		font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
		font-size: 0.8rem;
		padding: 0.55rem 0.65rem;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		background: var(--surface-2);
		resize: vertical;
	}
	.primary,
	.secondary {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 0.9rem;
		border-radius: 0.55rem;
		font: inherit;
		font-weight: 600;
		font-size: 0.88rem;
		cursor: pointer;
	}
	.primary {
		background: var(--accent);
		color: var(--on-accent);
		border: 1px solid var(--accent);
	}
	.secondary {
		background: var(--paper);
		color: var(--ink);
		border: 1px solid var(--line);
	}
	code {
		font-size: 0.9em;
	}
</style>
