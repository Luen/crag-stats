<script lang="ts">
	import DocBlock from '#lib/components/DocBlock.svelte';
	import type { RenderedDoc } from '#lib/docs';

	/** Renders a docs page: trusted Markdown from docs/guide (repo content) + generated tables. */
	let { doc }: { doc: RenderedDoc } = $props();
</script>

<div class="prose">
	<h1>{doc.title}</h1>
	{#each doc.segments as seg, i (i)}
		{#if seg.kind === 'html'}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- repo-authored Markdown, not user input -->
			{@html seg.html}
		{:else}
			<DocBlock name={seg.name} />
		{/if}
	{/each}
</div>

<style>
	.prose {
		max-width: 52rem;
		line-height: 1.65;
	}
	.prose h1 {
		margin: 0 0 0.75rem;
	}
	.prose :global(h2) {
		margin: 2rem 0 0.5rem;
		font-size: 1.2rem;
	}
	.prose :global(h3) {
		margin: 1.4rem 0 0.4rem;
		font-size: 1rem;
	}
	.prose :global(p) {
		margin: 0.65rem 0;
	}
	.prose :global(p),
	.prose :global(li) {
		color: color-mix(in srgb, var(--ink) 88%, var(--paper));
	}
	.prose :global(a) {
		color: var(--accent);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.prose :global(code) {
		font-size: 0.88em;
		padding: 0.1rem 0.35rem;
		border-radius: 0.35rem;
		color: var(--ink);
		background: var(--surface-3);
	}
	/* Accent-on-surface code fails AA inside links; keep ink + parent underline. */
	.prose :global(a code) {
		color: var(--ink);
	}
	.prose :global(blockquote) {
		margin: 1rem 0;
		padding: 0.75rem 1rem;
		border-left: 4px solid var(--accent);
		border-radius: 0 0.6rem 0.6rem 0;
		background: var(--accent-soft);
		font-weight: 600;
	}
	.prose :global(blockquote p) {
		margin: 0;
	}
	.prose :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 0.75rem 0 1.25rem;
		font-size: 0.9rem;
	}
	.prose :global(th) {
		text-align: left;
		background: var(--surface-2);
		color: var(--ink-muted);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.55rem 0.75rem;
	}
	.prose :global(td) {
		padding: 0.5rem 0.75rem;
		border-top: 1px solid var(--line);
	}
	/* Tailwind's preflight resets list styles; restore them for prose. */
	.prose :global(ul) {
		list-style: disc;
		padding-left: 1.35rem;
	}
	.prose :global(ol) {
		list-style: decimal;
		padding-left: 1.35rem;
	}
	.prose :global(li) {
		margin: 0.3rem 0;
	}
	.prose :global(li::marker) {
		color: var(--accent);
	}
</style>
