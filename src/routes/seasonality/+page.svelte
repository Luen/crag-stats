<script lang="ts">
	import { monthLabels, useI18n } from '#lib/i18n';
	import SeasonalityStrip from '#lib/components/SeasonalityStrip.svelte';
	import { seasonalityHref } from '#lib/seasonality';
	import { formatNumber } from '#lib/dates';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	const i18n = useI18n();
	const t = i18n.t;
	const MONTHS = $derived(monthLabels(t));
</script>

<svelte:head>
	<title>{t('pages.seasonality.pageTitle')}</title>
	<meta name="description" content={t('pages.seasonality.pageDescription')} />
</svelte:head>

<section class="panel intro">
	<h1>{i18n.t('pages.seasonality.titleSeasonalitySearch')}</h1>
	<p>
		{t('pages.seasonality.intro')}
		<a class="how" href="/docs/best-months">{t('common.howItWorks')}</a>
	</p>
	<p>
		{t('pages.seasonality.coverage', {
			covered: formatNumber(data.coverage.covered, data.dateDisplay),
			total: formatNumber(data.coverage.total, data.dateDisplay)
		})}
	</p>
</section>

<form class="panel filters" method="GET" action="/seasonality">
	<label
		>{t('pages.seasonality.labelMonth')}<select name="month" value={data.filters.month}>
			{#each MONTHS as label, i (label)}<option value={i + 1}>{label}</option>{/each}
		</select></label
	>
	<label class="search"
		>{t('pages.seasonality.labelSearch')}<input
			name="q"
			type="search"
			value={data.filters.q}
			placeholder={i18n.t('pages.seasonality.placeholderSearchYourCachedClimbs')}
		/></label
	>
	<label
		>{t('pages.seasonality.labelShow')}<select name="view" value={data.filters.view}
			><option value="crags">{i18n.t('pages.seasonality.optionCrags')}</option><option
				value="routes">{i18n.t('pages.seasonality.optionClimbs')}</option
			></select
		></label
	>
	<label
		>{t('pages.seasonality.labelSortBy')}<select name="sort" value={data.filters.sort}
			><option value="season">{i18n.t('pages.seasonality.optionSelectedMonth')}</option><option
				value="name">{i18n.t('pages.seasonality.optionName')}</option
			></select
		></label
	>
	{#if data.filters.crag}<input type="hidden" name="crag" value={data.filters.crag} />{/if}
	<button type="submit">{i18n.t('pages.seasonality.buttonSearch')}</button>
</form>

{#if data.filters.crag}
	<p class="scope">
		{t('pages.seasonality.scopeAt', { crag: data.cragName })}
		<a href={seasonalityHref(data.filters, { crag: '', page: 1 })}
			>{t('pages.seasonality.searchAllCrags')}</a
		>
	</p>
{/if}
<p class="explanation">
	{t('pages.seasonality.explanation', {
		count: formatNumber(data.total, data.dateDisplay),
		noun:
			data.filters.view === 'crags'
				? t('pages.seasonality.nounCrags')
				: t('pages.seasonality.nounClimbs'),
		month: MONTHS[data.filters.month - 1] ?? ''
	})}
</p>

{#if data.results.length === 0}
	<section class="panel empty">
		<h2>{i18n.t('pages.seasonality.titleNoSeasonalityResults')}</h2>
		<p>
			{data.coverage.total
				? t('pages.seasonality.noMatchingClimbsWithData')
				: t('pages.seasonality.noLoggedClimbsMatch')}
			{t('pages.seasonality.tryAnotherName')}
		</p>
		<p>
			{t('pages.seasonality.coverageHint')}
			<a href="/docs/best-months">{t('pages.seasonality.learnAboutCoverage')}</a>
		</p>
	</section>
{:else}
	<ul class="results">
		{#each data.results as result (result.key)}
			<li class="panel result">
				<h2>{result.name}</h2>
				{#if result.context}<p class="context">{result.context}</p>{/if}
				<p class="score">
					<strong
						>{result.relative == null
							? t('pages.seasonality.noSeasonalSignal')
							: t('pages.seasonality.percentOfAnnualPeak', {
									percent: Math.round(result.relative * 100)
								})}</strong
					><br />{t('pages.seasonality.monthValue', {
						month: MONTHS[data.filters.month - 1] ?? '',
						value: result.value.toFixed(1)
					})}
				</p>
				{#if data.filters.view === 'crags'}<p class="coverage">
						{t('pages.seasonality.loggedClimbsWithData', {
							covered: result.covered,
							total: result.total
						})}
					</p>{/if}
				<SeasonalityStrip values={result.curve} month={data.filters.month} name={result.name} />
				<div class="links">
					{#if data.filters.view === 'crags'}
						<a href={seasonalityHref(data.filters, { view: 'routes', crag: result.crag, page: 1 })}
							>{t('pages.seasonality.viewClimbsAt', { name: result.name })}</a
						>
					{:else if result.logbookHref}
						<a href={result.logbookHref}
							>{t('pages.seasonality.viewInLogbook', { name: result.name })}</a
						>
					{/if}
					{#if result.guidebookHref}<a href={result.guidebookHref} target="_blank" rel="noreferrer"
							>{t('pages.seasonality.onTheCrag', { name: result.name })}</a
						>{/if}
				</div>
			</li>
		{/each}
	</ul>
{/if}

{#if data.pages > 1}
	<nav class="pagination" aria-label={i18n.t('pages.seasonality.ariaSeasonalityResultsPages')}>
		{#if data.page > 1}<a href={seasonalityHref(data.filters, { page: data.page - 1 })}
				>{t('pages.seasonality.buttonPrevious')}</a
			>{/if}
		<span>{t('pages.seasonality.pageOf', { page: data.page, pages: data.pages })}</span>
		{#if data.page < data.pages}<a href={seasonalityHref(data.filters, { page: data.page + 1 })}
				>{t('pages.seasonality.buttonNext')}</a
			>{/if}
	</nav>
{/if}

<style>
	.intro,
	.filters,
	.result,
	.empty {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.intro {
		margin-bottom: 0.85rem;
	}
	h1 {
		font-size: 1.45rem;
		margin: 0 0 0.5rem;
	}
	h2 {
		font-size: 1.05rem;
		margin: 0;
		overflow-wrap: anywhere;
	}
	p {
		line-height: 1.5;
	}
	.intro p {
		margin: 0.5rem 0 0;
		color: var(--ink-muted);
	}
	a {
		color: var(--accent);
		text-decoration: underline;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 0.75rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.85rem;
		font-weight: 600;
		min-width: 0;
	}
	input,
	select {
		background: var(--paper);
		color: var(--ink);
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		padding: 0.5rem;
		width: 100%;
		box-sizing: border-box;
	}
	.search {
		flex: 1 1 15rem;
	}
	button {
		background: var(--paper);
		color: var(--ink);
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		font: inherit;
		cursor: pointer;
		padding: 0.5rem 0.9rem;
	}
	.explanation,
	.scope {
		color: var(--ink-muted);
		font-size: 0.88rem;
	}
	.results {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 21rem), 1fr));
		gap: 0.85rem;
	}
	.result {
		min-width: 0;
	}
	.context {
		font-size: 0.83rem;
		color: var(--ink-muted);
		overflow-wrap: anywhere;
		margin: 0.35rem 0;
	}
	.score {
		margin: 0.75rem 0 0;
	}
	.coverage {
		font-size: 0.82rem;
		color: var(--ink-muted);
		margin: 0.3rem 0;
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem 1rem;
		margin-top: 1rem;
		font-size: 0.85rem;
	}
	.links a {
		overflow-wrap: anywhere;
	}
	.pagination {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
		padding: 1rem 0;
	}
</style>
