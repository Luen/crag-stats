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

		<ul class="cards">
			{#each years as row (row.year)}
				<li class="card">
					<a class="year" href={`/logbook?year=${row.year}`}>{row.year}</a>
					<div class="metrics">
						<div>
							<span class="label">Ascents</span>
							<span class="val">{row.ascents}</span>
							<span class={['delta', deltaClass(row.deltaAscents)]}>{fmtDelta(row.deltaAscents)}</span>
						</div>
						<div>
							<span class="label">Sends</span>
							<span class="val">{row.sends}</span>
						</div>
						<div>
							<span class="label">Onsights</span>
							<span class="val">{row.onsights}</span>
							<span class={['delta', deltaClass(row.deltaOnsights)]}
								>{fmtDelta(row.deltaOnsights)}</span
							>
						</div>
						<div>
							<span class="label">Height</span>
							<span class="val">{Math.round(row.heightM)} m</span>
							<span class={['delta', deltaClass(row.deltaHeightM)]}
								>{fmtDelta(row.deltaHeightM, ' m')}</span
							>
						</div>
					</div>
				</li>
			{/each}
		</ul>
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
	.table-wrap {
		overflow-x: auto;
		max-width: 100%;
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
	.cards {
		display: none;
		list-style: none;
		margin: 0;
		padding: 0;
		gap: 0.65rem;
	}
	.card {
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		padding: 0.75rem 0.85rem;
		background: color-mix(in srgb, var(--paper, #fffaf2) 70%, white);
	}
	.card .year {
		font-weight: 700;
		font-size: 1.05rem;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.metrics {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.55rem 0.85rem;
		margin-top: 0.65rem;
	}
	.metrics .label {
		display: block;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--ink-muted);
		font-weight: 600;
	}
	.metrics .val {
		font-weight: 700;
		margin-right: 0.35rem;
	}
	.metrics .delta {
		font-size: 0.85rem;
		font-weight: 600;
	}
	@media (max-width: 560px) {
		.table-wrap {
			display: none;
		}
		.cards {
			display: flex;
			flex-direction: column;
		}
	}
</style>
