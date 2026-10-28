<script lang="ts">
	import type { EddingtonMilestoneTable } from '#lib/types/dashboard';

	type Props = { tables: EddingtonMilestoneTable[] };
	let { tables }: Props = $props();

	function thresholdLabel(table: EddingtonMilestoneTable, target: number): string {
		if (table.key === 'vertical') {
			const m = target * table.unit;
			return `${target} days · ${m}+ m`;
		}
		if (table.key === 'boulderGrade') return `V${target}+ · ${target} problems`;
		if (table.key === 'routeGrade') return `Ewbank ${target}+ · ${target} routes`;
		return `${target}+ sends · ${target} days`;
	}
</script>

<section class="milestones">
	<h2>Upcoming milestones</h2>
	<p class="lead">
		How many qualifying days or routes you already have toward the next Eddington numbers.
	</p>

	<div class="grid">
		{#each tables as table (table.key)}
			<article class="panel">
				<h3>{table.label}</h3>
				<table>
					<thead>
						<tr>
							<th scope="col">Target E</th>
							<th scope="col">Have</th>
							<th scope="col">Need</th>
							<th scope="col">Progress</th>
						</tr>
					</thead>
					<tbody>
						{#each table.rows as row (row.target)}
							<tr>
								<td>
									<span class="target">{row.target}</span>
									<span class="thresh">{thresholdLabel(table, row.target)}</span>
								</td>
								<td>{row.have}</td>
								<td>{row.needed}</td>
								<td>
									<div class="bar" role="presentation">
										<div class="fill" style:width="{row.progress * 100}%"></div>
									</div>
									<span class="sr">{Math.round(row.progress * 100)}% toward {row.target}</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</article>
		{/each}
	</div>
</section>

<style>
	.milestones h2 {
		margin: 0 0 0.35rem;
		font-size: 1.05rem;
	}
	.lead {
		margin: 0 0 1rem;
		color: var(--ink-muted);
		font-size: 0.88rem;
	}
	.grid {
		display: grid;
		gap: 0.85rem;
	}
	.panel {
		padding: 1rem 1.1rem;
		border-radius: 1rem;
		overflow-x: auto;
	}
	h3 {
		margin: 0 0 0.65rem;
		font-size: 0.95rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}
	th,
	td {
		padding: 0.45rem 0.5rem;
		text-align: left;
		border-bottom: 1px solid var(--line);
		vertical-align: middle;
	}
	th {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--ink-muted);
		font-weight: 600;
	}
	.target {
		display: block;
		font-family: var(--font-display);
		font-size: 1.1rem;
	}
	.thresh {
		display: block;
		font-size: 0.72rem;
		color: var(--ink-muted);
		margin-top: 0.1rem;
	}
	.bar {
		height: 0.45rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--ink) 8%, transparent);
		overflow: hidden;
		min-width: 5rem;
	}
	.fill {
		height: 100%;
		border-radius: inherit;
		background: var(--accent);
		min-width: 2px;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
