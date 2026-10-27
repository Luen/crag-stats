<script lang="ts">
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
	};

	let { months, years }: Props = $props();

	type Metric = 'ascents' | 'sends' | 'heightM';

	let yearFilter = $state<string>('all');
	let metric = $state<Metric>('ascents');

	const filtered = $derived(
		yearFilter === 'all' ? months : months.filter((m) => m.month.startsWith(yearFilter))
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

	function formatValue(v: number): string {
		if (metric === 'heightM') return `${Math.round(v)} m`;
		return String(v);
	}
</script>

<article class="panel">
	<h2>Monthly stats</h2>

	{#if months.length === 0}
		<p class="empty">No monthly data yet.</p>
	{:else}
		<div class="controls">
			<label>
				<span class="sr">Year</span>
				<select bind:value={yearFilter}>
					<option value="all">All years</option>
					{#each years as y (y)}
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
			<p class="empty">No months for this year.</p>
		{:else}
			<div class="chart" style:--n={values.length}>
				{#each values as point (point.month)}
					<a
						class="col"
						href={`/logbook?year=${point.month.slice(0, 4)}`}
						title="{point.month}: {formatValue(point.value)} {metricLabel}"
					>
						<div class="stack">
							<div class="bar" style:height="{(point.value / max) * 100}%"></div>
						</div>
						<span class="m">{point.month.slice(2)}</span>
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
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
		background: white;
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
		background: white;
		color: var(--ink-muted);
		cursor: pointer;
	}
	.toggles button.active {
		background: var(--accent);
		border-color: var(--accent);
		color: white;
	}
	.chart {
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		align-items: end;
		gap: 0.35rem;
		height: 160px;
	}
	.col {
		display: grid;
		grid-template-rows: 1fr auto;
		height: 100%;
		gap: 0.35rem;
		text-decoration: none;
		color: inherit;
		min-width: 0;
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
		font-size: 0.65rem;
		text-align: center;
		color: var(--ink-muted);
		transform: rotate(-45deg);
		transform-origin: top center;
		height: 1.6rem;
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
