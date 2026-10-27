<script lang="ts">
	import { page } from '$app/state';
	import { DOC_PAGES } from '#lib/docs';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div class="docs">
	<nav class="toc panel" aria-label="Docs">
		<a href="/docs" class={{ active: page.url.pathname === '/docs' }}>Overview</a>
		{#each DOC_PAGES as d (d.slug)}
			<a href="/docs/{d.slug}" class={{ active: page.url.pathname === `/docs/${d.slug}` }}
				>{d.title}</a
			>
		{/each}
	</nav>
	<div class="body">
		{@render children()}
	</div>
</div>

<style>
	.docs {
		display: grid;
		grid-template-columns: 13rem minmax(0, 1fr);
		gap: 1rem;
		align-items: start;
	}
	.toc {
		position: sticky;
		top: calc(var(--header-h) + 1rem);
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.6rem;
		border-radius: 1rem;
	}
	.toc a {
		padding: 0.45rem 0.65rem;
		border-radius: 0.55rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--ink-muted);
	}
	.toc a:hover {
		background: var(--surface-2);
		color: var(--ink);
	}
	.toc a.active {
		background: var(--accent-soft);
		color: var(--accent);
	}
	@media (max-width: 960px) {
		.docs {
			grid-template-columns: 1fr;
		}
		.toc {
			position: static;
			flex-direction: row;
			overflow-x: auto;
		}
		.toc a {
			white-space: nowrap;
		}
	}
</style>
