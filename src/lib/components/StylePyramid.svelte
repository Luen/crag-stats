<script lang="ts">
	import GradeChip from '#lib/components/GradeChip.svelte';
	import type { StylePyramid } from '#lib/types/dashboard';

	type Props = { pyramid: StylePyramid };
	let { pyramid }: Props = $props();

	const max = $derived(Math.max(1, ...pyramid.rows.map((r) => r.total)));
</script>

<article class="panel">
	<header>
		<h3>{pyramid.style}</h3>
		<span class="meta">{pyramid.total} ascents · {pyramid.system}</span>
	</header>
	{#if pyramid.rows.length === 0}
		<p class="empty">No graded ascents</p>
	{:else}
		<div class="pyramid">
			{#each pyramid.rows as row (row.score)}
				<div class="row">
					<span class="g">
						<a href={row.href} title="Show {pyramid.style} ascents at {row.grade}">
							<GradeChip grade={row.grade} band={row.band} />
						</a>
					</span>
					<div class="track">
						<a class="bar-link" href={row.href} title="Show {pyramid.style} ascents at {row.grade}">
							<div class="stack" style:width="{Math.max(10, (row.total / max) * 100)}%">
								{#each row.segments as seg (seg.tick)}
									<span
										class="seg"
										style:flex={seg.count}
										style:background={seg.color}
										title="{seg.tick}: {seg.count}"
									></span>
								{/each}
							</div>
						</a>
						<span class="n">{row.total}</span>
					</div>
				</div>
			{/each}
		</div>
		<div class="legend">
			{#each [...new Map(pyramid.rows.flatMap((r) => r.segments.map((s) => [s.tick, s.color]))).entries()] as [tick, color] (tick)}
				<span><i style:background={color}></i>{tick}</span>
			{/each}
		</div>
	{/if}
</article>

<style>
	.panel {
		padding: 1rem 1.1rem;
		border-radius: 1rem;
	}
	header {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: baseline;
		margin-bottom: 0.75rem;
	}
	h3 {
		margin: 0;
		font-size: 1.05rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.meta,
	.empty {
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
	.pyramid {
		display: grid;
		gap: 0.35rem;
	}
	.row {
		display: grid;
		grid-template-columns: 4.8rem 1fr;
		gap: 0.5rem;
		align-items: center;
	}
	.track {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 1.1rem;
	}
	.g a,
	.bar-link {
		color: inherit;
		text-decoration: none;
	}
	.g a:hover :global(.grade-chip),
	.bar-link:hover .stack {
		outline: 2px solid var(--accent, #1d6fa5);
		outline-offset: 1px;
	}
	.bar-link {
		flex: 1;
		min-width: 0;
		display: flex;
	}
	.stack {
		display: flex;
		height: 0.95rem;
		border-radius: 3px;
		overflow: hidden;
		min-width: 1rem;
	}
	.seg {
		display: block;
		min-width: 2px;
	}
	.n {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--ink-muted);
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem 0.85rem;
		margin-top: 0.7rem;
		font-size: 0.78rem;
		color: var(--ink-muted);
	}
	.legend i {
		display: inline-block;
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 2px;
		margin-right: 0.25rem;
	}
</style>
