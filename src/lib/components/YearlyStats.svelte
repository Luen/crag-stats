<script lang="ts">
	import { onMount } from 'svelte';
	import type { HeatmapDay } from '#lib/types/dashboard';

	type YearRow = {
		year: number;
		ascents: number;
		sends: number;
		onsights: number;
		heightM: number;
		deltaAscents: number | null;
		deltaHeightM: number | null;
		deltaOnsights: number | null;
	};

	type Props = {
		years: YearRow[];
		/** Daily ascents for thin within-year cumulative lines (optional). */
		days?: HeatmapDay[];
		/** Dashboard links to `/activity` when that route exists; omit/null to skip. */
		titleHref?: string | null;
	};
	let { years, days = [], titleHref = null }: Props = $props();

	type Metric = 'ascents' | 'sends' | 'heightM';
	type ChartMode = 'year' | 'cumulative';

	const MODE_KEY = 'cs_yearly_chart';

	let metric = $state<Metric>('ascents');
	let chartMode = $state<ChartMode>('year');

	onMount(() => {
		try {
			if (localStorage.getItem(MODE_KEY) === 'cumulative') chartMode = 'cumulative';
		} catch {
			/* ignore */
		}
	});

	function setChartMode(next: ChartMode) {
		chartMode = next;
		try {
			localStorage.setItem(MODE_KEY, next);
		} catch {
			/* ignore */
		}
	}

	// Analytics may return either order; chart reads left→right oldest→newest.
	const chronological = $derived([...years].sort((a, b) => a.year - b.year));

	const values = $derived(
		chronological.map((row, i) => {
			const prev = i > 0 ? chronological[i - 1] : null;
			const value =
				metric === 'ascents' ? row.ascents : metric === 'sends' ? row.sends : row.heightM;
			let delta: number | null = null;
			if (metric === 'ascents') delta = row.deltaAscents;
			else if (metric === 'heightM') delta = row.deltaHeightM;
			else if (prev) delta = row.sends - prev.sends;
			return { year: row.year, value, delta };
		})
	);

	const series = $derived.by(() => {
		if (chartMode === 'year') return values;
		let sum = 0;
		return values.map((p) => {
			sum += p.value;
			return { ...p, value: sum, delta: p.value };
		});
	});

	const max = $derived(Math.max(1, ...series.map((v) => v.value)));
	/** Y-scale for thin within-year lines (each year starts at 0). */
	const maxYear = $derived(Math.max(1, ...values.map((v) => v.value)));

	const metricLabel = $derived(
		metric === 'ascents' ? 'Ascents' : metric === 'sends' ? 'Sends' : 'Height (m)'
	);

	const chartLabel = $derived(
		chartMode === 'cumulative' ? `Total ${metricLabel.toLowerCase()}` : metricLabel
	);

	function formatValue(v: number): string {
		if (metric === 'heightM') return `${Math.round(v)} m`;
		return String(Math.round(v));
	}

	function fmtDelta(n: number | null, suffix = ''): string {
		if (n == null) return '—';
		const sign = n > 0 ? '+' : '';
		const shown = metric === 'heightM' ? Math.round(n) : n;
		return `${sign}${shown}${suffix}`;
	}

	function deltaClass(n: number | null): string {
		if (n == null || n === 0) return 'flat';
		return n > 0 ? 'up' : 'down';
	}

	const deltaSuffix = $derived(metric === 'heightM' ? ' m' : '');

	function dayMetric(d: HeatmapDay): number {
		if (metric === 'sends') return d.sends;
		if (metric === 'heightM') return d.heightM;
		return d.count;
	}

	function dayOfYearFrac(iso: string): number {
		const y = Number(iso.slice(0, 4));
		const start = Date.UTC(y, 0, 1);
		const t = Date.UTC(
			Number(iso.slice(0, 4)),
			Number(iso.slice(5, 7)) - 1,
			Number(iso.slice(8, 10))
		);
		const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
		const daysInYear = leap ? 366 : 365;
		return Math.min(1, Math.max(0, (t - start) / (daysInYear * 86400000)));
	}

	/** SVG plot box for the cumulative line (viewBox coords). */
	const plot = { w: 1000, h: 220, padX: 28, padTop: 16, padBot: 8 };

	const linePoints = $derived.by(() => {
		const n = series.length;
		if (n === 0) return [] as { x: number; y: number; year: number; value: number }[];
		const innerW = plot.w - plot.padX * 2;
		const innerH = plot.h - plot.padTop - plot.padBot;
		return series.map((p, i) => {
			const x = n === 1 ? plot.w / 2 : plot.padX + (i / (n - 1)) * innerW;
			const y = plot.padTop + innerH * (1 - p.value / max);
			return { x, y, year: p.year, value: p.value };
		});
	});

	const polyline = $derived(linePoints.map((p) => `${p.x},${p.y}`).join(' '));

	/**
	 * Thin polylines: each year starts at 0 and rises by day for the selected metric.
	 * Drawn in the horizontal band for that year; y-scale is max single-year total.
	 */
	const yearPaths = $derived.by(() => {
		if (chartMode !== 'cumulative' || days.length === 0 || chronological.length === 0) {
			return [] as { year: number; points: string }[];
		}
		const n = chronological.length;
		const innerW = plot.w - plot.padX * 2;
		const innerH = plot.h - plot.padTop - plot.padBot;
		const xAt = (i: number) => (n === 1 ? plot.w / 2 : plot.padX + (i / (n - 1)) * innerW);
		const byYear = new Map<number, HeatmapDay[]>();
		for (const d of days) {
			const y = Number(d.date.slice(0, 4));
			if (!Number.isFinite(y)) continue;
			const list = byYear.get(y) ?? [];
			list.push(d);
			byYear.set(y, list);
		}

		return chronological.map((row, i) => {
			const x0 = i === 0 ? plot.padX : (xAt(i - 1) + xAt(i)) / 2;
			const x1 = i === n - 1 ? plot.w - plot.padX : (xAt(i) + xAt(i + 1)) / 2;
			const span = Math.max(1, x1 - x0);
			const yearDays = [...(byYear.get(row.year) ?? [])].sort((a, b) =>
				a.date.localeCompare(b.date)
			);
			const pts: { x: number; y: number }[] = [
				{ x: x0, y: plot.padTop + innerH } // year start at 0
			];
			let cum = 0;
			for (const d of yearDays) {
				cum += dayMetric(d);
				const frac = dayOfYearFrac(d.date);
				pts.push({
					x: x0 + frac * span,
					y: plot.padTop + innerH * (1 - cum / maxYear)
				});
			}
			// Hold flat to the end of the year band at the year's total.
			pts.push({
				x: x1,
				y: plot.padTop + innerH * (1 - (values[i]?.value ?? cum) / maxYear)
			});
			return {
				year: row.year,
				points: pts.map((p) => `${p.x},${p.y}`).join(' ')
			};
		});
	});
</script>

<article class="panel">
	<header class="head">
		<h2>
			{#if titleHref}
				<a href={titleHref}>Yearly stats</a>
			{:else}
				Yearly stats
			{/if}
		</h2>
		{#if years.length > 0}
			<div class="controls">
				<div class="toggles" role="group" aria-label="Chart mode">
					<button
						type="button"
						class={{ active: chartMode === 'year' }}
						onclick={() => setChartMode('year')}>Per year</button
					>
					<button
						type="button"
						class={{ active: chartMode === 'cumulative' }}
						onclick={() => setChartMode('cumulative')}>Cumulative</button
					>
				</div>
				<div class="toggles" role="group" aria-label="Metric">
					<button
						type="button"
						class={{ active: metric === 'ascents' }}
						onclick={() => (metric = 'ascents')}>Ascents</button
					>
					<button
						type="button"
						class={{ active: metric === 'sends' }}
						onclick={() => (metric = 'sends')}>Sends</button
					>
					<button
						type="button"
						class={{ active: metric === 'heightM' }}
						onclick={() => (metric = 'heightM')}>Height (m)</button
					>
				</div>
			</div>
		{/if}
	</header>

	{#if years.length === 0}
		<p class="empty">No yearly data yet.</p>
	{:else if chartMode === 'cumulative'}
		<div class="line-wrap">
			<svg
				class="line-chart"
				viewBox="0 0 {plot.w} {plot.h}"
				role="img"
				aria-label="{chartLabel} by year, cumulative, with within-year daily progress"
			>
				{#each yearPaths as yp (yp.year)}
					<polyline
						class="year-line"
						fill="none"
						points={yp.points}
						style="stroke: var(--accent)"
						stroke-width="1.25"
						stroke-linecap="round"
						stroke-linejoin="round"
						opacity="0.35"
					>
						<title>{yp.year} daily {metricLabel.toLowerCase()} (starts at 0)</title>
					</polyline>
				{/each}
				{#if linePoints.length > 1}
					<polyline
						class="line"
						fill="none"
						points={polyline}
						style="stroke: var(--accent)"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				{/if}
				{#each linePoints as p, i (p.year)}
					<a
						href={`/logbook?year=${p.year}`}
						aria-label="{p.year}: {formatValue(p.value)} {chartLabel}"
					>
						<title
							>{p.year}: {formatValue(p.value)}
							{chartLabel} ({fmtDelta(series[i]?.delta ?? null, deltaSuffix)} this year)</title
						>
						<circle class="dot" cx={p.x} cy={p.y} r="7" />
					</a>
				{/each}
			</svg>
			{#if yearPaths.length > 0}
				<p class="hint">Thin lines: each year from 0, rising day by day.</p>
			{/if}
			<div class="line-axis" style:--n={series.length}>
				{#each series as point (point.year)}
					<a class="axis-col" href={`/logbook?year=${point.year}`}>
						<span class="year-label">{point.year}</span>
						<span class="cum-val">{formatValue(point.value)}</span>
					</a>
				{/each}
			</div>
		</div>
	{:else}
		<div class="chart-scroll">
			<div class="chart" style:--n={series.length}>
				{#each series as point (point.year)}
					<a
						class="col"
						href={`/logbook?year=${point.year}`}
						title="{point.year}: {formatValue(point.value)} {metricLabel} ({fmtDelta(
							point.delta,
							deltaSuffix
						)} YoY)"
					>
						<div class="stack">
							<div class="bar" style:height="{(point.value / max) * 100}%"></div>
						</div>
						<span class="year-label">{point.year}</span>
						<span class={['delta', deltaClass(point.delta)]}
							>{fmtDelta(point.delta, deltaSuffix)}</span
						>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	{#if years.length > 0}
		<details class="yoy">
			<summary>Year-over-year table</summary>
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Year</th>
							<th>Ascents</th>
							<th>YoY</th>
							<th>Sends</th>
							<th>Onsights</th>
							<th>YoY</th>
							<th>Height</th>
							<th>YoY</th>
						</tr>
					</thead>
					<tbody>
						{#each years as row (row.year)}
							<tr>
								<td>
									<a href={`/logbook?year=${row.year}`}>{row.year}</a>
								</td>
								<td>{row.ascents}</td>
								<td class={deltaClass(row.deltaAscents)}>{fmtDelta(row.deltaAscents)}</td>
								<td>{row.sends}</td>
								<td>{row.onsights}</td>
								<td class={deltaClass(row.deltaOnsights)}>{fmtDelta(row.deltaOnsights)}</td>
								<td>{Math.round(row.heightM)} m</td>
								<td class={deltaClass(row.deltaHeightM)}>{fmtDelta(row.deltaHeightM, ' m')}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</details>
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
		gap: 0.65rem 1rem;
		margin-bottom: 0.85rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	h2 a {
		color: inherit;
		text-decoration: none;
	}
	h2 a:hover {
		color: var(--accent);
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem 0.85rem;
		align-items: center;
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
		color: var(--on-accent);
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
		grid-template-columns: repeat(var(--n), minmax(2.4rem, 1fr));
		align-items: end;
		gap: 0.45rem;
		height: 180px;
		min-width: max(100%, calc(var(--n) * 2.75rem));
	}
	.col {
		display: grid;
		grid-template-rows: 1fr auto auto;
		height: 100%;
		gap: 0.2rem;
		text-decoration: none;
		color: inherit;
		min-width: 2.4rem;
	}
	.stack {
		position: relative;
		height: 100%;
	}
	.bar {
		position: absolute;
		left: 18%;
		right: 18%;
		bottom: 0;
		border-radius: 4px 4px 0 0;
		background: var(--accent);
		min-height: 2px;
	}
	.line-wrap {
		max-width: 100%;
		min-width: 0;
	}
	.line-chart {
		display: block;
		width: 100%;
		height: auto;
		max-height: 200px;
	}
	.hint {
		margin: 0.35rem 0 0;
		font-size: 0.72rem;
		color: var(--ink-muted);
	}
	.line-chart .dot {
		fill: var(--accent);
		stroke: var(--paper);
		stroke-width: 2;
	}
	.line-chart a:hover .dot {
		fill: var(--brand, var(--accent));
	}
	.line-axis {
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		gap: 0.25rem;
		margin-top: 0.35rem;
	}
	.axis-col {
		display: grid;
		gap: 0.15rem;
		justify-items: center;
		text-decoration: none;
		color: inherit;
		min-width: 0;
	}
	.year-label {
		justify-self: center;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--ink);
		line-height: 1.1;
	}
	.cum-val {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--ink-muted);
		line-height: 1.1;
		text-align: center;
	}
	.delta {
		justify-self: center;
		font-size: 0.72rem;
		font-weight: 600;
		line-height: 1.1;
	}
	.up {
		color: var(--accent);
	}
	.down {
		color: var(--danger);
	}
	.flat {
		color: var(--ink-muted);
	}
	.yoy {
		margin-top: 0.85rem;
		border-top: 1px solid var(--line);
		padding-top: 0.55rem;
	}
	.yoy summary {
		cursor: pointer;
		font-size: 0.85rem;
		color: var(--ink-muted);
		font-weight: 600;
	}
	.table-wrap {
		overflow-x: auto;
		max-width: 100%;
		margin-top: 0.55rem;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
	}
	table {
		width: 100%;
		min-width: 36rem;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.45rem 0.55rem;
		border-bottom: 1px solid var(--line);
		white-space: nowrap;
	}
	th {
		color: var(--ink-muted);
		font-weight: 600;
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}
	td a {
		color: var(--ink);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.empty {
		color: var(--ink-muted);
		margin: 0;
	}
</style>
