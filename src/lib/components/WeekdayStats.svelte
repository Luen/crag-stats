<script lang="ts">
	import { onMount } from 'svelte';
	import { DEFAULT_DATE_DISPLAY, formatNumber, type DateDisplay } from '#lib/dates';
	import { STYLE_COLORS } from '#lib/ticks';
	import {
		pickMostActive,
		WEEKDAY_STYLE_KEYS,
		type WeekdayMetric,
		type WeekdayStatsView,
		type WeekdayStyleKey
	} from '#lib/weekdayStats';

	type Range = 'all' | 'last12';

	type Props = {
		data: WeekdayStatsView;
		dateDisplay?: DateDisplay;
	};

	let { data, dateDisplay = DEFAULT_DATE_DISPLAY }: Props = $props();

	const RANGE_KEY = 'cs_weekday_range';
	const METRIC_KEY = 'cs_weekday_metric';
	const STYLE_KEY = 'cs_weekday_style';

	/** Stable weekday colours (readable on light + dark paper). */
	const DAY_COLORS: Record<number, string> = {
		1: '#1d6fa5',
		2: '#2a9d8f',
		3: '#7b5ea7',
		4: '#e07a2f',
		5: '#0f766e',
		6: '#c2410c',
		0: '#576071'
	};

	let range = $state<Range>('all');
	let metric = $state<WeekdayMetric>('sessions');
	let style = $state<WeekdayStyleKey>('all');
	let hoverWeekday = $state<number | null>(null);

	onMount(() => {
		try {
			const r = localStorage.getItem(RANGE_KEY);
			if (r === 'last12' || r === 'all') range = r;
			const m = localStorage.getItem(METRIC_KEY);
			if (m === 'sessions' || m === 'ascents') metric = m;
			const s = localStorage.getItem(STYLE_KEY);
			if (s === 'all' || s === 'sport' || s === 'trad' || s === 'boulder') style = s;
		} catch {
			/* ignore */
		}
	});

	function persist(key: string, value: string) {
		try {
			localStorage.setItem(key, value);
		} catch {
			/* ignore */
		}
	}

	function setRange(next: Range) {
		range = next;
		persist(RANGE_KEY, next);
	}

	function setMetric(next: WeekdayMetric) {
		metric = next;
		persist(METRIC_KEY, next);
	}

	function setStyle(next: WeekdayStyleKey) {
		style = next;
		persist(STYLE_KEY, next);
	}

	const slice = $derived((range === 'last12' ? data.last12Weeks : data.allTime)[style]);
	const most = $derived(pickMostActive(slice.rows, metric));
	const total = $derived(metric === 'sessions' ? slice.totalSessions : slice.totalAscents);
	const unit = $derived(metric === 'sessions' ? 'session' : 'ascent');
	const unitPlural = $derived(`${unit}s`);

	const styleLabel = $derived(
		style === 'all' ? '' : style === 'sport' ? 'Sport' : style === 'trad' ? 'Trad' : 'Boulder'
	);

	const size = 220;
	const cx = size / 2;
	const cy = size / 2;
	const outerR = 96;
	const innerR = 54;

	type PieSlice = {
		weekday: number;
		label: string;
		value: number;
		pct: number;
		color: string;
		d: string;
	};

	function donutPath(start: number, end: number): string {
		const x0 = cx + outerR * Math.cos(start);
		const y0 = cy + outerR * Math.sin(start);
		const x1 = cx + outerR * Math.cos(end);
		const y1 = cy + outerR * Math.sin(end);
		const xi0 = cx + innerR * Math.cos(end);
		const yi0 = cy + innerR * Math.sin(end);
		const xi1 = cx + innerR * Math.cos(start);
		const yi1 = cy + innerR * Math.sin(start);
		const large = end - start > Math.PI ? 1 : 0;
		return [
			`M ${x0} ${y0}`,
			`A ${outerR} ${outerR} 0 ${large} 1 ${x1} ${y1}`,
			`L ${xi0} ${yi0}`,
			`A ${innerR} ${innerR} 0 ${large} 0 ${xi1} ${yi1}`,
			'Z'
		].join(' ');
	}

	const pieSlices = $derived.by(() => {
		const active = slice.rows
			.map((r) => ({
				weekday: r.weekday,
				label: r.label,
				value: metric === 'sessions' ? r.sessions : r.ascents,
				color: DAY_COLORS[r.weekday] ?? 'var(--accent)'
			}))
			.filter((r) => r.value > 0);
		const sum = active.reduce((s, r) => s + r.value, 0);
		if (sum <= 0) return [] as PieSlice[];

		// Full circle for a single weekday.
		if (active.length === 1) {
			const only = active[0]!;
			return [
				{
					...only,
					pct: 100,
					d: donutPath(-Math.PI / 2, -Math.PI / 2 + Math.PI * 2 - 1e-6)
				}
			];
		}

		let angle = -Math.PI / 2;
		const out: PieSlice[] = [];
		for (const row of active) {
			const sweep = (row.value / sum) * Math.PI * 2;
			const start = angle;
			const end = angle + sweep;
			out.push({
				...row,
				pct: Math.round((row.value / sum) * 1000) / 10,
				d: donutPath(start, end)
			});
			angle = end;
		}
		return out;
	});

	const styleChipColor = (key: WeekdayStyleKey): string | undefined => {
		if (key === 'sport') return STYLE_COLORS.Sport;
		if (key === 'trad') return STYLE_COLORS.Trad;
		if (key === 'boulder') return STYLE_COLORS.Boulder;
		return undefined;
	};
</script>

<article class="panel">
	<header>
		<div class="titles">
			<h2>Weekday</h2>
			<a class="how" href="/docs/weekday">How it works</a>
		</div>
		<div class="controls">
			<div class="toggles" role="group" aria-label="Weekday range">
				<button
					type="button"
					class={{ active: range === 'all' }}
					aria-pressed={range === 'all'}
					onclick={() => setRange('all')}>All time</button
				>
				<button
					type="button"
					class={{ active: range === 'last12' }}
					aria-pressed={range === 'last12'}
					onclick={() => setRange('last12')}>Last 12 weeks</button
				>
			</div>
			<div class="toggles" role="group" aria-label="Weekday metric">
				<button
					type="button"
					class={{ active: metric === 'sessions' }}
					aria-pressed={metric === 'sessions'}
					onclick={() => setMetric('sessions')}>Sessions</button
				>
				<button
					type="button"
					class={{ active: metric === 'ascents' }}
					aria-pressed={metric === 'ascents'}
					onclick={() => setMetric('ascents')}>Ascents</button
				>
			</div>
			<div class="toggles" role="group" aria-label="Climbing style">
				{#each WEEKDAY_STYLE_KEYS as key (key)}
					{@const chip = styleChipColor(key)}
					<button
						type="button"
						class={{ active: style === key }}
						aria-pressed={style === key}
						style:--chip={chip ?? 'var(--accent)'}
						onclick={() => setStyle(key)}
						>{key === 'all'
							? 'All'
							: key === 'sport'
								? 'Sport'
								: key === 'trad'
									? 'Trad'
									: 'Boulder'}</button
					>
				{/each}
			</div>
		</div>
	</header>

	{#if total === 0}
		<p class="empty">
			{range === 'last12'
				? `No ${styleLabel ? styleLabel.toLowerCase() + ' ' : ''}${unitPlural} in the last 12 weeks.`
				: `No dated ${styleLabel ? styleLabel.toLowerCase() + ' ' : ''}${unitPlural} yet.`}
		</p>
	{:else}
		{#if most}
			<p class="lead">
				Your most active day is <strong>{most.label}</strong>
				({formatNumber(most.value, dateDisplay)}
				{most.value === 1 ? unit : unitPlural}{styleLabel ? ` · ${styleLabel}` : ''}).
			</p>
		{/if}

		<div class="chart">
			<svg
				class="pie"
				viewBox="0 0 {size} {size}"
				role="img"
				aria-label="Weekday {unitPlural} pie chart"
			>
				{#each pieSlices as s (s.weekday)}
					<path
						class="slice"
						class:dim={hoverWeekday != null && hoverWeekday !== s.weekday}
						class:hot={hoverWeekday === s.weekday || most?.weekday === s.weekday}
						d={s.d}
						style="fill: {s.color}"
						role="img"
						aria-label="{s.label}: {formatNumber(s.value, dateDisplay)} {s.value === 1
							? unit
							: unitPlural} ({s.pct}%)"
						onmouseenter={() => (hoverWeekday = s.weekday)}
						onmouseleave={() => (hoverWeekday = null)}
					>
						<title
							>{s.label}: {formatNumber(s.value, dateDisplay)}
							{s.value === 1 ? unit : unitPlural} ({s.pct}%)</title
						>
					</path>
				{/each}
				<circle class="hole" {cx} {cy} r={innerR - 1} />
				{#if most}
					<text class="center-day" x={cx} y={cy - 6} style="fill: var(--ink)">{most.label}</text>
					<text class="center-meta" x={cx} y={cy + 14} style="fill: var(--ink-muted)"
						>{formatNumber(most.value, dateDisplay)}
						{most.value === 1 ? unit : unitPlural}</text
					>
				{/if}
			</svg>

			<ul class="legend">
				{#each slice.rows as row (row.weekday)}
					{@const value = metric === 'sessions' ? row.sessions : row.ascents}
					{@const pct = total > 0 ? Math.round((value / total) * 1000) / 10 : 0}
					<li
						class:zero={value === 0}
						class:hot={hoverWeekday === row.weekday || most?.weekday === row.weekday}
						onmouseenter={() => (hoverWeekday = value > 0 ? row.weekday : null)}
						onmouseleave={() => (hoverWeekday = null)}
					>
						<i style:background={DAY_COLORS[row.weekday]}></i>
						<span class="lab">{row.label}</span>
						<span class="val"
							>{formatNumber(value, dateDisplay)}{#if value > 0}
								<span class="pct"> · {pct}%</span>{/if}</span
						>
					</li>
				{/each}
			</ul>
		</div>

		<p class="hint">
			{#if metric === 'sessions'}
				A session is a calendar day with at least one{styleLabel
					? ` ${styleLabel.toLowerCase()}`
					: ''} ascent
			{:else}
				Slices count every{styleLabel ? ` ${styleLabel.toLowerCase()}` : ''} logged ascent
			{/if}
			· {formatNumber(total, dateDisplay)}
			{total === 1 ? unit : unitPlural} in this range.
		</p>
	{/if}
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.65rem 1rem;
		margin-bottom: 0.75rem;
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
	.how {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--accent);
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem 0.75rem;
		justify-content: flex-start;
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
		background: var(--chip, var(--accent));
		border-color: var(--chip, var(--accent));
		/* Dark accent is lighter orange — white fails AA; --on-accent tracks the theme. */
		color: var(--on-accent);
	}
	.lead {
		margin: 0 0 0.85rem;
		font-size: 0.92rem;
		color: var(--ink-muted);
	}
	.lead strong {
		color: var(--ink);
		font-weight: 700;
	}
	.chart {
		display: grid;
		grid-template-columns: minmax(9rem, 11rem) minmax(0, 1fr);
		gap: 0.75rem 1rem;
		align-items: center;
	}
	.pie {
		width: 100%;
		max-width: 11rem;
		height: auto;
		justify-self: center;
	}
	.slice {
		cursor: default;
		transition: opacity 0.15s ease;
		stroke: var(--paper);
		stroke-width: 1.5;
	}
	.slice.dim {
		opacity: 0.35;
	}
	.slice.hot {
		opacity: 1;
	}
	.hole {
		fill: var(--paper);
	}
	.center-day {
		font-size: 15px;
		font-weight: 700;
		text-anchor: middle;
	}
	.center-meta {
		font-size: 11px;
		font-weight: 600;
		text-anchor: middle;
	}
	.legend {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.35rem;
	}
	.legend li {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.88rem;
	}
	/* Dim the swatch only — opacity on the whole row washes --ink-muted below AA. */
	.legend li.zero i {
		opacity: 0.45;
	}
	.legend li.hot .lab {
		font-weight: 700;
		color: var(--ink);
	}
	.legend i {
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 999px;
		display: inline-block;
	}
	.lab {
		font-weight: 600;
		color: var(--ink);
	}
	.val {
		color: var(--ink-muted);
		font-variant-numeric: tabular-nums;
	}
	.pct {
		font-size: 0.8em;
	}
	.hint,
	.empty {
		margin: 0.75rem 0 0;
		font-size: 0.82rem;
		color: var(--ink-muted);
	}
	.empty {
		margin-top: 0;
	}
	@media (max-width: 560px) {
		.chart {
			grid-template-columns: 1fr;
		}
	}
</style>
