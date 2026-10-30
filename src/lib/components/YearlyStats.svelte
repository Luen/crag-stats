<script lang="ts">
	import { onMount } from 'svelte';
	import {
		EMPTY_CARD_PREFERENCES,
		migrateCardPreference,
		saveCardPreference,
		type CardPreferences
	} from '#lib/cardPreferences';
	import type { HeatmapDay } from '#lib/types/dashboard';
	import { yearLineFractions } from '#lib/yearlyStatsLines';

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
		preferences?: CardPreferences;
		years: YearRow[];
		/** Daily ascents for thin within-year cumulative lines (optional). */
		days?: HeatmapDay[];
		/** Dashboard links to `/activity` when that route exists; omit/null to skip. */
		titleHref?: string | null;
	};
	let {
		preferences = EMPTY_CARD_PREFERENCES,
		years,
		days = [],
		titleHref = null
	}: Props = $props();

	type Metric = 'ascents' | 'sends' | 'heightM';
	type ChartMode = 'year' | 'cumulative';

	const MODE_KEY = 'cs_yearly_chart';

	/** Distinct strokes for thin year overlays (readable on light + dark). */
	const YEAR_COLORS = [
		'#1d6fa5',
		'#2a9d8f',
		'#a12b4a',
		'#7b5ea7',
		'#e07a2f',
		'#0f766e',
		'#c9a227',
		'#576071',
		'#9a3412',
		'#4c6ef5',
		'#0891b2',
		'#be123c'
	] as const;

	let metric = $state<Metric>('ascents');
	let chartMode = $derived<ChartMode>(preferences.cs_yearly_chart ?? 'year');
	let hover = $state<{
		year: number;
		date: string;
		value: number;
		x: number;
		y: number;
		color: string;
	} | null>(null);

	let ready = $state(false);
	onMount(() => {
		chartMode = migrateCardPreference('cs_yearly_chart', preferences.cs_yearly_chart);
		ready = true;
	});

	function setChartMode(next: ChartMode) {
		chartMode = next;
		hover = null;
		saveCardPreference(MODE_KEY, next);
	}

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

	function colorForYear(index: number): string {
		return YEAR_COLORS[index % YEAR_COLORS.length]!;
	}

	const plot = { w: 1000, h: 240, padX: 36, padTop: 18, padBot: 28 };

	const monthTicks = $derived.by(() => {
		const labels = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		];
		const innerW = plot.w - plot.padX * 2;
		return labels.map((label, i) => ({
			label,
			x: plot.padX + (i / 12) * innerW
		}));
	});

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

	type YearLine = {
		year: number;
		color: string;
		points: string;
		dots: { date: string; value: number; x: number; y: number }[];
	};

	/**
	 * Thin coloured overlays: shared day-of-year X across the full plot width;
	 * each year starts at 0. Y uses max single-year total (independent of career scale).
	 */
	const yearLines = $derived.by(() => {
		if (chartMode !== 'cumulative' || days.length === 0 || chronological.length === 0) {
			return [] as YearLine[];
		}
		const innerW = plot.w - plot.padX * 2;
		const innerH = plot.h - plot.padTop - plot.padBot;
		const byYear: Record<number, HeatmapDay[]> = {};
		for (const d of days) {
			const y = Number(d.date.slice(0, 4));
			if (!Number.isFinite(y)) continue;
			(byYear[y] ??= []).push(d);
		}

		return chronological.map((row, i) => {
			const yearDays = [...(byYear[row.year] ?? [])].sort((a, b) => a.date.localeCompare(b.date));
			const climbDates = yearDays.map((d) => d.date);
			const fracs = yearLineFractions(climbDates, row.year);
			const dots: YearLine['dots'] = [];
			const pts: string[] = [];
			const y0 = plot.padTop + innerH;
			let cum = 0;
			let lastY = y0;
			for (let fi = 0; fi < fracs.length; fi++) {
				const x = plot.padX + fracs[fi]! * innerW;
				if (fi === 0) {
					pts.push(`${x},${y0}`);
					continue;
				}
				const climbIdx = fi - 1;
				if (climbIdx < yearDays.length) {
					const d = yearDays[climbIdx]!;
					cum += dayMetric(d);
					const y = plot.padTop + innerH * (1 - cum / maxYear);
					lastY = y;
					pts.push(`${x},${y}`);
					dots.push({ date: d.date, value: cum, x, y });
				} else {
					// Flat tip to Dec from yearLineFractions (no invented climbs).
					pts.push(`${x},${lastY}`);
				}
			}
			return {
				year: row.year,
				color: colorForYear(i),
				points: pts.join(' '),
				dots
			};
		});
	});

	function onDotEnter(
		year: number,
		date: string,
		value: number,
		x: number,
		y: number,
		color: string
	) {
		hover = { year, date, value, x, y, color };
	}

	function onDotLeave() {
		hover = null;
	}
</script>

<article
	class={['panel', { 'card-preference-pending': !ready && !(preferences.cs_yearly_chart != null) }]}
>
	<header class="head">
		<div class="titles">
			<h2>
				{#if titleHref}
					<a href={titleHref}>Yearly stats</a>
				{:else}
					Yearly stats
				{/if}
			</h2>
			<a class="how" href="/docs/yearly-stats">How it works</a>
		</div>
		{#if years.length > 0}
			<div class="controls">
				<div class="toggles" role="group" aria-label="Chart mode">
					<button
						type="button"
						class={{ active: chartMode === 'year' }}
						aria-pressed={chartMode === 'year'}
						onclick={() => setChartMode('year')}>Per year</button
					>
					<button
						type="button"
						class={{ active: chartMode === 'cumulative' }}
						aria-pressed={chartMode === 'cumulative'}
						onclick={() => setChartMode('cumulative')}>Cumulative</button
					>
				</div>
				<div class="toggles" role="group" aria-label="Metric">
					<button
						type="button"
						class={{ active: metric === 'ascents' }}
						aria-pressed={metric === 'ascents'}
						onclick={() => (metric = 'ascents')}>Ascents</button
					>
					<button
						type="button"
						class={{ active: metric === 'sends' }}
						aria-pressed={metric === 'sends'}
						onclick={() => (metric = 'sends')}>Sends</button
					>
					<button
						type="button"
						class={{ active: metric === 'heightM' }}
						aria-pressed={metric === 'heightM'}
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
				role="group"
				aria-label="{chartLabel} by year, with within-year daily progress overlaid"
			>
				{#each monthTicks as tick (tick.label)}
					<line
						class="grid"
						x1={tick.x}
						x2={tick.x}
						y1={plot.padTop}
						y2={plot.h - plot.padBot}
						style="stroke: color-mix(in srgb, var(--ink) 12%, transparent)"
					/>
					<text class="month-tick" x={tick.x} y={plot.h - 8} style="fill: var(--ink-muted)"
						>{tick.label}</text
					>
				{/each}
				{#each yearLines as yl (yl.year)}
					<polyline
						class="year-line"
						fill="none"
						points={yl.points}
						style="stroke: {yl.color}"
						stroke-width="1.25"
						stroke-linecap="round"
						stroke-linejoin="round"
						opacity="0.75"
					/>
					{#each yl.dots as dot (dot.date)}
						<a
							href="/logbook?day={encodeURIComponent(dot.date)}"
							aria-label="{dot.date}: {formatValue(dot.value)} {metricLabel} — open logbook"
							onmouseenter={() => onDotEnter(yl.year, dot.date, dot.value, dot.x, dot.y, yl.color)}
							onmouseleave={onDotLeave}
						>
							<title>{dot.date}: {formatValue(dot.value)} {metricLabel}</title>
							<circle class="hit" cx={dot.x} cy={dot.y} r="8" fill="transparent" />
						</a>
					{/each}
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
						<circle
							class="dot"
							cx={p.x}
							cy={p.y}
							r="7"
							style="fill: var(--accent); stroke: var(--paper)"
							stroke-width="2"
						/>
					</a>
				{/each}
				{#if hover}
					<g pointer-events="none">
						<line
							x1={hover.x}
							x2={hover.x}
							y1={plot.padTop}
							y2={plot.h - plot.padBot}
							style="stroke: {hover.color}"
							stroke-width="1"
							opacity="0.45"
							stroke-dasharray="4 3"
						/>
						<circle
							cx={hover.x}
							cy={hover.y}
							r="5"
							style="fill: {hover.color}; stroke: var(--paper)"
							stroke-width="2"
						/>
					</g>
				{/if}
			</svg>
			{#if hover}
				<p class="hover-label" style:color={hover.color}>
					{hover.date} · {hover.year} · {formatValue(hover.value)}
					{metricLabel.toLowerCase()}
				</p>
			{:else if yearLines.length > 0}
				<p class="hint">
					Thick orange: career total. Thin lines: each year from 0 across the calendar — click a day
					for the logbook; lines stay flat after the last climb of the year.
				</p>
			{/if}
			{#if yearLines.length > 0}
				<ul class="legend">
					{#each yearLines as yl (yl.year)}
						<li>
							<a href={`/logbook?year=${yl.year}`}>
								<i style:background={yl.color}></i>
								{yl.year}
							</a>
						</li>
					{/each}
					<li>
						<span class="career-swatch">
							<i style:background="var(--accent)"></i>
							Career
						</span>
					</li>
				</ul>
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
	.titles {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.55rem 0.85rem;
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
	.how {
		font-size: 0.8rem;
		font-weight: 600;
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
		max-height: 240px;
	}
	.month-tick {
		font-size: 11px;
		text-anchor: start;
	}
	.hit {
		cursor: pointer;
		outline: none;
	}
	.line-chart a:focus-visible .hit {
		stroke: var(--accent);
		stroke-width: 2;
	}
	.line-chart a:focus-visible .dot {
		stroke: var(--accent);
		stroke-width: 3;
	}
	.hint,
	.hover-label {
		margin: 0.4rem 0 0;
		font-size: 0.78rem;
		font-weight: 600;
		min-height: 1.2em;
	}
	.hint {
		color: var(--ink-muted);
		font-weight: 500;
	}
	.legend {
		list-style: none;
		margin: 0.65rem 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.75rem;
	}
	.legend a,
	.career-swatch {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--ink-muted);
		text-decoration: none;
	}
	.legend a:hover {
		color: var(--ink);
	}
	.legend i {
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 999px;
		display: inline-block;
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
