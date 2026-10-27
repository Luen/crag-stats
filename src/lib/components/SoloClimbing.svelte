<script lang="ts">
	import GradeChip from '#lib/components/GradeChip.svelte';
	import type { SoloStats } from '#lib/types/dashboard';

	type Props = { data: SoloStats };
	let { data }: Props = $props();

	const year = (d: string | null) => (d ? d.slice(0, 4) : null);
	const unpartneredPct = $derived(
		data.totalAscents ? Math.round((data.unpartnered / data.totalAscents) * 100) : 0
	);
</script>

<article class="panel">
	<h2>Solo climbing</h2>
	{#if data.total === 0}
		<p class="empty">No solo ascents logged yet: top-rope solo, lead solo or free solo.</p>
	{:else}
		<ul class="kinds">
			{#each data.kinds as k (k.kind)}
				<li>
					<div class="head">
						<strong>{k.label}</strong>
						<span class="count">{k.count}</span>
					</div>
					<p class="meta">
						{k.sends} send{k.sends === 1 ? '' : 's'}
						{#if k.first}
							· {year(k.first) === year(k.latest)
								? year(k.first)
								: `${year(k.first)}–${year(k.latest)}`}
						{/if}
					</p>
					{#if k.hardest}
						<p class="hardest">
							<span class="label">Hardest</span>
							{#if k.hardest.url}
								<a href={k.hardest.url} target="_blank" rel="noreferrer">{k.hardest.routeName}</a>
							{:else}
								{k.hardest.routeName}
							{/if}
							<GradeChip grade={k.hardest.gradeLabel} band={k.hardest.band} />
						</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
	<p class="foot">
		<strong>{data.unpartnered}</strong> ascent{data.unpartnered === 1 ? '' : 's'}
		({data.unpartneredSends} send{data.unpartneredSends === 1 ? '' : 's'}, {unpartneredPct}%) have
		no partner tagged on theCrag.
		<a href="/docs/solo">How it works</a>
	</p>
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
	}
	.empty {
		margin: 0;
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
	.kinds {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: 0.55rem;
	}
	.kinds li {
		border: 1px solid var(--line);
		border-top: 3px solid var(--accent-2);
		border-radius: 0.65rem;
		padding: 0.7rem 0.75rem;
		background: var(--paper);
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5rem;
	}
	.count {
		font-family: var(--font-display);
		font-size: 1.45rem;
		font-weight: 700;
		line-height: 1;
	}
	.meta {
		margin: 0.25rem 0 0;
		color: var(--ink-muted);
		font-size: 0.82rem;
	}
	.hardest {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
	}
	.hardest .label {
		color: var(--ink-muted);
	}
	.hardest a,
	.foot a {
		text-decoration: underline;
	}
	.foot {
		margin: 0.8rem 0 0;
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
	.foot strong {
		color: var(--ink);
	}
</style>
