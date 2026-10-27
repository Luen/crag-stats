<script lang="ts">
	type Tag = { category: string; name: string };
	type Props = { tags?: Tag[] | null; max?: number };
	let { tags = [], max = 4 }: Props = $props();

	const CHIP_CATEGORIES = new Set([
		'Rock type',
		'Steepness',
		'Aspect',
		'Weather',
		'Walk in time',
		'Legality',
		'Style'
	]);

	const visible = $derived(
		(tags ?? [])
			.filter((t) => CHIP_CATEGORIES.has(t.category) || t.category === 'Condition')
			.slice(0, max)
	);
</script>

{#if visible.length}
	<div class="chips">
		{#each visible as tag (`${tag.category}:${tag.name}`)}
			<span class="chip" title={tag.category}>{tag.name}</span>
		{/each}
	</div>
{/if}

<style>
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.25rem;
	}
	.chip {
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		padding: 0.1rem 0.4rem;
		border-radius: 0.35rem;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--ink-muted);
		border: 1px solid color-mix(in srgb, var(--line) 80%, transparent);
	}
</style>
