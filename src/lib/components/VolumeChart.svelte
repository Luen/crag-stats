<script lang="ts">
	type Point = { month: string; count: number; sends: number };
	type Props = { data: Point[] };
	let { data }: Props = $props();

	const max = $derived(Math.max(1, ...data.map((d) => d.count)));
</script>

{#if data.length === 0}
	<p class="empty">No volume data yet — sync or import a logbook.</p>
{:else}
	<div class="chart" style:--n={data.length}>
		{#each data as point (point.month)}
			<div class="col" title="{point.month}: {point.count} ascents ({point.sends} sends)">
				<div class="stack">
					<div class="bar total" style:height="{(point.count / max) * 100}%"></div>
					<div class="bar sends" style:height="{(point.sends / max) * 100}%"></div>
				</div>
				<span class="m">{point.month.slice(2)}</span>
			</div>
		{/each}
	</div>
	<div class="legend">
		<span><i class="t"></i> Ascents</span>
		<span><i class="s"></i> Sends</span>
	</div>
{/if}

<style>
	.chart {
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		align-items: end;
		gap: 0.35rem;
		height: 160px;
	}
	.col {
		display: grid;
		grid-template-rows: 1fr auto;
		height: 100%;
		gap: 0.35rem;
	}
	.stack {
		position: relative;
		height: 100%;
	}
	.bar {
		position: absolute;
		left: 15%;
		right: 15%;
		bottom: 0;
		border-radius: 4px 4px 0 0;
	}
	.total {
		background: rgba(47, 93, 58, 0.28);
	}
	.sends {
		background: var(--accent);
	}
	.m {
		font-size: 0.65rem;
		text-align: center;
		color: var(--ink-muted);
		transform: rotate(-45deg);
		transform-origin: top center;
		height: 1.6rem;
	}
	.legend {
		display: flex;
		gap: 1rem;
		margin-top: 0.75rem;
		font-size: 0.85rem;
		color: var(--ink-muted);
	}
	.legend i {
		display: inline-block;
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 2px;
		margin-right: 0.3rem;
	}
	.legend .t {
		background: rgba(47, 93, 58, 0.28);
	}
	.legend .s {
		background: var(--accent);
	}
	.empty {
		color: var(--ink-muted);
		margin: 0;
	}
</style>
