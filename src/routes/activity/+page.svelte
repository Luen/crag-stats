<script lang="ts">
	import MonthlyStats from '#lib/components/MonthlyStats.svelte';
	import YearlyStats from '#lib/components/YearlyStats.svelte';
	import { formatNumber } from '#lib/dates';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let yearFilter = $state<string>('all');

	const tableMonths = $derived(
		yearFilter === 'all'
			? data.monthly.months
			: data.monthly.months.filter((m) => m.month.startsWith(yearFilter))
	);

	const newestFirst = $derived([...tableMonths].sort((a, b) => b.month.localeCompare(a.month)));

	/** Last calendar day of `YYYY-MM` (UTC), for logbook `from`/`to` filters. */
	function monthEndIso(ym: string): string {
		const [y, m] = ym.split('-').map(Number);
		if (!y || !m) return `${ym}-28`;
		const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
		return `${ym}-${String(last).padStart(2, '0')}`;
	}

	function styleCount(byStyle: Record<string, number>, key: string): number {
		return byStyle[key] ?? 0;
	}

	function otherCount(row: (typeof tableMonths)[number]): number {
		const known =
			styleCount(row.byStyle, 'Sport') +
			styleCount(row.byStyle, 'Trad') +
			styleCount(row.byStyle, 'Boulder');
		return Math.max(0, row.ascents - known);
	}
</script>

<svelte:head>
	<title>Activity · Crag Stats</title>
	<meta
		name="description"
		content="Monthly and yearly climbing volume with style breakdowns and year-over-year deltas."
	/>
</svelte:head>

<section class="panel head">
	<h1>Activity</h1>
	<p>
		Deeper monthly and yearly volume than the dashboard cards — full per-month tables (ascents,
		sends, height, styles) plus year-over-year deltas.
		<a href="/docs/activity">How it works</a>
	</p>
</section>

<div class="charts">
	<MonthlyStats months={data.monthly.months} years={data.monthly.years} titleHref={null} />
	<YearlyStats years={data.yearly.years} days={data.heatmap} titleHref={null} />
</div>

<section class="panel table-panel">
	<header class="table-head">
		<h2>Monthly breakdown</h2>
		{#if data.monthly.years.length > 0}
			<label>
				<span class="sr">Year</span>
				<select bind:value={yearFilter}>
					<option value="all">All years</option>
					{#each [...data.monthly.years].reverse() as y (y)}
						<option value={String(y)}>{y}</option>
					{/each}
				</select>
			</label>
		{/if}
	</header>

	{#if newestFirst.length === 0}
		<p class="empty">No monthly data yet.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Month</th>
						<th>Ascents</th>
						<th>Sends</th>
						<th>Height</th>
						<th>Sport</th>
						<th>Trad</th>
						<th>Boulder</th>
						<th>Other</th>
					</tr>
				</thead>
				<tbody>
					{#each newestFirst as row (row.month)}
						<tr>
							<td>
								<a href={`/logbook?from=${row.month}-01&to=${monthEndIso(row.month)}`}>
									{row.month}
								</a>
							</td>
							<td>{formatNumber(row.ascents, data.dateDisplay)}</td>
							<td>{formatNumber(row.sends, data.dateDisplay)}</td>
							<td>{formatNumber(Math.round(row.heightM), data.dateDisplay)} m</td>
							<td>{formatNumber(styleCount(row.byStyle, 'Sport'), data.dateDisplay)}</td>
							<td>{formatNumber(styleCount(row.byStyle, 'Trad'), data.dateDisplay)}</td>
							<td>{formatNumber(styleCount(row.byStyle, 'Boulder'), data.dateDisplay)}</td>
							<td>{formatNumber(otherCount(row), data.dateDisplay)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

<style>
	.head {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
		margin-bottom: 0.85rem;
	}
	h1 {
		margin: 0 0 0.35rem;
		font-size: 1.45rem;
	}
	.head p {
		margin: 0;
		color: var(--ink-muted);
		font-size: 0.92rem;
		max-width: 44rem;
		line-height: 1.45;
	}
	.head a {
		color: var(--accent);
		font-weight: 600;
	}
	.charts {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.85rem;
		margin-bottom: 0.85rem;
	}
	.table-panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.table-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.65rem 1rem;
		margin-bottom: 0.75rem;
	}
	.table-head h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	select {
		font: inherit;
		padding: 0.3rem 0.5rem;
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		background: var(--paper);
		color: var(--ink);
	}
	.table-wrap {
		overflow-x: auto;
		max-width: 100%;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
	}
	table {
		width: 100%;
		min-width: 40rem;
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
		margin: 0;
		color: var(--ink-muted);
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
	@media (max-width: 860px) {
		.charts {
			grid-template-columns: 1fr;
		}
	}
</style>
