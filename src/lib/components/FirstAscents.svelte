<script lang="ts">
	import GradeChip from '#lib/components/GradeChip.svelte';
	import StyleBadge from '#lib/components/StyleBadge.svelte';
	import type { FirstAscentStats } from '#lib/types/dashboard';

	type Props = { data: FirstAscentStats; canEdit: boolean };
	let { data, canEdit }: Props = $props();

	const years = $derived(
		data.firstYear == null
			? null
			: data.firstYear === data.latestYear
				? String(data.firstYear)
				: `${data.firstYear}–${data.latestYear}`
	);
</script>

<article class="panel">
	<h2>First ascents</h2>
	{#if data.total === 0 && data.routesSet === 0}
		<p class="empty">
			No first ascents marked yet. theCrag keeps first ascents in route history, which its API
			doesn't share, so mark yours from the <a href="/logbook">logbook</a> (hover a row, then
			<strong>Mark FA</strong>).
		</p>
	{:else}
		<div class="tiles">
			{#if data.total > 0}
				<div class="tile">
					<strong>{data.total}</strong>
					<span>first ascent{data.total === 1 ? '' : 's'}</span>
				</div>
			{/if}
			{#if data.routesSet > 0}
				<div class="tile">
					<strong>{data.routesSet}</strong>
					<span>route{data.routesSet === 1 ? '' : 's'} set</span>
				</div>
			{/if}
			{#if data.ffa > 0}
				<div class="tile">
					<strong>{data.fa} / {data.ffa}</strong>
					<span>FA / FFA</span>
				</div>
			{/if}
			{#if years}
				<div class="tile">
					<strong>{years}</strong>
					<span>{data.firstYear === data.latestYear ? 'year' : 'years'}</span>
				</div>
			{/if}
		</div>

		{#if data.routeRange || data.boulderRange}
			<dl class="ranges">
				{#if data.routeRange}
					<dt>Routes</dt>
					<dd>
						<GradeChip grade={data.routeRange.min} band={data.routeRange.minBand} />
						{#if data.routeRange.max !== data.routeRange.min}
							<span aria-hidden="true">→</span>
							<GradeChip grade={data.routeRange.max} band={data.routeRange.maxBand} />
						{/if}
					</dd>
				{/if}
				{#if data.boulderRange}
					<dt>Boulders</dt>
					<dd>
						<GradeChip grade={data.boulderRange.min} band={data.boulderRange.minBand} />
						{#if data.boulderRange.max !== data.boulderRange.min}
							<span aria-hidden="true">→</span>
							<GradeChip grade={data.boulderRange.max} band={data.boulderRange.maxBand} />
						{/if}
					</dd>
				{/if}
			</dl>
		{/if}

		<div
			class="mix"
			role="img"
			aria-label={data.byStyle.map((s) => `${s.style} ${s.count}`).join(', ')}
		>
			{#each data.byStyle as s (s.style)}
				<span style:flex-grow={s.count} style:background={s.color}></span>
			{/each}
		</div>
		<ul class="legend">
			{#each data.byStyle as s (s.style)}
				<li><StyleBadge style={s.style} /> {s.count}</li>
			{/each}
		</ul>

		<h3>Latest</h3>
		<ul class="list">
			{#each data.recent as r (r.routeName + (r.date ?? ''))}
				<li>
					<div>
						<strong>
							{#if r.url}
								<a href={r.url} target="_blank" rel="noreferrer">{r.routeName}</a>
							{:else}
								{r.routeName}
							{/if}
						</strong>
						<span class="kind">{r.kind}</span>
						<div class="sub">
							{[r.cragName, r.date?.slice(0, 4)].filter(Boolean).join(' · ')}
						</div>
					</div>
					<GradeChip grade={r.gradeLabel} band={r.band} />
				</li>
			{/each}
		</ul>
	{/if}
	<p class="foot">
		Marked by you{canEdit ? ' in the logbook' : ''}. <a href="/docs/first-ascents">How it works</a>
	</p>
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
	}
	h3 {
		margin: 1rem 0 0.5rem;
		font-size: 0.85rem;
		color: var(--ink-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.empty {
		margin: 0;
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
	.empty a,
	.foot a {
		text-decoration: underline;
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
		gap: 0.55rem;
	}
	.tile {
		border: 1px solid var(--line);
		border-top: 3px solid var(--accent-2);
		border-radius: 0.65rem;
		padding: 0.65rem 0.6rem;
		text-align: center;
		background: var(--paper);
	}
	.tile strong {
		display: block;
		font-size: 1.45rem;
		line-height: 1.15;
		font-family: var(--font-display);
	}
	.tile span {
		color: var(--ink-muted);
		font-size: 0.8rem;
	}
	.ranges {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.45rem 0.75rem;
		align-items: center;
		margin: 0.9rem 0 0;
	}
	dt {
		font-size: 0.85rem;
		font-weight: 600;
	}
	dd {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--ink-muted);
	}
	.mix {
		display: flex;
		height: 0.6rem;
		margin-top: 0.9rem;
		border-radius: 999px;
		overflow: hidden;
		background: var(--surface-3);
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 0.9rem;
		list-style: none;
		margin: 0.5rem 0 0;
		padding: 0;
		font-size: 0.85rem;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}
	.list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}
	.kind {
		margin-left: 0.35rem;
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--accent);
	}
	.sub {
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
	.foot {
		margin: 0.8rem 0 0;
		color: var(--ink-muted);
		font-size: 0.82rem;
	}
</style>
