<script lang="ts">
	import { browser } from '$app/environment';
	import { GRADE_BANDS } from '#lib/grades/bands';
	import type { HeatmapDay } from '#lib/types/dashboard';

	type Props = { data: HeatmapDay[] };
	let { data }: Props = $props();

	type Mode = 'intensity' | 'grade';
	const MODE_KEY = 'cs_heatmap_mode';

	function readStoredMode(): Mode {
		if (!browser) return 'intensity';
		try {
			const v = localStorage.getItem(MODE_KEY);
			return v === 'grade' ? 'grade' : 'intensity';
		} catch {
			return 'intensity';
		}
	}

	let mode = $state<Mode>(readStoredMode());

	function setMode(next: Mode) {
		mode = next;
		if (!browser) return;
		try {
			localStorage.setItem(MODE_KEY, next);
		} catch {
			/* ignore quota / private mode */
		}
	}

	const years = $derived(
		[...new Set(data.map((d) => d.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a))
	);
	let selectedYear = $state<string | null>(null);
	const year = $derived(
		selectedYear && years.includes(selectedYear) ? selectedYear : (years[0] ?? '')
	);

	const byDate = $derived(new Map(data.map((d) => [d.date, d])));

	type Cell = {
		date: string;
		count: number;
		sends: number;
		maxBand: number | null;
		dow: number;
	};

	const weeks = $derived.by(() => {
		if (!year) return [] as Cell[][];
		const start = new Date(`${year}-01-01T12:00:00`);
		const end = new Date(`${year}-12-31T12:00:00`);
		// Align to Monday-start week columns like GitHub (Sun=0 → shift)
		const cells: Cell[] = [];
		for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
			const d = new Date(t);
			const iso = d.toISOString().slice(0, 10);
			const hit = byDate.get(iso);
			cells.push({
				date: iso,
				count: hit?.count ?? 0,
				sends: hit?.sends ?? 0,
				maxBand: hit?.maxBand ?? null,
				dow: d.getDay()
			});
		}
		const cols: Cell[][] = [];
		let col: Cell[] = [];
		// pad first column
		const firstDow = cells[0]?.dow ?? 0;
		for (let i = 0; i < firstDow; i++) {
			col.push({ date: '', count: 0, sends: 0, maxBand: null, dow: i });
		}
		for (const cell of cells) {
			if (col.length === 7) {
				cols.push(col);
				col = [];
			}
			col.push(cell);
		}
		if (col.length) {
			while (col.length < 7)
				col.push({ date: '', count: 0, sends: 0, maxBand: null, dow: col.length });
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

	const bandClass = (band: number | null, count: number): string => {
		if (count <= 0) return 'l0';
		if (band == null) return 'attempt';
		return `b${band}`;
	};

	function cellTitle(cell: Cell): string {
		const base = `${cell.date}: ${cell.count} ascent${cell.count === 1 ? '' : 's'} (${cell.sends} send${cell.sends === 1 ? '' : 's'})`;
		if (mode !== 'grade' || cell.maxBand == null) return base;
		const name = GRADE_BANDS.find((b) => b.id === cell.maxBand)?.name ?? `band ${cell.maxBand}`;
		return `${base} · hardest send ${name}`;
	}
</script>

<article class="panel">
	<header>
		<h2>Ascent calendar</h2>
		<div class="controls">
			{#if years.length > 0}
				<div class="toggles" role="group" aria-label="Colour mode">
					<button
						type="button"
						class={{ active: mode === 'intensity' }}
						onclick={() => setMode('intensity')}>Intensity</button
					>
					<button
						type="button"
						class={{ active: mode === 'grade' }}
						onclick={() => setMode('grade')}>Grade</button
					>
				</div>
			{/if}
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
		</div>
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
									class={[
										'cell',
										mode === 'intensity'
											? `l${level(cell.count)}`
											: bandClass(cell.maxBand, cell.count)
									]}
									href="/logbook?day={encodeURIComponent(cell.date)}"
									title={cellTitle(cell)}
								></a>
							{:else}
								<span class="cell empty"></span>
							{/if}
						{/each}
					</div>
				{/each}
			</div>
		</div>
		{#if mode === 'intensity'}
			<div class="legend">
				<span>Less</span>
				<i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i>
				<span>More</span>
			</div>
		{:else}
			<div class="legend grade">
				<span>Attempts</span>
				<i class="attempt"></i>
				{#each GRADE_BANDS as band (band.id)}
					<i class="b{band.id}" title={band.name}></i>
					<span class="band-name">{band.name}</span>
				{/each}
			</div>
		{/if}
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
		flex-wrap: wrap;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		flex-wrap: wrap;
		margin-left: auto;
	}
	.toggles {
		display: flex;
		gap: 0.3rem;
	}
	.toggles button {
		font: inherit;
		font-size: 0.82rem;
		padding: 0.28rem 0.55rem;
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		background: var(--paper);
		color: var(--ink-muted);
		cursor: pointer;
	}
	.toggles button.active {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--on-accent);
	}
	select {
		font: inherit;
		padding: 0.25rem 0.45rem;
		border-radius: 0.4rem;
		border: 1px solid var(--line);
		background: var(--paper);
		color: var(--ink);
	}
	.year,
	.empty {
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
	.scroll {
		max-width: 100%;
		min-width: 0;
	}
	.grid {
		display: grid;
		grid-auto-flow: column;
		grid-template-rows: repeat(7, minmax(0, 1fr));
		grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
		gap: clamp(0.12rem, 0.35vw, 0.22rem);
		width: 100%;
		/* Keep cells roughly square while filling the panel (Dreeve-style). */
		aspect-ratio: var(--cols) / 7;
		max-height: 11rem;
	}
	.week {
		display: contents;
	}
	.cell {
		width: 100%;
		height: 100%;
		min-width: 0;
		min-height: 0;
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
	.attempt {
		background: color-mix(in srgb, var(--ink-muted) 35%, var(--surface-3));
	}
	.b1 {
		background: var(--band-beginner);
	}
	.b2 {
		background: var(--band-intermediate);
	}
	.b3 {
		background: var(--band-experienced);
	}
	.b4 {
		background: var(--band-expert);
	}
	.b5 {
		background: var(--band-elite);
	}
	.legend {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 0.65rem;
		font-size: 0.72rem;
		color: var(--ink-muted);
		flex-wrap: wrap;
	}
	.legend.grade {
		gap: 0.35rem 0.45rem;
	}
	.legend .band-name {
		margin-right: 0.15rem;
	}
	.legend i {
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 2px;
		display: inline-block;
		flex-shrink: 0;
	}
</style>
