<script lang="ts">
	import GradeChip from '#lib/components/GradeChip.svelte';
	import StyleBadge from '#lib/components/StyleBadge.svelte';
	import type { FirstAscentStats } from '#lib/types/dashboard';
	import { formatDateTime, formatNumber, DEFAULT_DATE_DISPLAY, type DateDisplay } from '#lib/dates';

	type Props = { data: FirstAscentStats; canEdit: boolean; dateDisplay?: DateDisplay };
	let { data, canEdit, dateDisplay = DEFAULT_DATE_DISPLAY }: Props = $props();

	const years = $derived(
		data.firstYear == null
			? null
			: data.firstYear === data.latestYear
				? String(data.firstYear)
				: `${data.firstYear}–${data.latestYear}`
	);
	/** Cap lists so the half-width card stays near Hardest sends height. */
	const LATEST_LIMIT = 3;
	const COMMUNITY_LIMIT = 3;
	const latestPreview = $derived(data.recent.slice(0, LATEST_LIMIT));
	const latestMore = $derived(Math.max(0, data.total - latestPreview.length));
	const communityPreview = $derived(data.communityRoutes.slice(0, COMMUNITY_LIMIT));
	const communityMore = $derived(
		Math.max(0, data.communityRoutes.length - communityPreview.length)
	);
</script>

<article class="panel">
	<h2><a href="/logbook?fa=any">First ascents</a></h2>
	{#if data.total === 0 && data.routesSet === 0}
		<p class="empty">
			No first ascents recorded yet. Import them from public theCrag route history, or mark yours
			from the <a href="/logbook">logbook</a> (hover a row, then <strong>Mark FA</strong>).
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
			{#if data.routesWithCommunityData > 0}
				<div class="tile">
					<strong>{formatNumber(data.communityAscents, dateDisplay)}</strong>
					<span>community ascents (estimate)</span>
				</div>
				<div class="tile">
					<strong>{formatNumber(data.sportOrBoltedCommunityAscents, dateDisplay)}</strong>
					<span>on sport / bolted</span>
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

		{#if data.byStyle.length > 0}
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
		{/if}

		{#if latestPreview.length > 0}
			<h3>Latest</h3>
			<ul class="list">
				{#each latestPreview as r (r.routeId)}
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
			{#if latestMore > 0}
				<p class="more">
					<a href="/logbook?fa=any">+{formatNumber(latestMore, dateDisplay)} more in the logbook</a>
				</p>
			{/if}
		{/if}

		{#if communityPreview.length > 0}
			<h3>Community by route</h3>
			<ul class="list community">
				{#each communityPreview as r (r.routeExternalId)}
					<li>
						<div>
							<strong>
								{#if r.url}
									<a href={r.url} target="_blank" rel="noreferrer"
										>{r.routeName ?? r.routeExternalId}</a
									>
								{:else}
									{r.routeName ?? r.routeExternalId}
								{/if}
							</strong>
							<span class="credits">
								{#if r.faKind}<span class="kind">{r.faKind}</span>{/if}
								{#if r.fromSetter}<span class="kind setter">Set</span>{/if}
								{#if r.styleLabel}<StyleBadge style={r.styleLabel} />{/if}
							</span>
							<div class="sub">
								{#if r.ascentCountFetchedAt}
									Count fetched {formatDateTime(r.ascentCountFetchedAt, dateDisplay, {
										dateStyle: 'medium'
									})}
								{:else if r.othersAscents == null}
									No paired count yet
								{:else}
									Fetch time unknown
								{/if}
							</div>
						</div>
						{#if r.othersAscents == null}
							<span class="missing">Unavailable</span>
						{:else}
							<strong class="est">{formatNumber(r.othersAscents, dateDisplay)}</strong>
						{/if}
					</li>
				{/each}
			</ul>
			{#if communityMore > 0}
				<p class="more">+{formatNumber(communityMore, dateDisplay)} more credited routes</p>
			{/if}
		{/if}
	{/if}
	<p class="foot">
		{#if data.imported > 0 || data.routesSet > 0}
			Includes credits imported from theCrag route history.
		{/if}
		{#if data.routesWithCommunityData > 0}
			Cached community estimate covers {formatNumber(data.routesWithCommunityData, dateDisplay)} of
			{formatNumber(data.routesPutUp, dateDisplay)} credited logbook routes and excludes your ticks at
			each fetch.
			{#if data.routesWithCommunityData < data.routesPutUp}Some route counts are unavailable.{/if}
		{:else if data.routesPutUp > 0}
			Community ascents unavailable: 0 of {formatNumber(data.routesPutUp, dateDisplay)} credited logbook
			routes have a paired count snapshot.
			{#if canEdit}<a href="/settings">Import or refresh route history in Settings</a>.{/if}
		{/if}
		<a href="/docs/first-ascents">How it works</a>
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
	h2 a {
		color: var(--ink);
		text-decoration: underline;
		text-decoration-color: transparent;
		text-underline-offset: 0.15em;
	}
	h2 a:hover {
		text-decoration-color: currentColor;
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
	.kind.setter {
		color: var(--accent-2, var(--accent));
	}
	.credits {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		align-items: baseline;
	}
	.community .missing {
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
	.community .est {
		font-family: var(--font-display);
		font-size: 1.05rem;
	}
	.more {
		margin: 0.35rem 0 0;
		color: var(--ink-muted);
		font-size: 0.82rem;
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
