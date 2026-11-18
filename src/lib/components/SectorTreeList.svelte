<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import Self from './SectorTreeList.svelte';
	import type { SectorNode } from '#lib/types/sectors';

	type Props = {
		cragName: string;
		sectors: SectorNode[];
		nested: boolean;
		depth?: number;
		parentPath?: string[];
	};

	let { cragName, sectors, nested, depth = 0, parentPath = [] }: Props = $props();
	const i18n = useI18n();
</script>

<ul class="sectors" class:nested={depth > 0} style:--depth={depth}>
	{#each sectors as sector ([...parentPath, sector.name].join('\0'))}
		<li>
			<div class="row">
				<a
					class="name"
					href="/logbook?crag={encodeURIComponent(cragName)}&sectorPath={encodeURIComponent(
						JSON.stringify([...parentPath, sector.name])
					)}"
				>
					{sector.name}
				</a>
				<span class="meta">
					{i18n.t('cards.sectorTreeList.meta', {
						routes: sector.routeCount,
						ascents: sector.ascentCount
					})}
					{#if sector.multipitchRouteCount}
						<span class="tag" title={i18n.t('cards.sectorTreeList.titlePitchesHint')}>
							· {i18n.t('cards.sectorTreeList.metaMultipitch', {
								count: sector.multipitchRouteCount
							})}
						</span>
					{/if}
					{#if sector.styleMismatchRouteCount}
						<span class="tag warn" title={i18n.t('cards.sectorTreeList.titleStyleFlagsHint')}>
							· {i18n.t('cards.sectorTreeList.metaStyleFlags', {
								count: sector.styleMismatchRouteCount
							})}
						</span>
					{/if}
				</span>
			</div>
			{#if nested && sector.children?.length}
				<Self
					{cragName}
					sectors={sector.children}
					{nested}
					depth={depth + 1}
					parentPath={[...parentPath, sector.name]}
				/>
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
