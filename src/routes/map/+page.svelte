<script lang="ts">
	import WorldClimbingMap from '#lib/components/WorldClimbingMap.svelte';
	import { formatNumber } from '#lib/dates';
	import { LOGBOOK_STYLES, includeSelectedOptions } from '#lib/logbookFilters';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head
	><title>Climbing map · Crag Stats</title><meta
		name="description"
		content="Your climbing places around the world, sized by logged ascents."
	/></svelte:head
>
<section class="panel">
	<h1>Climbing around the world</h1>
	<p>
		{formatNumber(data.mapped, data.dateDisplay)} of {formatNumber(data.total, data.dateDisplay)} ascents
		mapped across {formatNumber(data.places.length, data.dateDisplay)} places. {formatNumber(
			data.missing,
			data.dateDisplay
		)} ascents have no usable location. <a href="/docs/climbing-map">How it works</a>
	</p>
	<form method="GET" class="filters">
		<label>From <input type="date" name="from" value={data.filters.from} /></label><label
			>To <input type="date" name="to" value={data.filters.to} /></label
		>
		<label
			>Style <select name="style" value={data.filters.style}
				><option value="">All styles</option
				>{#each includeSelectedOptions( LOGBOOK_STYLES, [data.filters.style] ) as style (style)}<option
						value={style}>{style}</option
					>{/each}</select
			></label
		>
		<label
			>Venues <select name="venue" value={data.filters.venue}
				><option value="all">All venues</option><option value="outdoor">Outdoor</option><option
					value="indoor">Indoor</option
				></select
			></label
		>
		<button type="submit">Apply filters</button><a href="/map">Reset</a>
	</form>
	{#if data.places.length}<WorldClimbingMap
			places={data.places}
			dateDisplay={data.dateDisplay}
		/>{:else}<p>
			No places to map for these filters. Sync routes with usable coordinates to show them here.
		</p>{/if}
</section>
<section class="panel values">
	<h2>All mapped places</h2>
	<p>The same exact counts are available here without using the map.</p>
	<div class="table-wrap">
		<table>
			<thead
				><tr><th>Place</th><th>Ascents</th><th>Routes</th><th>First day</th><th>Last day</th></tr
				></thead
			><tbody
				>{#each data.places as p (p.key)}<tr
						><td><a href={p.href}>{p.name}{p.country ? ` · ${p.country}` : ''}</a></td><td
							>{formatNumber(p.count, data.dateDisplay)}</td
						><td>{formatNumber(p.routes, data.dateDisplay)}</td><td>{p.firstDay ?? '—'}</td><td
							>{p.lastDay ?? '—'}</td
						></tr
					>{/each}</tbody
			>
		</table>
	</div>
</section>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.values {
		margin-top: 1rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	h2 {
		font-size: 1.1rem;
	}
	p {
		color: var(--ink-muted);
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 0.6rem;
		margin: 1rem 0;
	}
	label {
		display: grid;
		gap: 0.2rem;
		font-size: 0.85rem;
	}
	input,
	select,
	button {
		background: var(--paper);
		color: var(--ink);
		border: 1px solid var(--line);
		padding: 0.4rem 0.5rem;
		border-radius: 0.45rem;
		font: inherit;
	}
	button {
		cursor: pointer;
	}
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		text-align: left;
		padding: 0.55rem;
		border-bottom: 1px solid var(--line);
		font-size: 0.88rem;
	}
	a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
