<script lang="ts">
	import GradeChip from '#lib/components/GradeChip.svelte';
	import StyleBadge from '#lib/components/StyleBadge.svelte';
	import TagChips from '#lib/components/TagChips.svelte';
	import TickTypeIcon from '#lib/components/TickTypeIcon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function pageHref(page: number) {
		// Throwaway query builder for an href, not reactive state.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const p = new URLSearchParams();
		if (data.q) p.set('q', data.q);
		if (data.style) p.set('style', data.style);
		if (data.tick) p.set('tick', data.tick);
		if (data.crag) p.set('crag', data.crag);
		if (data.sector) p.set('sector', data.sector);
		if (data.day) p.set('day', data.day);
		if (data.season) p.set('season', data.season);
		if (data.sort && data.sort !== 'date') p.set('sort', data.sort);
		if (data.order && data.order !== 'desc') p.set('order', data.order);
		if (data.multipitch) p.set('multipitch', '1');
		if (data.year !== '') p.set('year', String(data.year));
		if (data.score !== '') p.set('score', String(data.score));
		if (data.band !== '') p.set('band', String(data.band));
		p.set('page', String(page));
		return `?${p.toString()}`;
	}

	function sortHref(col: string) {
		// Throwaway query builder for an href, not reactive state.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const p = new URLSearchParams();
		if (data.q) p.set('q', data.q);
		if (data.style) p.set('style', data.style);
		if (data.tick) p.set('tick', data.tick);
		if (data.crag) p.set('crag', data.crag);
		if (data.sector) p.set('sector', data.sector);
		if (data.day) p.set('day', data.day);
		if (data.season) p.set('season', data.season);
		if (data.multipitch) p.set('multipitch', '1');
		if (data.year !== '') p.set('year', String(data.year));
		if (data.score !== '') p.set('score', String(data.score));
		if (data.band !== '') p.set('band', String(data.band));
		p.set('sort', col);
		const nextOrder = data.sort === col && data.order === 'desc' ? 'asc' : 'desc';
		p.set('order', nextOrder);
		return `?${p.toString()}`;
	}

	function sortMark(col: string) {
		if (data.sort !== col) return '';
		return data.order === 'asc' ? ' ↑' : ' ↓';
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
		{#if data.sector}
			· sector {data.sector}
		{/if}
	</p>
</section>

<form class="panel filters" method="GET">
	<input
		name="q"
		value={data.q}
		placeholder={data.notesShown
			? 'Search route, crag, partners, notes…'
			: 'Search route, crag, partners…'}
	/>
	<input name="style" value={data.style} placeholder="Style (Sport, Trad…)" />
	<input name="tick" value={data.tick} placeholder="Tick (Onsight…)" />
	<input name="crag" value={data.crag} placeholder="Crag" />
	<input name="sector" value={data.sector} placeholder="Sector / parent" />
	<input name="year" value={data.year} placeholder="Year" inputmode="numeric" />
	<select name="band" aria-label="Grade band" value={String(data.band)}>
		<option value="">Any band</option>
		<option value="1">Beginner</option>
		<option value="2">Intermediate</option>
		<option value="3">Experienced</option>
		<option value="4">Expert</option>
		<option value="5">Elite</option>
	</select>
	<select name="season" aria-label="Season" value={data.season}>
		<option value="">Any time</option>
		<option value="ytd">Year to date</option>
		<option value="last_year">Last year</option>
	</select>
	<label class="check">
		<input type="checkbox" name="multipitch" value="1" checked={data.multipitch} />
		Multipitch only
	</label>
	{#if data.score !== ''}
		<input type="hidden" name="score" value={data.score} />
	{/if}
	{#if data.day}
		<input type="hidden" name="day" value={data.day} />
	{/if}
	<input type="hidden" name="sort" value={data.sort} />
	<input type="hidden" name="order" value={data.order} />
	<button type="submit">Filter</button>
</form>

<section class="panel table-wrap">
	<table>
		<thead>
			<tr>
				<th><a href={sortHref('date')}>Date{sortMark('date')}</a></th>
				<th>Route</th>
				<th><a href={sortHref('grade')}>Grade{sortMark('grade')}</a></th>
				<th>Tick</th>
				<th><a href={sortHref('quality')}>Quality{sortMark('quality')}</a></th>
				<th><a href={sortHref('stars')}>★{sortMark('stars')}</a></th>
				<th>With</th>
				<th>Crag / sector</th>
				<th>Style</th>
			</tr>
		</thead>
		<tbody>
			{#each data.rows as row (row.id)}
				<tr>
					<td class="date">{(row.ascentDate || '').slice(0, 10)}</td>
					<td class="route">
						{#if row.url}
							<a href={row.url} target="_blank" rel="noreferrer">{row.displayName}</a>
						{:else}
							{row.displayName}
						{/if}
						{#if row.pitchLabel}
							<span class="chip">{row.pitchLabel}</span>
						{/if}
						{#if row.numberAttempts != null && row.numberAttempts > 1}
							<span class="chip">{row.numberAttempts} attempts</span>
						{/if}
						<TagChips tags={row.tags} />
						{#if row.comment}
							{#if row.comment.length > 140}
								<details class="note">
									<summary>{row.comment.slice(0, 120)}…</summary>
									<p>{row.comment}</p>
								</details>
							{:else}
								<div class="note">{row.comment}</div>
							{/if}
						{/if}
					</td>
					<td class="nowrap"><GradeChip grade={row.gradeRaw} band={row.gradeBand} /></td>
					<td class="nowrap"><TickTypeIcon tick={row.tickType} /></td>
					<td class="muted">{row.quality || '—'}</td>
					<td class="muted">{row.stars != null ? row.stars : '—'}</td>
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
						{#if row.parentName}
							<div class="sector">
								<a href="/logbook?sector={encodeURIComponent(row.parentName)}">{row.parentName}</a>
							</div>
						{/if}
					</td>
					<td class="nowrap"><StyleBadge style={row.ascentGearStyle || row.gearStyle} /></td>
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
		grid-template-columns: minmax(0, 2fr) repeat(5, minmax(0, 1fr));
		gap: 0.5rem;
		align-items: center;
	}
	.filters > :global(*) {
		min-width: 0;
		box-sizing: border-box;
	}
	.filters input,
	.filters select {
		width: 100%;
	}
	.filters input,
	.filters select,
	.filters button {
		font: inherit;
		padding: 0.45rem 0.55rem;
		border-radius: 0.45rem;
		border: 1px solid var(--line);
		background: var(--paper);
	}
	.filters button {
		cursor: pointer;
		background: var(--accent);
		color: var(--on-accent);
		border-color: var(--accent);
		font-weight: 700;
	}
	.filters button:hover {
		background: var(--accent-strong);
	}
	.check {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.85rem;
		color: var(--ink-muted);
		white-space: nowrap;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.92rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.55rem 0.4rem;
		border-bottom: 1px solid var(--line);
		vertical-align: top;
	}
	/* #42: keep short values on one line; Route / Crag take the flexible width. */
	td.date {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	td.nowrap {
		white-space: nowrap;
	}
	td.route {
		min-width: 12rem;
	}
	th a {
		color: inherit;
		text-decoration: none;
	}
	th {
		background: var(--surface-2);
		color: var(--ink-muted);
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding-block: 0.7rem;
		vertical-align: middle;
		white-space: nowrap;
	}
	tbody tr:hover td {
		background: var(--surface-2);
	}
	th a:hover {
		text-decoration: underline;
	}
	.muted {
		color: var(--ink-muted);
	}
	.note {
		margin-top: 0.25rem;
		font-size: 0.8rem;
		color: var(--ink-muted);
		white-space: pre-line;
		max-width: 48ch;
	}
	.note summary {
		cursor: pointer;
	}
	.note p {
		margin: 0.25rem 0 0;
	}
	.chip {
		display: inline-block;
		margin-left: 0.35rem;
		font-size: 0.72rem;
		padding: 0.05rem 0.35rem;
		border-radius: 999px;
		border: 1px solid var(--line);
		color: var(--ink-muted);
	}
	.sector {
		font-size: 0.8rem;
		margin-top: 0.15rem;
	}
	.ext {
		margin-left: 0.25rem;
		font-size: 0.8rem;
		color: var(--ink-muted);
		text-decoration: none;
	}
	.pager {
		display: flex;
		justify-content: center;
		gap: 1rem;
		align-items: center;
		margin: 0.5rem 0 1.5rem;
	}
	@media (max-width: 900px) {
		.filters {
			grid-template-columns: 1fr 1fr;
		}
		.table-wrap {
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
		}
		table {
			min-width: 42rem;
		}
	}
	@media (max-width: 520px) {
		.filters {
			grid-template-columns: 1fr;
		}
	}
</style>
