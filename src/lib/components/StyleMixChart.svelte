<script lang="ts">
	import { STYLE_COLORS } from '#lib/ticks';

	type MonthMix = {
		month: string;
		Sport: number;
		Trad: number;
		Boulder: number;
		Other: number;
	};

	type Props = { months: MonthMix[] };
	let { months }: Props = $props();

	const styles = ['Sport', 'Trad', 'Boulder', 'Other'] as const;
	const colors: Record<(typeof styles)[number], string> = {
		Sport: STYLE_COLORS.Sport,
		Trad: STYLE_COLORS.Trad,
		Boulder: STYLE_COLORS.Boulder,
		Other: STYLE_COLORS.Unknown
	};

	type Range = 'recent' | 'all';
	let range = $state<Range>('recent');

	const visible = $derived(range === 'all' || months.length <= 36 ? months : months.slice(-36));

	const max = $derived(Math.max(1, ...visible.map((m) => m.Sport + m.Trad + m.Boulder + m.Other)));

	const showMonthLabels = $derived(visible.length <= 18);
	const showRangeToggle = $derived(months.length > 36);

	/** Year tick (`’20`) or upright `YY-MM` for short series; empty keeps column alignment. */
	function labelFor(month: string, index: number): string {
		if (showMonthLabels) return month.slice(2);

		const isJan = month.endsWith('-01');
		const prev = index > 0 ? visible[index - 1] : null;
		const isFirstOfYear = !prev || prev.month.slice(0, 4) !== month.slice(0, 4);
		if (isJan || isFirstOfYear) return `’${month.slice(2, 4)}`;
		return '';
	}
</script>

<article class="panel">
	<div class="head">
		<h2>Style mix</h2>
		{#if showRangeToggle}
			<div class="toggles" role="group" aria-label="Time range">
				<button
					type="button"
					class={{ active: range === 'recent' }}
					onclick={() => (range = 'recent')}>Last 3 years</button
				>
				<button type="button" class={{ active: range === 'all' }} onclick={() => (range = 'all')}
					>All</button
				>
			</div>
		{/if}
	</div>

	{#if months.length === 0}
		<p class="empty">No style mix data yet.</p>
	{:else}
		<div class="chart-scroll">
			<div
				class={['chart', { dense: range === 'all' && visible.length > 36 }]}
				style:--n={visible.length}
			>
				{#each visible as m, i (m.month)}
					{@const total = m.Sport + m.Trad + m.Boulder + m.Other}
					{@const label = labelFor(m.month, i)}
					<a
						class="col"
						href={`/logbook?year=${m.month.slice(0, 4)}`}
						title="{m.month}: Sport {m.Sport}, Trad {m.Trad}, Boulder {m.Boulder}, Other {m.Other}"
					>
						<div class="plot">
							{#if total > 0}
								<div class="stack" style:height="{(total / max) * 100}%">
									{#each styles as style (style)}
										{#if m[style] > 0}
											<div
												class="seg"
												style:flex={m[style]}
												style:background={colors[style]}
												title="{style}: {m[style]}"
											></div>
										{/if}
									{/each}
								</div>
							{/if}
						</div>
						<span class="m">{label}</span>
					</a>
				{/each}
			</div>
		</div>
		<div class="legend">
			{#each styles as style (style)}
				<span><i style:background={colors[style]}></i> {style}</span>
			{/each}
		</div>
	{/if}
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
		max-width: 100%;
		min-width: 0;
	}
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		margin-bottom: 0.75rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.toggles {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.toggles button {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.3rem 0.65rem;
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		background: var(--paper);
		color: var(--ink-muted);
		cursor: pointer;
	}
	.toggles button.active {
		background: var(--accent);
		border-color: var(--accent);
		color: white;
	}
	.chart-scroll {
		overflow-x: auto;
		max-width: 100%;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
		padding-bottom: 0.25rem;
	}
	.chart {
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0.85rem, 1fr));
		gap: 0.15rem;
		min-width: max(100%, calc(var(--n) * 1rem));
	}
	.chart.dense {
		grid-template-columns: repeat(var(--n), minmax(10px, 1fr));
		gap: 1px;
		min-width: max(100%, calc(var(--n) * 12px));
	}
	.col {
		display: flex;
		flex-direction: column;
		min-width: 0;
		text-decoration: none;
		color: inherit;
	}
	.plot {
		position: relative;
		height: 150px;
		width: 100%;
	}
	.stack {
		position: absolute;
		left: 10%;
		right: 10%;
		bottom: 0;
		display: flex;
		flex-direction: column-reverse;
		min-height: 3px;
		border-radius: 3px 3px 0 0;
		overflow: hidden;
	}
	.seg {
		min-height: 2px;
		width: 100%;
		border-radius: 0;
	}
	.m {
		display: block;
		height: 1.4rem;
		line-height: 1.4rem;
		font-size: 0.65rem;
		text-align: center;
		color: var(--ink-muted);
		white-space: nowrap;
		overflow: hidden;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1rem;
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
		vertical-align: -0.05rem;
	}
	.empty {
		color: var(--ink-muted);
		margin: 0;
	}
</style>
