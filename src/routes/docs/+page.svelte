<script lang="ts">
	import DocContent from './DocContent.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<article class="panel">
	<DocContent doc={data.intro} />
	<ul class="cards">
		{#each data.pages as p (p.slug)}
			<li>
				<a href="/docs/{p.slug}">
					<strong>{p.title}</strong>
					<span>{p.summary}</span>
				</a>
			</li>
		{/each}
	</ul>
</article>

<style>
	.panel {
		padding: 1.5rem 1.75rem;
		border-radius: 1rem;
	}
	.cards {
		list-style: none;
		padding: 0;
		margin: 1.25rem 0 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 0.75rem;
	}
	.cards a {
		display: grid;
		gap: 0.3rem;
		height: 100%;
		padding: 0.9rem 1rem;
		border: 1px solid var(--line);
		border-radius: 0.8rem;
		background: var(--surface-2);
		transition:
			border-color 0.15s,
			background 0.15s;
	}
	.cards a:hover {
		border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
		background: var(--accent-soft);
	}
	.cards strong {
		color: var(--ink);
	}
	.cards span {
		color: var(--ink-muted);
		font-size: 0.88rem;
	}
</style>
