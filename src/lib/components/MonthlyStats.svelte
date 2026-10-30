<script lang="ts">
	import { innerWidth } from 'svelte/reactivity/window';

	type MonthRow = {
		month: string;
		byStyle: Record<string, number>;
		ascents: number;
		sends: number;
		heightM: number;
	};

	type Props = {
		months: MonthRow[];
		years: number[];
		/** Dashboard links to `/activity` when that route exists; omit/null to skip. */
		titleHref?: string | null;
	};

	let { months, years, titleHref = null }: Props = $props();

	type Metric = 'ascents' | 'sends' | 'heightM';

	/** YYYY-MM cutoff for a rolling last-12-calendar-months window (inclusive). */
	function last12Cutoff(now = new Date()): string {
		const d = new Date(now.getFullYear(), now.getMonth() - 11, 1);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
	}

	// Default to the past 12 months — more useful than “all years” on a long logbook.
	let yearFilter = $state<string>('last12');
	let metric = $state<Metric>('ascents');

	const cutoff = $derived(last12Cutoff());

	const filtered = $derived(
		yearFilter === 'all'
			? months
			: yearFilter === 'last12'
				? months.filter((m) => m.month >= cutoff)
				: months.filter((m) => m.month.startsWith(yearFilter))
	);

	const values = $derived(
		filtered.map((m) => ({
			month: m.month,
			value: metric === 'ascents' ? m.ascents : metric === 'sends' ? m.sends : m.heightM
		}))
	);

	const max = $derived(Math.max(1, ...values.map((v) => v.value)));

	const metricLabel = $derived(
		metric === 'ascents' ? 'Ascents' : metric === 'sends' ? 'Sends' : 'Height (m)'
	);

	const narrow = $derived((innerWidth.current ?? 900) < 700);
	const sparseLabels = $derived(values.length > (narrow ? 12 : 18));
	const showYearInLabel = $derived(yearFilter === 'all' || yearFilter === 'last12');

	const MONTH_NAMES = [
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

	function axisLabel(month: string, index: number): string | null {
		const isYearStart = month.endsWith('-01') || index === 0;
		if (sparseLabels) return isYearStart ? month.slice(0, 4) : null;
		const name = MONTH_NAMES[Number(month.slice(5, 7)) - 1] ?? month;
		return showYearInLabel && isYearStart ? `${name} '${month.slice(2, 4)}` : name;
	}

	function formatValue(v: number): string {
		if (metric === 'heightM') return `${Math.round(v)} m`;
		return String(v);
	}

	/** Inclusive last calendar day for a YYYY-MM (UTC), for logbook `to` filters. */
	function monthEndIso(ym: string): string {
		const [y, m] = ym.split('-').map(Number);
		if (!y || !m) return `${ym}-28`;
		const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
		return `${ym}-${String(last).padStart(2, '0')}`;
	}

	function monthHref(month: string): string {
		return `/logbook?from=${month}-01&to=${monthEndIso(month)}`;
	}
</script>

<article class="panel">
	<h2>
		{#if titleHref}
			<a href={titleHref}>Monthly stats</a>
		{:else}
			Monthly stats
		{/if}
	</h2>

	{#if months.length === 0}
		<p class="empty">No monthly data yet.</p>
	{:else}
		<div class="controls">
			<label>
				<span class="sr">Range</span>
				<select bind:value={yearFilter}>
					<option value="last12">Past 12 months</option>
					<option value="all">All years</option>
					{#each [...years].reverse() as y (y)}
						<option value={String(y)}>{y}</option>
					{/each}
				</select>
			</label>
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

		{#if values.length === 0}
			<p class="empty">No months in this range.</p>
		{:else}
			<div class="chart-scroll">
				<div class="chart" style:--n={values.length}>
					{#each values as point, i (point.month)}
						<a
							class="col"
							href={monthHref(point.month)}
							title="{point.month}: {formatValue(point.value)} {metricLabel}"
						>
							<div class="stack">
								<div class="bar" style:height="{(point.value / max) * 100}%"></div>
							</div>
							<span class={['m', { year: sparseLabels }]} aria-hidden="true"
								>{axisLabel(point.month, i) ?? ''}</span
							>
						</a>
					{/each}
				</div>
			</div>
		{/if}
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
		gap: 0.65rem 1rem;
		align-items: center;
		margin-bottom: 0.85rem;
	}
	select {
		font: inherit;
		padding: 0.3rem 0.5rem;
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		background: var(--paper);
		color: var(--ink);
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
		background: var(--accent);
		min-height: 2px;
	}
	.m {
		justify-self: center;
		height: 1rem;
		font-size: 0.7rem;
		line-height: 1rem;
		white-space: nowrap;
		color: var(--ink-muted);
	}
	.m.year {
		justify-self: start;
	}
	.empty {
		color: var(--ink-muted);
		margin: 0;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}
</style>
