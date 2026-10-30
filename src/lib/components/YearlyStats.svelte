<script lang="ts">
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

	type Props = { years: YearRow[] };
	let { years }: Props = $props();

	type Metric = 'ascents' | 'sends' | 'heightM';
	let metric = $state<Metric>('ascents');

	// Analytics returns newest-first; chart reads left→right oldest→newest.
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

	const max = $derived(Math.max(1, ...values.map((v) => v.value)));

	const metricLabel = $derived(
		metric === 'ascents' ? 'Ascents' : metric === 'sends' ? 'Sends' : 'Height (m)'
	);

	function formatValue(v: number): string {
		if (metric === 'heightM') return `${Math.round(v)} m`;
		return String(v);
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
</script>

<article class="panel">
	<header class="head">
		<h2>Yearly stats</h2>
		{#if years.length > 0}
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
		{/if}
	</header>

	{#if years.length === 0}
		<p class="empty">No yearly data yet.</p>
	{:else}
		<div class="chart-scroll">
			<div class="chart" style:--n={values.length}>
				{#each values as point (point.year)}
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
	.year-label {
		justify-self: center;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--ink);
		line-height: 1.1;
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
