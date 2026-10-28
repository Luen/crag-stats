<script lang="ts">
	import Self from './SectorTreeList.svelte';
	import type { SectorNode } from '#lib/types/sectors';

	type Props = {
		cragName: string;
		sectors: SectorNode[];
		nested: boolean;
		depth?: number;
	};

	let { cragName, sectors, nested, depth = 0 }: Props = $props();
</script>

<ul class="sectors" class:nested={depth > 0} style:--depth={depth}>
	{#each sectors as sector (sector.name)}
		<li>
			<div class="row">
				<a
					class="name"
					href="/logbook?crag={encodeURIComponent(cragName)}&sector={encodeURIComponent(
						sector.name
					)}">{sector.name}</a
				>
				<span class="meta">
					{sector.routeCount} routes · {sector.ascentCount} ascents
					{#if sector.multipitchRouteCount}
						<span class="tag" title="Routes with 2+ pitches from route API"
							>· {sector.multipitchRouteCount} multipitch</span
						>
					{/if}
					{#if sector.styleMismatchRouteCount}
						<span
							class="tag warn"
							title="Logbook style differs from route IsSport/IsTrad/IsBoulder flags"
							>· {sector.styleMismatchRouteCount} style flag ≠ gear</span
						>
					{/if}
				</span>
			</div>
			{#if nested && sector.children?.length}
				<Self {cragName} sectors={sector.children} {nested} depth={depth + 1} />
			{/if}
		</li>
	{/each}
</ul>

<style>
	.sectors {
		list-style: none;
		margin: 0.15rem 0 0 calc(0.25rem + var(--depth, 0) * 1rem);
		padding: 0;
		display: grid;
		gap: 0.35rem;
	}
	.sectors.nested {
		margin-top: 0.35rem;
		padding-left: 0.65rem;
		border-left: 1px solid var(--line);
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
		font-size: 0.92rem;
	}
	.name {
		font-weight: 600;
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
	.meta {
		color: var(--ink-muted);
		font-size: 0.88rem;
	}
	.tag {
		white-space: nowrap;
	}
	.tag.warn {
		color: var(--danger, #b45309);
	}
</style>
