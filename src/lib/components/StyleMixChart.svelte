<script lang="ts">
	import { innerWidth } from 'svelte/reactivity/window';

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
		Sport: 'var(--accent)',
		Trad: '#c47a3a',
		Boulder: '#3a6ea5',
		Other: 'rgba(28, 36, 24, 0.28)'
	};

	const max = $derived(
		Math.max(1, ...months.map((m) => m.Sport + m.Trad + m.Boulder + m.Other))
	);

	const narrow = $derived((innerWidth.current ?? 900) < 700);
	const sparseLabels = $derived(narrow || months.length > 18);

	function showLabel(month: string, index: number): boolean {
		if (!sparseLabels) return true;
		if (month.endsWith('-01')) return true;
		const step = Math.max(2, Math.ceil(months.length / 12));
		return index % step === 0 || index === months.length - 1;
	}
</script>

<article class="panel">
	<h2>Style mix</h2>

	{#if months.length === 0}
		<p class="empty">No style mix data yet.</p>
	{:else}
		<div class="chart-scroll">
			<div class="chart" style:--n={months.length}>
				{#each months as m, i (m.month)}
					{@const total = m.Sport + m.Trad + m.Boulder + m.Other}
					<a
						class="col"
						href={`/logbook?year=${m.month.slice(0, 4)}`}
						title="{m.month}: Sport {m.Sport}, Trad {m.Trad}, Boulder {m.Boulder}, Other {m.Other}"
					>
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
						<span class={['m', { hidden: !showLabel(m.month, i) }]}>{m.month.slice(2)}</span>
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
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
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
		align-items: end;
		gap: 0.35rem;
		height: 160px;
		min-width: max(100%, calc(var(--n) * 1.15rem));
	}
	.col {
		display: grid;
		grid-template-rows: 1fr auto;
		height: 100%;
		gap: 0.35rem;
		text-decoration: none;
		color: inherit;
		min-width: 0.85rem;
		align-items: end;
	}
	.stack {
		display: flex;
		flex-direction: column-reverse;
		width: 70%;
		margin: 0 auto;
		min-height: 2px;
		border-radius: 4px 4px 0 0;
		overflow: hidden;
		align-self: end;
	}
	.seg {
		min-height: 2px;
		width: 100%;
	}
	.m {
		font-size: 0.65rem;
		text-align: center;
		color: var(--ink-muted);
		transform: rotate(-45deg);
		transform-origin: top center;
		height: 1.6rem;
	}
	.m.hidden {
		visibility: hidden;
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
