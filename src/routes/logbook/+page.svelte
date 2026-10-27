<script lang="ts">
	import GradeChip from '#lib/components/GradeChip.svelte';
	import StyleBadge from '#lib/components/StyleBadge.svelte';
	import TagChips from '#lib/components/TagChips.svelte';
	import TickTypeIcon from '#lib/components/TickTypeIcon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function pageHref(page: number) {
		const p = new URLSearchParams();
		if (data.q) p.set('q', data.q);
		if (data.style) p.set('style', data.style);
		if (data.tick) p.set('tick', data.tick);
		if (data.crag) p.set('crag', data.crag);
		if (data.day) p.set('day', data.day);
		if (data.year !== '') p.set('year', String(data.year));
		if (data.score !== '') p.set('score', String(data.score));
		p.set('page', String(page));
		return `?${p.toString()}`;
	}
</script>

<section class="panel head">
	<h1>Logbook</h1>
	<p>
		{data.total} ascent{data.total === 1 ? '' : 's'}
		{#if data.score !== ''}
			· grade score {data.score}
		{/if}
		{#if data.day}
			· {data.day}
		{/if}
	</p>
</section>

<form class="panel filters" method="GET">
	<input name="q" value={data.q} placeholder="Search route, crag, partners, notes…" />
	<input name="style" value={data.style} placeholder="Style (Sport, Trad…)" />
	<input name="tick" value={data.tick} placeholder="Tick (Onsight…)" />
	<input name="crag" value={data.crag} placeholder="Crag" />
	<input name="year" value={data.year} placeholder="Year" inputmode="numeric" />
	{#if data.score !== ''}
		<input type="hidden" name="score" value={data.score} />
	{/if}
	{#if data.day}
		<input type="hidden" name="day" value={data.day} />
	{/if}
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
				<th>Quality</th>
				<th>With</th>
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
							<a href={row.url} target="_blank" rel="noreferrer">{row.displayName}</a>
						{:else}
							{row.displayName}
						{/if}
						<TagChips tags={row.tags} />
						{#if row.comment}
							<div class="note">{row.comment.slice(0, 120)}</div>
						{/if}
					</td>
					<td><GradeChip grade={row.gradeRaw} band={row.gradeBand} /></td>
					<td><TickTypeIcon tick={row.tickType} /></td>
					<td class="muted">{row.quality || '—'}</td>
					<td class="muted">{row.partners || '—'}</td>
					<td>
						{#if row.cragName}
							<a
								href="/logbook?crag={encodeURIComponent(row.cragName)}"
								title="Filter logbook to this crag">{row.cragName}</a
							>
							{#if row.cragUrl}
								<a class="ext" href={row.cragUrl} target="_blank" rel="noreferrer">↗</a>
							{/if}
						{/if}
					</td>
					<td><StyleBadge style={row.ascentGearStyle || row.gearStyle} /></td>
				</tr>
			{/each}
		</tbody>
	</table>
</section>

{#if data.pages > 1}
	<nav class="pager">
		{#if data.page > 1}
			<a href={pageHref(data.page - 1)}>← Prev</a>
		{/if}
		<span>Page {data.page} / {data.pages}</span>
		{#if data.page < data.pages}
			<a href={pageHref(data.page + 1)}>Next →</a>
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
		grid-template-columns: 2fr repeat(4, 1fr) auto;
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
	.muted {
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
	.ext {
		margin-left: 0.25rem;
		font-size: 0.75rem;
		color: var(--ink-muted);
		text-decoration: none;
	}
	.pager {
		display: flex;
		gap: 1rem;
		align-items: center;
		color: var(--ink-muted);
	}
	@media (max-width: 900px) {
		.filters {
			grid-template-columns: 1fr 1fr;
		}
		.table-wrap {
			overflow-x: auto;
		}
	}
</style>
