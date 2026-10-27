<script lang="ts">
	import { BAND_DOCS, TICK_DOCS } from '#lib/docs';
	import {
		bandFromEwbank,
		bandFromVScale,
		convertFromVScale,
		ewbankToFrench,
		ewbankToYds,
		formatVScaleLabel,
		GRADE_BANDS
	} from '#lib/grades';

	/** Generated tables embedded in docs pages via `<!-- component:name -->`. */
	let { name }: { name: string } = $props();

	const routeRows = Array.from({ length: 39 }, (_, i) => i + 1).map((ew) => ({
		ew,
		fr: ewbankToFrench(ew) ?? '—',
		yds: ewbankToYds(ew) ?? '—',
		band: bandFromEwbank(ew)
	}));
	const boulderRows = [
		-1.5,
		-1,
		-0.5,
		-0.3,
		0,
		0.3,
		...Array.from({ length: 17 }, (_, i) => i + 1)
	].map((v) => ({
		v: formatVScaleLabel(v),
		font: convertFromVScale(v, 'font'),
		band: bandFromVScale(v)
	}));
</script>

{#if name === 'grade-bands'}
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th>Band</th><th>Routes (Ewbank)</th><th>Boulders</th><th>What it means</th></tr>
			</thead>
			<tbody>
				{#each GRADE_BANDS as band (band.id)}
					<tr>
						<td><span class="band" style:--c={band.color}>{band.name}</span></td>
						<td class="num">{BAND_DOCS[band.id].routes}</td>
						<td class="num">{BAND_DOCS[band.id].boulders}</td>
						<td>{BAND_DOCS[band.id].text}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else if name === 'route-conversions'}
	<div class="table-wrap tall">
		<table>
			<thead><tr><th>Ewbank</th><th>French</th><th>YDS</th><th>Band</th></tr></thead>
			<tbody>
				{#each routeRows as r (r.ew)}
					<tr style:--c={r.band?.color}>
						<td class="num strong">{r.ew}</td>
						<td class="num">{r.fr}</td>
						<td class="num">{r.yds}</td>
						<td><span class="dot"></span>{r.band?.name}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else if name === 'boulder-conversions'}
	<div class="table-wrap tall">
		<table>
			<thead><tr><th>V-scale</th><th>Font</th><th>Band</th></tr></thead>
			<tbody>
				{#each boulderRows as r (r.v)}
					<tr style:--c={r.band?.color}>
						<td class="num strong">{r.v}</td>
						<td class="num">{r.font}</td>
						<td><span class="dot"></span>{r.band?.name}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else if name === 'tick-types'}
	{#each TICK_DOCS as g (g.group)}
		<h3>{g.group} <small>{g.styles}</small></h3>
		<div class="table-wrap">
			<table>
				<tbody>
					{#each g.ticks as t (t.name)}
						<tr>
							<td class="strong nowrap">{t.name}</td>
							<td>{t.meaning}</td>
							<td class="nowrap"
								><span class="kind" class:send={t.send}>{t.send ? 'Send' : 'Attempt'}</span></td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/each}
{/if}

<style>
	.table-wrap {
		overflow-x: auto;
		margin: 0.75rem 0 1.25rem;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
	}
	.table-wrap.tall {
		max-height: 26rem;
		overflow-y: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th {
		position: sticky;
		top: 0;
		background: var(--surface-2);
		color: var(--ink-muted);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		text-align: left;
		padding: 0.6rem 0.75rem;
	}
	td {
		padding: 0.5rem 0.75rem;
		border-top: 1px solid var(--line);
		vertical-align: top;
	}
	.num {
		font-variant-numeric: tabular-nums;
	}
	.strong {
		font-weight: 700;
	}
	.nowrap {
		white-space: nowrap;
	}
	.band {
		display: inline-block;
		padding: 0.15rem 0.6rem;
		border-radius: 999px;
		font-weight: 700;
		font-size: 0.8rem;
		white-space: nowrap;
		background: color-mix(in srgb, var(--c) 22%, var(--paper));
		border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
	}
	.dot {
		display: inline-block;
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		margin-right: 0.45rem;
		background: var(--c);
	}
	tr[style] td:first-child {
		box-shadow: inset 3px 0 0 var(--c);
	}
	h3 {
		margin: 1.25rem 0 0;
		font-size: 1rem;
	}
	h3 small {
		margin-left: 0.4rem;
		font-weight: 500;
		color: var(--ink-muted);
		font-size: 0.8rem;
	}
	.kind {
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		color: var(--ink-muted);
		background: var(--surface-3);
	}
	.kind.send {
		color: color-mix(in srgb, var(--band-beginner) 45%, var(--ink));
		background: color-mix(in srgb, var(--band-beginner) 16%, var(--paper));
	}
</style>
