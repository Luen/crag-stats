<script lang="ts">
	import { MONTH_LABELS } from '#lib/bestMonths';
	import type { BestMonthsView } from '#lib/types/dashboard';

	let { data }: { data: BestMonthsView } = $props();

	function maxOf(values: number[]): number {
		return Math.max(1, ...values);
	}
</script>

<article class="panel">
	<header>
		<h2>Best months</h2>
		<a class="how" href="/docs/best-months">How it works</a>
	</header>
	<p class="lead">
		theCrag seasonality for your favourite crags (orange) vs when you climb there (grey).
	</p>

	<ul class="crags">
		{#each data.crags as c (c.crag)}
			{@const maxSeason = maxOf(c.seasonality)}
			{@const maxYours = maxOf(c.yourMonths)}
			<li>
				<div class="crag-head">
					{#if c.url}
						<a class="name" href={c.url} rel="noopener noreferrer">{c.crag}</a>
					{:else}
						<span class="name">{c.crag}</span>
					{/if}
					<span class="meta">{c.ascentCount} ascents · peak {MONTH_LABELS[c.peakMonth]}</span>
				</div>
				<div class="strip" aria-hidden="true">
					{#each MONTH_LABELS as label, i (label)}
						<div
							class="col"
							title="{label}: season {c.seasonality[i].toFixed(1)}, you {c.yourMonths[i]}"
						>
							<div class="bars">
								<span class="bar season" style:height="{(c.seasonality[i] / maxSeason) * 100}%"
								></span>
								<span class="bar yours" style:height="{(c.yourMonths[i] / maxYours) * 100}%"></span>
							</div>
							<span class="m">{label.slice(0, 1)}</span>
						</div>
					{/each}
				</div>
				<details class="values">
					<summary>View monthly values for {c.crag}</summary>
					<table>
						<caption>{c.crag}: seasonality and your ascents</caption><thead
							><tr
								><th scope="col">Month</th><th scope="col">Seasonality</th><th scope="col"
									>Your ascents</th
								></tr
							></thead
						><tbody>
							{#each MONTH_LABELS as label, i (label)}<tr
									><th scope="row">{label}</th><td>{c.seasonality[i].toFixed(1)}</td><td
										>{c.yourMonths[i]}</td
									></tr
								>{/each}
						</tbody>
					</table>
				</details>
			</li>
		{/each}
	</ul>

	<div class="legend">
		<span><i class="sw season"></i> theCrag seasonality</span>
		<span><i class="sw yours"></i> Your ascents</span>
	</div>
</article>

<style>
	.values {
		margin-top: 0.5rem;
		font-size: 0.85rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		text-align: left;
		padding: 0.35rem 0.5rem;
		border-bottom: 1px solid var(--line);
	}
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
	}
	.how {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--accent);
	}
	.lead {
		margin: 0 0 1rem;
		font-size: 0.88rem;
		color: var(--ink-muted);
	}
	.crags {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1.25rem;
	}
	.crag-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.35rem 0.75rem;
		margin-bottom: 0.45rem;
	}
	.name {
		font-weight: 700;
		color: var(--ink);
	}
	a.name:hover {
		color: var(--accent);
	}
	.meta {
		font-size: 0.78rem;
		color: var(--ink-muted);
	}
	.strip {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 0.2rem;
	}
	.col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		min-width: 0;
	}
	.bars {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 2px;
		width: 100%;
		height: 3.5rem;
	}
	.bar {
		width: 42%;
		min-height: 2px;
		border-radius: 2px 2px 0 0;
	}
	.bar.season {
		background: var(--accent);
	}
	.bar.yours {
		background: color-mix(in srgb, var(--ink) 28%, var(--paper));
	}
	.m {
		font-size: 0.62rem;
		font-weight: 700;
		color: var(--ink-muted);
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1.25rem;
		margin-top: 1rem;
		font-size: 0.78rem;
		color: var(--ink-muted);
	}
	.sw {
		display: inline-block;
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 2px;
		margin-right: 0.35rem;
		vertical-align: -0.05em;
	}
	.sw.season {
		background: var(--accent);
	}
	.sw.yours {
		background: color-mix(in srgb, var(--ink) 28%, var(--paper));
	}
</style>
