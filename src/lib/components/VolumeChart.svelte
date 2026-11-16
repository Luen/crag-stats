<script lang="ts">
	import { useI18n } from '#lib/i18n';

	type Point = { month: string; count: number; sends: number };
	type Props = { data: Point[] };
	let { data }: Props = $props();
	const i18n = useI18n();

	const max = $derived(Math.max(1, ...data.map((d) => d.count)));
</script>

{#if data.length === 0}
	<p class="empty">{i18n.t('cards.volumeChart.empty')}</p>
{:else}
	<div class="chart" style:--n={data.length}>
		{#each data as point (point.month)}
			<a
				class="col"
				href="/logbook?year={point.month.slice(0, 4)}"
				title={i18n.t('cards.volumeChart.pointTitle', {
					month: point.month,
					count: point.count,
					sends: point.sends
				})}
			>
				<div class="stack">
					<div class="bar total" style:height="{(point.count / max) * 100}%"></div>
					<div class="bar sends" style:height="{(point.sends / max) * 100}%"></div>
				</div>
				<span class="m">{point.month.slice(2)}</span>
			</a>
		{/each}
	</div>
	<div class="legend">
		<span><i class="t"></i> {i18n.t('cards.volumeChart.ascents')}</span>
		<span><i class="s"></i> {i18n.t('cards.volumeChart.sends')}</span>
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
		text-decoration: none;
		color: inherit;
	}
	.col:hover .bar.total {
		opacity: 0.85;
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
		border-radius: 3px 3px 0 0;
	}
	.bar.total {
		background: color-mix(in oklab, var(--accent) 35%, transparent);
	}
	.bar.sends {
		background: var(--accent);
	}
	.m {
		font-size: 0.65rem;
		text-align: center;
		color: var(--ink-muted);
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.legend {
		display: flex;
		gap: 1rem;
		margin-top: 0.5rem;
		font-size: 0.8rem;
		color: var(--ink-muted);
	}
	.legend i {
		display: inline-block;
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 2px;
		margin-right: 0.25rem;
		vertical-align: middle;
	}
	.legend .t {
		background: color-mix(in oklab, var(--accent) 35%, transparent);
	}
	.legend .s {
		background: var(--accent);
	}
	.empty {
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
</style>
