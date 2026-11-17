<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import GradeChip from '#lib/components/GradeChip.svelte';
	import RichText from '#lib/components/RichText.svelte';
	import StyleBadge from '#lib/components/StyleBadge.svelte';
	import type { FirstAscentStats } from '#lib/types/dashboard';
	import { formatDateTime, formatNumber, DEFAULT_DATE_DISPLAY, type DateDisplay } from '#lib/dates';

	type Props = { data: FirstAscentStats; canEdit: boolean; dateDisplay?: DateDisplay };
	let { data, canEdit, dateDisplay = DEFAULT_DATE_DISPLAY }: Props = $props();
	const i18n = useI18n();

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
	<h2><a href="/logbook?fa=any">{i18n.t('cards.firstAscents.titleFirstAscents')}</a></h2>
	{#if data.total === 0 && data.routesSet === 0}
		<p class="empty">
			<RichText
				message={i18n.t('cards.firstAscents.emptyNoFirstAscents')}
				tokens={{
					logbook: {
						kind: 'link',
						text: i18n.t('cards.firstAscents.linkLogbook'),
						href: '/logbook'
					}
				}}
			/>
		</p>
	{:else}
		<div class="tiles">
			{#if data.total > 0}
				<div class="tile">
					<strong>{data.total}</strong>
					<span>{i18n.t('cards.firstAscents.tileFirstAscents', { count: data.total })}</span>
				</div>
			{/if}
			{#if data.routesSet > 0}
				<div class="tile">
					<strong>{data.routesSet}</strong>
					<span>{i18n.t('cards.firstAscents.tileRoutesSet', { count: data.routesSet })}</span>
				</div>
			{/if}
			{#if data.routesWithCommunityData > 0}
				<div class="tile">
					<strong>{formatNumber(data.communityAscents, dateDisplay)}</strong>
					<span>{i18n.t('cards.firstAscents.tileCommunityAscents')}</span>
				</div>
				<div class="tile">
					<strong>{formatNumber(data.sportOrBoltedCommunityAscents, dateDisplay)}</strong>
					<span>{i18n.t('cards.firstAscents.tileOnSportBolted')}</span>
				</div>
			{/if}
			{#if data.ffa > 0}
				<div class="tile">
					<strong>{data.fa} / {data.ffa}</strong>
					<span>{i18n.t('cards.firstAscents.tileFaFfa')}</span>
				</div>
			{/if}
			{#if years}
				<div class="tile">
					<strong>{years}</strong>
					<span
						>{i18n.t('cards.firstAscents.tileYears', {
							count: data.firstYear === data.latestYear ? 1 : 2
						})}</span
					>
				</div>
			{/if}
		</div>

		{#if data.routeRange || data.boulderRange}
			<dl class="ranges">
				{#if data.routeRange}
					<dt>{i18n.t('cards.firstAscents.labelRoutes')}</dt>
					<dd>
						<GradeChip grade={data.routeRange.min} band={data.routeRange.minBand} />
						{#if data.routeRange.max !== data.routeRange.min}
							<span aria-hidden="true">→</span>
							<GradeChip grade={data.routeRange.max} band={data.routeRange.maxBand} />
						{/if}
					</dd>
				{/if}
				{#if data.boulderRange}
					<dt>{i18n.t('cards.firstAscents.labelBoulders')}</dt>
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
			<h3>{i18n.t('cards.firstAscents.titleLatest')}</h3>
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
					<a href="/logbook?fa=any"
						>{i18n.t('cards.firstAscents.moreInLogbook', {
							count: formatNumber(latestMore, dateDisplay)
						})}</a
					>
				</p>
			{/if}
		{/if}

		{#if communityPreview.length > 0}
			<h3>{i18n.t('cards.firstAscents.titleCommunityByRoute')}</h3>
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
								{#if r.fromSetter}<span class="kind setter"
										>{i18n.t('cards.firstAscents.labelSet')}</span
									>{/if}
								{#if r.styleLabel}<StyleBadge style={r.styleLabel} />{/if}
							</span>
							<div class="sub">
								{#if r.ascentCountFetchedAt}
									{i18n.t('cards.firstAscents.countFetched', {
										date: formatDateTime(r.ascentCountFetchedAt, dateDisplay, {
											dateStyle: 'medium'
										})
									})}
								{:else if r.othersAscents == null}
									{i18n.t('cards.firstAscents.noPairedCountYet')}
								{:else}
									{i18n.t('cards.firstAscents.fetchTimeUnknown')}
								{/if}
							</div>
						</div>
						{#if r.othersAscents == null}
							<span class="missing">{i18n.t('cards.firstAscents.labelUnavailable')}</span>
						{:else}
							<strong class="est">{formatNumber(r.othersAscents, dateDisplay)}</strong>
						{/if}
					</li>
				{/each}
			</ul>
			{#if communityMore > 0}
				<p class="more">
					{i18n.t('cards.firstAscents.moreCreditedRoutes', {
						count: formatNumber(communityMore, dateDisplay)
					})}
				</p>
			{/if}
		{/if}
	{/if}
	<p class="foot">
		{#if data.imported > 0 || data.routesSet > 0}
			{i18n.t('cards.firstAscents.footIncludesCredits')}
		{/if}
		{#if data.routesWithCommunityData > 0}
			{i18n.t('cards.firstAscents.footCommunityCoverage', {
				routesWithCommunityData: formatNumber(data.routesWithCommunityData, dateDisplay),
				routesPutUp: formatNumber(data.routesPutUp, dateDisplay)
			})}
			{#if data.routesWithCommunityData < data.routesPutUp}{i18n.t(
					'cards.firstAscents.footSomeUnavailable'
				)}{/if}
		{:else if data.routesPutUp > 0}
			{i18n.t('cards.firstAscents.footCommunityUnavailable', {
				count: formatNumber(data.routesPutUp, dateDisplay)
			})}
			{#if canEdit}<a href="/settings">{i18n.t('cards.firstAscents.linkImportRouteHistory')}</a
				>.{/if}
		{/if}
		<a class="how" href="/docs/first-ascents">{i18n.t('common.howItWorks')}</a>
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
	.empty :global(a),
	.foot :global(a) {
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
