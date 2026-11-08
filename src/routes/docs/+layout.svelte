<script lang="ts">
	import { page } from '$app/state';
	import { DOC_PAGES } from '#lib/docs';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	/**
	 * On phones the tab strip scrolls sideways; bring the current page's tab into view
	 * without moving the page itself. Re-runs when the path changes.
	 */
	function scrollActiveTab(toc: HTMLElement) {
		void page.url.pathname;
		const active = toc.querySelector<HTMLElement>('a.active');
		if (!active || toc.scrollWidth <= toc.clientWidth) return;
		toc.scrollLeft = active.offsetLeft - (toc.clientWidth - active.offsetWidth) / 2;
	}
</script>

<div class="docs">
	<nav class="toc panel" aria-label="Docs" {@attach scrollActiveTab}>
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
		min-width: 0;
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
			/* minmax(0, …) stops wide tables from stretching the column past the viewport. */
			grid-template-columns: minmax(0, 1fr);
		}
		.toc {
			/* Positioned so tab offsets are measured from the strip itself. */
			position: relative;
			top: auto;
			flex-direction: row;
			overflow-x: auto;
		}
		.toc a {
			white-space: nowrap;
		}
	}
</style>
