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

	function fmtDelta(n: number | null, suffix = ''): string {
		if (n == null) return '—';
		const sign = n > 0 ? '+' : '';
		return `${sign}${Math.round(n)}${suffix}`;
	}

	function deltaClass(n: number | null): string {
		if (n == null || n === 0) return 'flat';
		return n > 0 ? 'up' : 'down';
	}
</script>

<article class="panel">
	<h2>Yearly stats</h2>

	{#if years.length === 0}
		<p class="empty">No yearly data yet.</p>
	{:else}
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
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
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
	.up {
		color: var(--accent);
		font-weight: 600;
	}
	.down {
		color: #a33;
		font-weight: 600;
	}
	.flat {
		color: var(--ink-muted);
	}
	.empty {
		color: var(--ink-muted);
		margin: 0;
	}
</style>
