<script lang="ts">
	import type { HeatmapDay } from '#lib/types/dashboard';

	type Props = { data: HeatmapDay[] };
	let { data }: Props = $props();

	const years = $derived(
		[...new Set(data.map((d) => d.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a))
	);
	let selectedYear = $state<string | null>(null);
	const year = $derived(
		selectedYear && years.includes(selectedYear) ? selectedYear : (years[0] ?? '')
	);

	const byDate = $derived(new Map(data.map((d) => [d.date, d])));

	const weeks = $derived.by(() => {
		if (!year) return [] as { date: string; count: number; sends: number; dow: number }[][];
		const start = new Date(`${year}-01-01T12:00:00`);
		const end = new Date(`${year}-12-31T12:00:00`);
		// Align to Monday-start week columns like GitHub (Sun=0 → shift)
		const cells: { date: string; count: number; sends: number; dow: number }[] = [];
		for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
			const d = new Date(t);
			const iso = d.toISOString().slice(0, 10);
			const hit = byDate.get(iso);
			cells.push({
				date: iso,
				count: hit?.count ?? 0,
				sends: hit?.sends ?? 0,
				dow: d.getDay()
			});
		}
		const cols: (typeof cells)[] = [];
		let col: typeof cells = [];
		// pad first column
		const firstDow = cells[0]?.dow ?? 0;
		for (let i = 0; i < firstDow; i++) {
			col.push({ date: '', count: 0, sends: 0, dow: i });
		}
		for (const cell of cells) {
			if (col.length === 7) {
				cols.push(col);
				col = [];
			}
			col.push(cell);
		}
		if (col.length) {
			while (col.length < 7) col.push({ date: '', count: 0, sends: 0, dow: col.length });
			cols.push(col);
		}
		return cols;
	});

	const maxCount = $derived(Math.max(1, ...weeks.flat().map((c) => c.count)));

	function level(count: number): number {
		if (count <= 0) return 0;
		const r = count / maxCount;
		if (r < 0.25) return 1;
		if (r < 0.5) return 2;
		if (r < 0.75) return 3;
		return 4;
	}
</script>

<article class="panel">
	<header>
		<h2>Ascent calendar</h2>
		{#if years.length > 1}
			<select
				value={year}
				aria-label="Heatmap year"
				onchange={(e) => {
					selectedYear = e.currentTarget.value;
				}}
			>
				{#each years as y (y)}
					<option value={y}>{y}</option>
				{/each}
			</select>
		{:else if year}
			<span class="year">{year}</span>
		{/if}
	</header>
	{#if !weeks.length}
		<p class="empty">No dated ascents yet</p>
	{:else}
		<div class="scroll">
			<div class="grid" style:--cols={weeks.length}>
				{#each weeks as col, wi (wi)}
					<div class="week">
						{#each col as cell, di (di)}
							{#if cell.date}
								<a
									class="cell l{level(cell.count)}"
									href="/logbook?day={encodeURIComponent(cell.date)}"
									title="{cell.date}: {cell.count} ascent{cell.count === 1
										? ''
										: 's'} ({cell.sends} send{cell.sends === 1 ? '' : 's'})"
								></a>
							{:else}
								<span class="cell empty"></span>
							{/if}
						{/each}
					</div>
				{/each}
			</div>
		</div>
		<p class="swipe-hint" aria-hidden="true">swipe →</p>
		<div class="legend">
			<span>Less</span>
			<i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i>
			<span>More</span>
		</div>
	{/if}
</article>

<style>
	.panel {
		padding: 1rem 1.15rem;
		border-radius: 1rem;
		max-width: 100%;
		min-width: 0;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	select {
		font: inherit;
		padding: 0.25rem 0.45rem;
		border-radius: 0.4rem;
		border: 1px solid var(--line);
		background: var(--paper);
	}
	.year,
	.empty {
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
	.scroll {
		overflow-x: auto;
		max-width: 100%;
		min-width: 0;
		padding-bottom: 0.35rem;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
	}
	.scroll::-webkit-scrollbar {
		height: 6px;
	}
	.scroll::-webkit-scrollbar-thumb {
		background: color-mix(in srgb, var(--ink-muted) 45%, transparent);
		border-radius: 999px;
	}
	.grid {
		display: grid;
		grid-auto-flow: column;
		grid-template-rows: repeat(7, 0.72rem);
		grid-auto-columns: 0.72rem;
		gap: 0.18rem;
		width: max-content;
	}
	.week {
		display: contents;
	}
	.cell {
		width: 0.72rem;
		height: 0.72rem;
		border-radius: 2px;
		display: block;
	}
	a.cell {
		text-decoration: none;
	}
	a.cell:hover {
		outline: 1px solid var(--ink);
		outline-offset: 1px;
	}
	.l0,
	.cell.empty {
		background: var(--surface-3);
	}
	.l1 {
		background: var(--heat-1);
	}
	.l2 {
		background: var(--heat-2);
	}
	.l3 {
		background: var(--heat-3);
	}
	.l4 {
		background: var(--heat-4);
	}
	.swipe-hint {
		display: none;
		margin: 0.2rem 0 0;
		font-size: 0.72rem;
		color: var(--ink-muted);
	}
	.legend {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 0.65rem;
		font-size: 0.72rem;
		color: var(--ink-muted);
	}
	.legend i {
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 2px;
		display: inline-block;
	}
	@media (max-width: 640px) {
		.grid {
			grid-template-rows: repeat(7, 0.58rem);
			grid-auto-columns: 0.58rem;
			gap: 0.14rem;
		}
		.cell {
			width: 0.58rem;
			height: 0.58rem;
		}
		.swipe-hint {
			display: block;
		}
	}
</style>
