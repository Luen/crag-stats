<script lang="ts">
	import GradeChip from '#lib/components/GradeChip.svelte';
	import StyleBadge from '#lib/components/StyleBadge.svelte';
	import TickTypeIcon from '#lib/components/TickTypeIcon.svelte';
	import type { NotableRow } from '#lib/types/dashboard';

	type Props = { byStyle: NotableRow[]; byArea: NotableRow[] };
	let { byStyle, byArea }: Props = $props();

	function bandWidth(row: NotableRow, bandId: number) {
		const total = Math.max(
			1,
			row.bandShares.reduce((s, b) => s + b.count, 0)
		);
		const band = row.bandShares.find((b) => b.band === bandId);
		return ((band?.count ?? 0) / total) * 100;
	}

	/** Group consecutive rows that share the same style/area label. */
	function groupRows(rows: NotableRow[]) {
		const groups: { group: string; groupUrl?: string | null; rows: NotableRow[] }[] = [];
		for (const row of rows) {
			const last = groups[groups.length - 1];
			if (last && last.group === row.group) {
				last.rows.push(row);
			} else {
				groups.push({ group: row.group, groupUrl: row.groupUrl, rows: [row] });
			}
		}
		return groups;
	}

	const styleGroups = $derived(groupRows(byStyle));
	const areaGroups = $derived(groupRows(byArea));
</script>

{#snippet hardestLine(row: NotableRow, showStars = false)}
	<div class="hardest">
		{#if row.hardestGrade}
			<GradeChip grade={row.hardestGrade} band={row.hardestBand} />
		{/if}
		{#if showStars && row.hardestStars}
			<span class="stars">{'★'.repeat(row.hardestStars)}</span>
		{/if}
		{#if row.hardestUrl}
			<a href={row.hardestUrl} target="_blank" rel="noreferrer">{row.hardestRoute}</a>
		{:else}
			{row.hardestRoute}
		{/if}
		{#if row.hardestDate}
			<span class="ago">{row.hardestDate}</span>
		{/if}
	</div>
{/snippet}

{#snippet bandBar(row: NotableRow)}
	<div class="bands">
		{#each row.bandShares as b (b.band)}
			{#if b.count > 0}
				<span style:width="{bandWidth(row, b.band)}%" style:background={b.color}></span>
			{/if}
		{/each}
	</div>
{/snippet}

<article class="panel">
	<h2>Notable ascents</h2>

	<div class="groups">
		{#each styleGroups as g (g.group)}
			<section class="group-block">
				<header class="group-head">
					<StyleBadge style={g.group} />
				</header>
				<ul class="ticks">
					{#each g.rows as row (`${row.group}\0${row.tickType}`)}
						<li class="tick-row">
							<div class="tick-meta">
								<TickTypeIcon tick={row.tickType} />
								<span class="num">{row.count}</span>
							</div>
							{@render bandBar(row)}
							{@render hardestLine(row, true)}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>

	<h3>By area</h3>
	<div class="groups">
		{#each areaGroups as g (g.group)}
			<section class="group-block">
				<header class="group-head">
					{#if g.groupUrl}
						<a class="area" href={g.groupUrl} target="_blank" rel="noreferrer">{g.group}</a>
					{:else}
						<span class="area">{g.group}</span>
					{/if}
				</header>
				<ul class="ticks">
					{#each g.rows as row (`${row.group}\0${row.tickType}`)}
						<li class="tick-row">
							<div class="tick-meta">
								<TickTypeIcon tick={row.tickType} />
								<span class="num">{row.count}</span>
							</div>
							{@render bandBar(row)}
							{@render hardestLine(row)}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
		max-width: 100%;
		min-width: 0;
	}
	h2,
	h3 {
		margin: 0 0 0.75rem;
	}
	h3 {
		margin-top: 1.25rem;
		font-size: 1rem;
		color: var(--ink-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.groups {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}
	.group-block {
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		overflow: hidden;
		background: var(--surface-2);
	}
	.group-head {
		padding: 0.55rem 0.75rem;
		border-bottom: 1px solid var(--line);
		background: var(--surface-2);
	}
	.area {
		font-weight: 700;
		color: inherit;
	}
	.ticks {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.tick-row {
		display: grid;
		grid-template-columns: minmax(7rem, 11rem) 7.5rem minmax(0, 1fr);
		gap: 0.65rem 0.85rem;
		align-items: center;
		padding: 0.55rem 0.75rem;
		border-bottom: 1px solid var(--line);
	}
	.tick-row:last-child {
		border-bottom: none;
	}
	.tick-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		min-width: 0;
	}
	.num {
		font-weight: 700;
		flex-shrink: 0;
	}
	.bands {
		display: flex;
		height: 0.7rem;
		width: 100%;
		max-width: 7.5rem;
		border-radius: 999px;
		overflow: hidden;
		background: color-mix(in srgb, var(--ink) 6%, transparent);
	}
	.bands span {
		display: block;
		height: 100%;
	}
	.hardest {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.5rem;
		align-items: center;
		min-width: 0;
	}
	.stars {
		color: var(--gold);
		font-size: 0.8rem;
	}
	.ago {
		color: var(--ink-muted);
		font-size: 0.8rem;
	}
	a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	@media (max-width: 700px) {
		.tick-row {
			grid-template-columns: 1fr;
			gap: 0.4rem;
		}
		.tick-meta {
			justify-content: flex-start;
			gap: 0.75rem;
		}
		.bands {
			max-width: none;
		}
	}
</style>
