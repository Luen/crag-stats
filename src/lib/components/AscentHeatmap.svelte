<script lang="ts">
	import { onMount } from 'svelte';
	import { GRADE_BANDS } from '#lib/grades/bands';
	import {
		DEFAULT_DATE_DISPLAY,
		formatCalendarDate,
		formatNumber,
		type DateDisplay
	} from '#lib/dates';
	import type { HeatmapDay } from '#lib/types/dashboard';
	import type { CalendarWeather, CalendarWeatherKind } from '#lib/weatherKeys';

	type Props = { data: HeatmapDay[]; dateDisplay?: DateDisplay };
	let { data, dateDisplay = DEFAULT_DATE_DISPLAY }: Props = $props();

	type Mode = 'intensity' | 'grade' | 'weather';
	const MODE_KEY = 'cs_heatmap_mode';

	let mode = $state<Mode>('intensity');

	onMount(() => {
		try {
			const v = localStorage.getItem(MODE_KEY);
			mode = v === 'grade' || v === 'weather' ? v : 'intensity';
		} catch {
			/* ignore */
		}
	});

	function setMode(next: Mode) {
		mode = next;
		try {
			localStorage.setItem(MODE_KEY, next);
		} catch {
			/* ignore quota / private mode */
		}
	}

	/** Weather mode only exists once any climbed day has cached weather (opt-in import). */
	const hasWeather = $derived(data.some((d) => d.weather != null));
	const activeMode = $derived<Mode>(mode === 'weather' && !hasWeather ? 'intensity' : mode);

	const WEATHER_KINDS: { kind: CalendarWeatherKind; label: string }[] = [
		{ kind: 'snow', label: 'Snow' },
		{ kind: 'rain', label: 'Rain' },
		{ kind: 'heat', label: 'Hot (35°C+)' },
		{ kind: 'freeze', label: 'Freezing' },
		{ kind: 'fair', label: 'Fair' },
		{ kind: 'mild', label: 'Mild' }
	];
	const kindLabel = (k: CalendarWeatherKind) => WEATHER_KINDS.find((w) => w.kind === k)?.label ?? k;

	const years = $derived(
		[...new Set(data.map((d) => d.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a))
	);
	let selectedYear = $state<string | null>(null);
	const year = $derived(
		selectedYear && years.includes(selectedYear) ? selectedYear : (years[0] ?? '')
	);

	const byDate = $derived(
		Object.fromEntries(data.map((d) => [d.date, d])) as Record<string, HeatmapDay>
	);

	type Cell = {
		date: string;
		count: number;
		sends: number;
		maxBand: number | null;
		weather: CalendarWeather | null;
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
			const hit = byDate[iso];
			cells.push({
				date: iso,
				count: hit?.count ?? 0,
				sends: hit?.sends ?? 0,
				maxBand: hit?.maxBand ?? null,
				weather: hit?.weather ?? null,
				dow: d.getDay()
			});
		}
		const cols: Cell[][] = [];
		let col: Cell[] = [];
		// pad first column
		const firstDow = cells[0]?.dow ?? 0;
		for (let i = 0; i < firstDow; i++) {
			col.push({ date: '', count: 0, sends: 0, maxBand: null, weather: null, dow: i });
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
				col.push({ date: '', count: 0, sends: 0, maxBand: null, weather: null, dow: col.length });
			cols.push(col);
		}
		return cols;
	});

	const maxCount = $derived(Math.max(1, ...weeks.flat().map((c) => c.count)));

	const MONTH_ABBR = [
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
	] as const;

	/** Label a week column when it contains the 1st of a month (GitHub/Dreeve style). */
	const monthLabels = $derived(
		weeks.map((col) => {
			const day1 = col.find((c) => c.date && c.date.slice(8, 10) === '01');
			if (!day1?.date) return null;
			const month = Number(day1.date.slice(5, 7));
			return MONTH_ABBR[month - 1] ?? null;
		})
	);

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

	const weatherClass = (cell: Cell): string => {
		if (cell.count <= 0) return 'l0';
		return cell.weather ? `w-${cell.weather.kind}` : 'attempt';
	};

	const tempText = (n: number | null) =>
		n == null ? '—' : `${formatNumber(Math.round(n), dateDisplay)}°C`;

	function weatherSummary(w: CalendarWeather): string {
		const rain =
			w.precipMm != null && w.precipMm >= 1
				? `, ${formatNumber(Math.round(w.precipMm * 10) / 10, dateDisplay)} mm`
				: '';
		return `${kindLabel(w.kind)} · high ${tempText(w.tempMaxC)}, low ${tempText(w.tempMinC)}${rain}`;
	}

	/** Days in the chosen year that have cached weather, for the screen-reader values table. */
	const weatherDays = $derived(
		data
			.filter((d) => d.weather != null && d.date.startsWith(year))
			.sort((a, b) => a.date.localeCompare(b.date))
	);

	function cellTitle(cell: Cell): string {
		if (activeMode === 'weather') {
			const head = `${formatCalendarDate(cell.date, dateDisplay)}: ${cell.count} ascent${cell.count === 1 ? '' : 's'}`;
			if (cell.count <= 0) return head;
			return cell.weather
				? `${head} · ${weatherSummary(cell.weather)}`
				: `${head} · no weather data`;
		}
		const base = `${cell.date}: ${cell.count} ascent${cell.count === 1 ? '' : 's'} (${cell.sends} send${cell.sends === 1 ? '' : 's'})`;
		if (activeMode !== 'grade' || cell.maxBand == null) return base;
		const name = GRADE_BANDS.find((b) => b.id === cell.maxBand)?.name ?? `band ${cell.maxBand}`;
		return `${base} · hardest send ${name}`;
	}
</script>

<article class="panel">
	<header>
		<div class="titles">
			<h2>Ascent calendar</h2>
			<a class="how" href="/docs/ascent-calendar">How it works</a>
		</div>
		<div class="controls">
			{#if years.length > 0}
				<div class="toggles" role="group" aria-label="Colour mode">
					<button
						type="button"
						class={{ active: activeMode === 'intensity' }}
						aria-pressed={activeMode === 'intensity'}
						onclick={() => setMode('intensity')}>Intensity</button
					>
					<button
						type="button"
						class={{ active: activeMode === 'grade' }}
						aria-pressed={activeMode === 'grade'}
						onclick={() => setMode('grade')}>Grade</button
					>
					{#if hasWeather}
						<button
							type="button"
							class={{ active: activeMode === 'weather' }}
							aria-pressed={activeMode === 'weather'}
							onclick={() => setMode('weather')}>Weather</button
						>
					{/if}
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
			<div class="months" style:--cols={weeks.length} aria-hidden="true">
				{#each monthLabels as label, i (i)}
					{@const monthNum = label ? MONTH_ABBR.indexOf(label) + 1 : 0}
					<span class={['month', { sparse: monthNum > 0 && monthNum % 2 === 0 }]}
						>{label ?? ''}</span
					>
				{/each}
			</div>
			<div class="grid" style:--cols={weeks.length}>
				{#each weeks as col, wi (wi)}
					<div class="week">
						{#each col as cell, di (di)}
							{#if cell.date}
								<a
									class={[
										'cell',
										activeMode === 'intensity'
											? `l${level(cell.count)}`
											: activeMode === 'weather'
												? weatherClass(cell)
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
		{#if activeMode === 'intensity'}
			<div class="legend">
				<span>Less</span>
				<i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i>
				<span>More</span>
			</div>
		{:else if activeMode === 'weather'}
			<div class="legend grade">
				<i class="attempt"></i>
				<span class="band-name">No weather data</span>
				{#each WEATHER_KINDS as w (w.kind)}
					<i class="w-{w.kind}"></i>
					<span class="band-name">{w.label}</span>
				{/each}
			</div>
			<details class="values">
				<summary>View weather values ({year})</summary>
				{#if weatherDays.length === 0}
					<p class="empty">No cached weather for {year}.</p>
				{:else}
					<table>
						<caption>Weather on climbing days in {year}</caption>
						<thead>
							<tr>
								<th scope="col">Date</th>
								<th scope="col">Conditions</th>
								<th scope="col">High</th>
								<th scope="col">Low</th>
								<th scope="col">Precipitation</th>
							</tr>
						</thead>
						<tbody>
							{#each weatherDays as day (day.date)}
								<tr>
									<th scope="row"
										><a href="/logbook?day={encodeURIComponent(day.date)}"
											>{formatCalendarDate(day.date, dateDisplay)}</a
										></th
									>
									<td>{kindLabel(day.weather!.kind)}</td>
									<td>{tempText(day.weather!.tempMaxC)}</td>
									<td>{tempText(day.weather!.tempMinC)}</td>
									<td>
										{day.weather!.precipMm == null
											? '—'
											: `${formatNumber(Math.round(day.weather!.precipMm * 10) / 10, dateDisplay)} mm`}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</details>
		{:else}
			<div class="legend grade">
				<i class="attempt"></i>
				<span>Attempts</span>
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
	.months {
		display: grid;
		grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
		gap: clamp(0.12rem, 0.35vw, 0.22rem);
		width: 100%;
		margin-bottom: 0.25rem;
		font-size: 0.68rem;
		line-height: 1.1;
		color: var(--ink-muted);
		font-weight: 600;
	}
	.month {
		overflow: visible;
		white-space: nowrap;
		justify-self: start;
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
	@media (max-width: 700px) {
		.month.sparse {
			visibility: hidden;
		}
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
	.w-snow {
		background: var(--weather-snow);
	}
	.w-rain {
		background: var(--weather-rain);
	}
	.w-heat {
		background: var(--weather-heat);
	}
	.w-freeze {
		background: var(--weather-freeze);
	}
	.w-fair {
		background: var(--weather-fair);
	}
	.w-mild {
		background: var(--weather-mild);
	}
	.values {
		margin-top: 0.75rem;
		font-size: 0.85rem;
	}
	.values summary {
		cursor: pointer;
		font-weight: 600;
		color: var(--ink-muted);
	}
	.values table {
		width: 100%;
		margin-top: 0.45rem;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}
	.values th,
	.values td {
		text-align: left;
		padding: 0.3rem 0.45rem;
		border-bottom: 1px solid var(--line);
	}
	.values thead th {
		color: var(--ink-muted);
		font-weight: 600;
		font-size: 0.78rem;
	}
	.values tbody th a {
		color: var(--accent);
		font-weight: 600;
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
