<script lang="ts">
	import GradeChip from '#lib/components/GradeChip.svelte';
	import StyleBadge from '#lib/components/StyleBadge.svelte';
	import TickTypeIcon from '#lib/components/TickTypeIcon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<section class="panel head">
	<h1>Logbook</h1>
	<p>{data.total} ascents</p>
</section>

<form class="panel filters" method="GET">
	<input name="q" value={data.q} placeholder="Search route, crag, notes…" />
	<input name="style" value={data.style} placeholder="Style (Sport, Trad…)" />
	<input name="tick" value={data.tick} placeholder="Tick (Onsight…)" />
	<button type="submit">Filter</button>
</form>

<section class="panel table-wrap">
	<table>
		<thead>
			<tr>
				<th>Date</th>
				<th>Route</th>
				<th>Grade</th>
				<th>Tick</th>
				<th>Crag</th>
				<th>Style</th>
			</tr>
		</thead>
		<tbody>
			{#each data.rows as row (row.id)}
				<tr>
					<td>{(row.ascentDate || '').slice(0, 10)}</td>
					<td>
						{#if row.url}
							<a href={row.url} target="_blank" rel="noreferrer">{row.routeName}</a>
						{:else}
							{row.routeName}
						{/if}
						{#if row.comment}
							<div class="note">{row.comment.slice(0, 120)}</div>
						{/if}
					</td>
					<td><GradeChip grade={row.gradeRaw} band={row.gradeBand} /></td>
					<td><TickTypeIcon tick={row.tickType} /></td>
					<td>{row.cragName}</td>
					<td><StyleBadge style={row.ascentGearStyle || row.gearStyle} /></td>
				</tr>
			{/each}
		</tbody>
	</table>
</section>

{#if data.pages > 1}
	<nav class="pager">
		{#if data.page > 1}
			<a
				href="?q={encodeURIComponent(data.q)}&style={encodeURIComponent(data.style)}&tick={encodeURIComponent(data.tick)}&page={data.page - 1}"
				>← Prev</a
			>
		{/if}
		<span>Page {data.page} / {data.pages}</span>
		{#if data.page < data.pages}
			<a
				href="?q={encodeURIComponent(data.q)}&style={encodeURIComponent(data.style)}&tick={encodeURIComponent(data.tick)}&page={data.page + 1}"
				>Next →</a
			>
		{/if}
	</nav>
{/if}

<style>
	.head,
	.filters,
	.table-wrap {
		padding: 1rem 1.15rem;
		border-radius: 1rem;
		margin-bottom: 0.85rem;
	}
	h1 {
		margin: 0;
	}
	.head p {
		margin: 0.25rem 0 0;
		color: var(--ink-muted);
	}
	.filters {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr auto;
		gap: 0.5rem;
	}
	input,
	button {
		font: inherit;
		padding: 0.55rem 0.7rem;
		border-radius: 0.55rem;
		border: 1px solid var(--line);
		background: white;
	}
	button {
		background: var(--accent);
		color: white;
		border: none;
		font-weight: 700;
		cursor: pointer;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.92rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.55rem 0.35rem;
		border-bottom: 1px solid var(--line);
		vertical-align: top;
	}
	th {
		color: var(--ink-muted);
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.note {
		color: var(--ink-muted);
		font-size: 0.82rem;
		margin-top: 0.2rem;
	}
	.pager {
		display: flex;
		gap: 1rem;
		align-items: center;
		color: var(--ink-muted);
	}
	@media (max-width: 800px) {
		.filters {
			grid-template-columns: 1fr;
		}
		.table-wrap {
			overflow-x: auto;
		}
	}
</style>
