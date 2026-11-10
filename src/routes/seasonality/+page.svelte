<script lang="ts">
	import { MONTH_LABELS } from '#lib/bestMonths';
	import SeasonalityStrip from '#lib/components/SeasonalityStrip.svelte';
	import { seasonalityHref } from '#lib/seasonality';
	import { formatNumber } from '#lib/dates';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Seasonality search · Crag Stats</title>
	<meta
		name="description"
		content="Search your cached crags and climbs by month using theCrag seasonality."
	/>
</svelte:head>

<section class="panel intro">
	<h1>Seasonality search</h1>
	<p>
		Explore theCrag’s community climbing patterns by month. These are seasonal patterns, not a
		weather forecast or conditions on your visits. <a class="how" href="/docs/best-months"
			>How it works</a
		>
	</p>
	<p>
		Search covers only climbs in your synced logbook. {formatNumber(
			data.coverage.covered,
			data.dateDisplay
		)} of {formatNumber(data.coverage.total, data.dateDisplay)} matching climbs have cached monthly data.
		Missing data stays unknown.
	</p>
</section>

<form class="panel filters" method="GET" action="/seasonality">
	<label
		>Month<select name="month" value={data.filters.month}>
			{#each MONTH_LABELS as label, i (label)}<option value={i + 1}>{label}</option>{/each}
		</select></label
	>
	<label class="search"
		>Crag, area or climb<input
			name="q"
			type="search"
			value={data.filters.q}
			placeholder="Search your cached climbs…"
		/></label
	>
	<label
		>Show<select name="view" value={data.filters.view}
			><option value="crags">Crags</option><option value="routes">Climbs</option></select
		></label
	>
	<label
		>Sort by<select name="sort" value={data.filters.sort}
			><option value="season">Selected month</option><option value="name">Name</option></select
		></label
	>
	{#if data.filters.crag}<input type="hidden" name="crag" value={data.filters.crag} />{/if}
	<button type="submit">Search</button>
</form>

{#if data.filters.crag}
	<p class="scope">
		At {data.cragName}.
		<a href={seasonalityHref(data.filters, { crag: '', page: 1 })}>Search all crags</a>
	</p>
{/if}
<p class="explanation">
	{formatNumber(data.total, data.dateDisplay)}
	{data.filters.view === 'crags' ? 'crags' : 'climbs'} with monthly data · {MONTH_LABELS[
		data.filters.month - 1
	]}. Selected-month sorting compares the month’s percentage of each annual peak, highest first;
	names break ties. No “in season” cutoff is applied. Crag curves are weighted by your ascents on
	routes with data.
</p>

{#if data.results.length === 0}
	<section class="panel empty">
		<h2>No seasonality results</h2>
		<p>
			{data.coverage.total
				? 'No matching climbs have usable monthly data yet.'
				: 'No logged climbs match this search.'} Try another name or clear your search.
		</p>
		<p>
			Seasonality is cached by the optional route-history import after sync. <a
				href="/docs/best-months">Learn about coverage</a
			>
		</p>
	</section>
{:else}
	<ul class="results">
		{#each data.results as result (result.key)}
			<li class="panel result">
				<h2>{result.name}</h2>
				{#if result.context}<p class="context">{result.context}</p>{/if}
				<p class="score">
					<strong
						>{result.relative == null
							? 'No seasonal signal'
							: `${Math.round(result.relative * 100)}% of annual peak`}</strong
					><br />{MONTH_LABELS[data.filters.month - 1]} value: {result.value.toFixed(1)}
				</p>
				{#if data.filters.view === 'crags'}<p class="coverage">
						{result.covered} of {result.total} logged climbs with data
					</p>{/if}
				<SeasonalityStrip values={result.curve} month={data.filters.month} name={result.name} />
				<div class="links">
					{#if data.filters.view === 'crags'}
						<a href={seasonalityHref(data.filters, { view: 'routes', crag: result.crag, page: 1 })}
							>View climbs at {result.name}</a
						>
					{:else if result.logbookHref}
						<a href={result.logbookHref}>View {result.name} in logbook</a>
					{/if}
					{#if result.guidebookHref}<a href={result.guidebookHref} target="_blank" rel="noreferrer"
							>{result.name} on theCrag ↗</a
						>{/if}
				</div>
			</li>
		{/each}
	</ul>
{/if}

{#if data.pages > 1}
	<nav class="pagination" aria-label="Seasonality results pages">
		{#if data.page > 1}<a href={seasonalityHref(data.filters, { page: data.page - 1 })}
				>← Previous</a
			>{/if}
		<span>Page {data.page} of {data.pages}</span>
		{#if data.page < data.pages}<a href={seasonalityHref(data.filters, { page: data.page + 1 })}
				>Next →</a
			>{/if}
	</nav>
{/if}

<style>
	.intro,
	.filters,
	.result,
	.empty {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.intro {
		margin-bottom: 0.85rem;
	}
	h1 {
		font-size: 1.45rem;
		margin: 0 0 0.5rem;
	}
	h2 {
		font-size: 1.05rem;
		margin: 0;
		overflow-wrap: anywhere;
	}
	p {
		line-height: 1.5;
	}
	.intro p {
		margin: 0.5rem 0 0;
		color: var(--ink-muted);
	}
	a {
		color: var(--accent);
		text-decoration: underline;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 0.75rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.85rem;
		font-weight: 600;
		min-width: 0;
	}
	input,
	select {
		background: var(--paper);
		color: var(--ink);
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		padding: 0.5rem;
		width: 100%;
		box-sizing: border-box;
	}
	.search {
		flex: 1 1 15rem;
	}
	button {
		background: var(--paper);
		color: var(--ink);
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		font: inherit;
		cursor: pointer;
		padding: 0.5rem 0.9rem;
	}
	.explanation,
	.scope {
		color: var(--ink-muted);
		font-size: 0.88rem;
	}
	.results {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 21rem), 1fr));
		gap: 0.85rem;
	}
	.result {
		min-width: 0;
	}
	.context {
		font-size: 0.83rem;
		color: var(--ink-muted);
		overflow-wrap: anywhere;
		margin: 0.35rem 0;
	}
	.score {
		margin: 0.75rem 0 0;
	}
	.coverage {
		font-size: 0.82rem;
		color: var(--ink-muted);
		margin: 0.3rem 0;
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem 1rem;
		margin-top: 1rem;
		font-size: 0.85rem;
	}
	.links a {
		overflow-wrap: anywhere;
	}
	.pagination {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
		padding: 1rem 0;
	}
</style>
