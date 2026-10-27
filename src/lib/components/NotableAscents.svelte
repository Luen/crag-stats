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

	/** theCrag-style: rowspan the group column while tick types stack underneath. */
	function withRowspans(rows: NotableRow[]) {
		const counts = new Map<string, number>();
		for (const r of rows) counts.set(r.group, (counts.get(r.group) ?? 0) + 1);
		let prev: string | null = null;
		return rows.map((row) => {
			const first = row.group !== prev;
			prev = row.group;
			return {
				row,
				showGroup: first,
				rowspan: first ? (counts.get(row.group) ?? 1) : 0
			};
		});
	}

	const styleRows = $derived(withRowspans(byStyle));
	const areaRows = $derived(withRowspans(byArea));
</script>

<article class="panel">
	<h2>Notable ascents</h2>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>By style</th>
					<th>By type</th>
					<th>Diff. band</th>
					<th>Ascents</th>
					<th>Hardest ascent</th>
				</tr>
			</thead>
			<tbody>
				{#each styleRows as { row, showGroup, rowspan } (row.group + row.tickType)}
					<tr>
						{#if showGroup}
							<td class="group" {rowspan}><StyleBadge style={row.group} /></td>
						{/if}
						<td><TickTypeIcon tick={row.tickType} /></td>
						<td>
							<div class="bands">
								{#each row.bandShares as b (b.band)}
									{#if b.count > 0}
										<span style:width="{bandWidth(row, b.band)}%" style:background={b.color}></span>
									{/if}
								{/each}
							</div>
						</td>
						<td class="num">{row.count}</td>
						<td class="hardest">
							{#if row.hardestGrade}
								<GradeChip grade={row.hardestGrade} band={row.hardestBand} />
							{/if}
							{#if row.hardestStars}
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
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<h3>By area</h3>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Area</th>
					<th>By type</th>
					<th>Diff. band</th>
					<th>Ascents</th>
					<th>Hardest ascent</th>
				</tr>
			</thead>
			<tbody>
				{#each areaRows as { row, showGroup, rowspan } (row.group + row.tickType)}
					<tr>
						{#if showGroup}
							<td class="group" {rowspan}>
								{#if row.groupUrl}
									<a href={row.groupUrl} target="_blank" rel="noreferrer">{row.group}</a>
								{:else}
									{row.group}
								{/if}
							</td>
						{/if}
						<td><TickTypeIcon tick={row.tickType} /></td>
						<td>
							<div class="bands">
								{#each row.bandShares as b (b.band)}
									{#if b.count > 0}
										<span style:width="{bandWidth(row, b.band)}%" style:background={b.color}></span>
									{/if}
								{/each}
							</div>
						</td>
						<td class="num">{row.count}</td>
						<td class="hardest">
							{#if row.hardestGrade}
								<GradeChip grade={row.hardestGrade} band={row.hardestBand} />
							{/if}
							{#if row.hardestUrl}
								<a href={row.hardestUrl} target="_blank" rel="noreferrer">{row.hardestRoute}</a>
							{:else}
								{row.hardestRoute}
							{/if}
							{#if row.hardestDate}
								<span class="ago">{row.hardestDate}</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
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
		padding: 0.45rem 0.4rem;
		border-bottom: 1px solid var(--line);
		vertical-align: middle;
	}
	th {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--ink-muted);
	}
	.group {
		font-weight: 700;
		vertical-align: top;
		padding-top: 0.65rem;
	}
	.num {
		font-weight: 700;
	}
	.bands {
		display: flex;
		height: 0.7rem;
		width: 7rem;
		border-radius: 999px;
		overflow: hidden;
		background: rgba(28, 36, 24, 0.06);
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
	}
	.stars {
		color: #d4a017;
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
	.group a {
		color: inherit;
	}
</style>
